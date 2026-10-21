#!/usr/bin/env node
'use strict';

/**
 * mixlayer-bulk-apikey CLI — mint Mixlayer (mixlayer.ai) accounts, one API key
 * each, and keep only the keys that survived a live chat call.
 *
 * Why a real browser: sign-up runs through Clerk (console.mixlayer.com) and its
 * instance captcha is solved by clerk-js *in the page* — a server-side
 * `POST /v1/client/sign_ups` answers `captcha_missing_token`. The console's key
 * route also authenticates from its own page only. So the tool launches a real
 * Chrome over one exit (or direct) and drives the page over CDP with a tiny
 * built-in WebSocket client — still zero dependencies.
 *
 * Flow, per account (browser + panel + live proof through one pinned exit):
 *   1. vet exit   console `/sign-up` answers 200 and mixlayer.ai/v1 is reachable
 *   2. mailbox    Emailnator gmail box (plain form registered). The box is
 *                 recycled and message ids rotate between calls, so the gate is
 *                 the SENDER: only mail from mixlayer/clerk is accepted.
 *   3. browser    Chrome → `/sign-up` → e-mail + password + terms → continue
 *   4. code       poll the inbox for Clerk's 6-digit code, type it in-page
 *   5. account    `/api/cloud/user` → the personal org id
 *   6. key        `POST /api/cloud/organizations/<org>/api_keys` (in-page fetch,
 *                 permissions inference,api-read,api-write)
 *   7. gate       `GET /v1/models` + a real completion → a key is appended to
 *                 keys.txt only after the chat 200 (`content || reasoning_content`)
 *
 * Options:
 *   --count N        accounts (= keys) to mint, serial                     [1]
 *   --model <id>     model used for the live gate      [qwen/qwen3.5-4b-free]
 *   --pool <file>    proxy list, one exit per line (env MIXLAYER_PROXIES) [optional]
 *   --tries N        exit candidates vetted per account                    [3]
 *   --mint-tries N   full sign-up attempts (fresh mailbox + Chrome) per exit  [3]
 *   --gap MS         pause between accounts                                [4000]
 *   --timeout MS     per-request timeout (node side)                      [60000]
 *   --code-timeout S seconds to wait for the e-mail code                    [300]
 *   --key-name <s>   name given to the created key                     [mixlayer-1]
 *   --keys <file>    key file for --verify-only / --connect-9router  [keys.txt]
 *   --headless       run Chrome headless (visible Chrome is the tested rail)
 *   --browser <exe>  Chrome binary (env CHROME_PATH)                     [auto]
 *   --debug-port N   Chrome DevTools port — a free nonzero one by default
 *   --verify-only    re-run every key in the key file through the chat gate
 *   --screen         only test the proxy list (console + API reachability)
 *   --connect-9router  register this provider (and its keys) on a local 9Router
 *   --help
 *
 * Zero dependencies. Node.js >= 18 (the browser-rail uses `fetch` only for the
 * local DevTools endpoint and the local 9Router).
 * Your proxy list is OPTIONAL: pass --pool (or MIXLAYER_PROXIES) and every
 * request — browser included — goes through an exit from it, fail-closed;
 * without a pool the tool connects directly.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const tls = require('tls');
const http = require('http');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const { EventEmitter } = require('events');

const IS_SRC = path.basename(__dirname) === 'src';
const ROOT = IS_SRC ? path.resolve(__dirname, '..') : __dirname;
const KEYS_FILE = path.join(ROOT, 'keys.txt');
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');
const OUT_DIR = path.join(ROOT, 'out');
const SHOTS_DIR = path.join(OUT_DIR, 'shots');

const CONSOLE = 'https://console.mixlayer.com';
const BASE = 'https://mixlayer.ai';
const API = `${BASE}/v1`;
const EMAILNATOR = 'https://www.emailnator.com';
const FREE_MODEL = 'qwen/qwen3.5-4b-free';
const PERMS = ['inference', 'api-read', 'api-write'];
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';

// ------------------------------------------------------------------- options
const argv = process.argv.slice(2);
function arg(name, dflt) {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return dflt;
}
const has = (name) => argv.includes(`--${name}`) || argv.includes(`-${name}`);

if (has('help') || has('h')) {
  console.log(`mixlayer-bulk-apikey — mint Mixlayer accounts, one key each, verified by a live chat call.

  node src/cli.js --count 1          mint (Clerk sign-up in a real Chrome)
  node src/cli.js --verify-only      re-check every key in keys.txt
  node src/cli.js --screen           test your proxy list against Mixlayer
  node src/cli.js --connect-9router  register the provider + its keys on a local 9Router
  node src/cli.js --help

  --count N      accounts to mint, serial                                [1]
  --model <id>   model used for the live gate       [qwen/qwen3.5-4b-free]
  --pool <file>  proxy list, one exit per line (env MIXLAYER_PROXIES)  [optional]
  --tries N      exit candidates vetted per account                      [3]
  --code-timeout S  seconds to wait for the e-mail code, per mailbox try  [300]
  --mint-tries N full sign-up attempts (fresh mailbox each) per exit      [3]
  --keys <file>  key file for --verify-only                [keys.txt]
  --headless     run Chrome headless (visible Chrome is the tested rail)
  --debug-port N Chrome DevTools port — a free nonzero one picked by default

Sign-up runs through Clerk on console.mixlayer.com and its captcha is solved by
clerk-js inside the page, so the tool drives a real Chrome (CDP) over one exit
instead of calling sign-up endpoints directly.

Requests go through the exits in your proxy list when one is provided (--pool or
the MIXLAYER_PROXIES env). Without a pool the tool connects DIRECTLY, and the
run still works where the network reaches console.mixlayer.com.
`);
  process.exit(0);
}

const COUNT = Math.max(1, parseInt(arg('count', '1'), 10) || 1);
const MODEL = arg('model', process.env.MIXLAYER_MODEL || FREE_MODEL);
const TRIES = Math.max(1, parseInt(arg('tries', '3'), 10) || 3);
const GAP_MS = Math.max(0, parseInt(arg('gap', '4000'), 10) || 0);
const TIMEOUT_MS = Math.max(5000, parseInt(arg('timeout', '60000'), 10) || 60000);
const CODE_TIMEOUT_MS = Math.max(30000, (parseInt(arg('code-timeout', '300'), 10) || 300) * 1000);
const MINT_TRIES = Math.max(1, parseInt(arg('mint-tries', '3'), 10) || 3);
/** The chat gate must fail fast: a hung exit costs this per candidate model. */
const GATE_MS = Math.max(15000, Math.min(TIMEOUT_MS, 45000));
const KEY_NAME = arg('key-name', 'mixlayer-1');
const CHROME_BIN = arg('browser', process.env.CHROME_PATH || '');
const DEBUG_PORT = parseInt(arg('debug-port', '0'), 10) || 0; // 0 = auto-pick a free, nonzero port
const HEADLESS = has('headless');
const VERIFY_ONLY = has('verify-only');
const SCREEN = has('screen');
const CONNECT_9ROUTER = has('connect-9router');
const KEYS_ARG = arg('keys', KEYS_FILE);
const KEYS_PATH = path.isAbsolute(KEYS_ARG) ? KEYS_ARG : fs.existsSync(KEYS_ARG) ? path.resolve(KEYS_ARG) : path.resolve(ROOT, KEYS_ARG);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT_DIR, { recursive: true });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const rand = (n) => crypto.randomBytes(32).toString('hex').slice(0, n);

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

// ------------------------------------------------------- fail-class ledger
/** One line per failure: {ts, account, exit, class, stage, detail} in out/attempts.jsonl. */
function ledger(rec) {
  try {
    fs.appendFileSync(path.join(OUT_DIR, 'attempts.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ...rec }) + '\n');
  } catch (e) { /* diagnostics must never break the run */ }
}
function classify(e) {
  const m = String((e && e.message) || e || '');
  if (/already|exists|in use/i.test(m)) return 'account-exists';
  if (/verification code|no verification code/i.test(m)) return 'mail';
  if (/code input never|never reached \/app/i.test(m)) return 'clerk';
  if (/org|api_key|no key/i.test(m)) return 'token';
  if (/chat gate|no model answered/i.test(m)) return 'chat-gate';
  if (/chrome|websocket|DevTools/i.test(m)) return 'browser';
  if (/proxy|connect|timeout|socket|ECONN|EPIPE|reset|TLS/i.test(m)) return 'exit';
  return 'other';
}

// ------------------------------------------------------------------- proxy
function parseProxy(line) {
  const s = String(line || '').trim();
  if (!s || s.startsWith('#') || s.startsWith('//')) return null;
  let m = s.match(/^(https?|socks5h?|socks4a?):\/\/(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)/i);
  if (!m) m = s.match(/^(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)$/);
  if (!m) return null;
  if (m.length === 6) {
    const raw = m[1].toLowerCase();
    if (raw === 'socks4' || raw === 'socks4a') return null; // not supported by this client
    const protocol = raw.startsWith('socks') ? 'socks5' : 'http';
    return { protocol, host: m[4], port: Number(m[5]), username: m[2] || undefined, password: m[3] || undefined, line: s };
  }
  return { protocol: 'http', host: m[3], port: Number(m[4]), username: m[1] || undefined, password: m[2] || undefined, line: s };
}
const labelOf = (p) => (p ? `${p.protocol}://${p.host}:${p.port}` : '(direct)');

/** A raw socket straight to host:port — direct-mode twin of connectThrough. */
function directConnect(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host, port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`connect timeout (${host}:${port})`)); }, timeoutMs);
    sock.once('error', (e) => { clearTimeout(t); try { sock.destroy(); } catch {} reject(new Error(`connect failed: ${e.message}`)); });
    sock.once('connect', () => { clearTimeout(t); resolve(sock); });
  });
}

function connectThrough(proxy, host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: proxy.host, port: proxy.port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`proxy timeout (${proxy.host}:${proxy.port})`)); }, timeoutMs);
    const done = (err, s) => { clearTimeout(t); if (err) { try { sock.destroy(); } catch {} reject(err); } else resolve(s); };
    sock.once('error', (e) => done(new Error(`proxy connect failed: ${e.message}`)));
    sock.once('connect', () => {
      if (proxy.protocol === 'socks5') {
        sock.write(proxy.username ? Buffer.from([5, 2, 0, 2]) : Buffer.from([5, 1, 0]));
        let stage = 0;
        let buf = Buffer.alloc(0);
        const sendConnect = () => {
          const hb = Buffer.from(host);
          sock.write(Buffer.concat([Buffer.from([5, 1, 0, 3, hb.length]), hb, Buffer.from([port >> 8, port & 0xff])]));
        };
        const onData = (d) => {
          try {
            buf = Buffer.concat([buf, d]);
            for (;;) {
              if (stage === 0) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[0] !== 5) return done(new Error('SOCKS5 bad version'));
                if (v[1] === 2) {
                  if (!proxy.username) return done(new Error('SOCKS5 auth required'));
                  const u = Buffer.from(proxy.username || '');
                  const p = Buffer.from(proxy.password || '');
                  sock.write(Buffer.concat([Buffer.from([1, u.length]), u, Buffer.from([p.length]), p]));
                  stage = 1;
                  continue;
                }
                if (v[1] !== 0) return done(new Error('SOCKS5 no acceptable method'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 1) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[1] !== 0) return done(new Error('SOCKS5 auth failed'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 2) {
                if (buf.length < 5) return;
                const atyp = buf[3];
                const need = 4 + (atyp === 1 ? 4 : atyp === 3 ? 1 + buf[4] : 16) + 2;
                if (buf.length < need) return;
                const rep = buf[1]; buf = buf.slice(need);
                if (rep !== 0) return done(new Error(`SOCKS5 connect failed (code ${rep})`));
                sock.off('data', onData);
                return done(null, sock);
              }
            }
          } catch (e) { done(e); }
        };
        sock.on('data', onData);
        return;
      }
      const auth = proxy.username ? `Proxy-Authorization: Basic ${Buffer.from(`${proxy.username}:${proxy.password || ''}`).toString('base64')}\r\n` : '';
      sock.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n${auth}\r\n`);
      let buf = '';
      const onData = (d) => {
        buf += d;
        if (!buf.includes('\r\n\r\n')) return;
        sock.off('data', onData);
        if (!/^HTTP\/\d(\.\d)? 200/.test(buf)) return done(new Error(`proxy CONNECT refused: ${buf.split('\r\n')[0]}`));
        done(null, sock);
      };
      sock.on('data', onData);
    });
  });
}

/** One HTTPS request through one exit (or direct). Redirects are followed on demand. */
async function exitFetch(proxy, url, { method = 'GET', headers = {}, body = null, timeoutMs = TIMEOUT_MS, redirects = 0 } = {}) {
  let current = url;
  for (let hop = 0; ; hop++) {
    const u = new URL(current);
    const raw = proxy ? await connectThrough(proxy, u.hostname, u.port || 443, Math.min(timeoutMs, 20000)) : await directConnect(u.hostname, u.port || 443, Math.min(timeoutMs, 20000));
    const sock = tls.connect({ socket: raw, servername: u.hostname });
    try {
      await withTimeout(
        new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); }),
        timeoutMs,
        `TLS handshake timeout (${u.hostname})`
      );
      const payload = body == null ? null : Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
      const r = await withTimeout(
        new Promise((resolve, reject) => {
          const req = http.request(
            {
              method,
              path: u.pathname + u.search,
              createConnection: () => sock,
              headers: {
                host: u.host,
                'user-agent': UA,
                accept: '*/*',
                connection: 'close',
                ...(payload ? { 'content-type': 'application/json', 'content-length': payload.length } : {}),
                ...headers,
              },
            },
            (res) => {
              const chunks = [];
              res.on('data', (c) => chunks.push(c));
              res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
            }
          );
          req.on('error', reject);
          if (payload) req.write(payload);
          req.end();
        }),
        timeoutMs,
        'request timeout'
      );
      try { sock.destroy(); } catch {}
      const loc = r.headers.location;
      if ([301, 302, 303, 307, 308].includes(r.status) && loc && hop < redirects) {
        const next = new URL(loc, current).toString();
        if (!next.startsWith('https://')) return { ...r, url: current };
        current = next;
        continue;
      }
      return { ...r, url: current };
    } catch (e) {
      try { sock.destroy(); } catch {}
      throw e;
    }
  }
}

async function exitJson(proxy, url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.body != null && !Buffer.isBuffer(opts.body)) headers['content-type'] = headers['content-type'] || 'application/json';
  const r = await exitFetch(proxy, url, { ...opts, headers });
  let json = null;
  try { json = JSON.parse(r.body); } catch { /* not json */ }
  return { status: r.status, json, text: r.body, headers: r.headers };
}

// ------------------------------------------------------------------- pool
function loadExits() {
  const poolArg = arg('pool', process.env.MIXLAYER_PROXIES || 'proxies.txt');
  const poolFile = fs.existsSync(poolArg) ? path.resolve(poolArg) : path.resolve(ROOT, poolArg);
  if (!fs.existsSync(poolFile)) {
    // No pool = DIRECT mode: the tool works without a proxy too.
    console.log(`no proxy list at ${poolFile} — running WITHOUT a proxy (direct).`);
    return [null];
  }
  const lines = fs.readFileSync(poolFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const exits = [];
  let skipped = 0;
  for (const line of lines) {
    const p = parseProxy(line);
    if (!p) { skipped++; continue; }
    // Chrome cannot authenticate to a SOCKS5 proxy; such lines are unusable in
    // the browser rail and are dropped here (fail-closed, never silently direct).
    if (p.protocol === 'socks5' && p.username) { skipped++; continue; }
    exits.push(p);
  }
  if (skipped) console.log(`pool: ${skipped} line(s) skipped (unparsable or socks5-with-auth — Chrome cannot use those)`);
  if (!exits.length) throw new Error(`${poolFile} has no usable exits`);
  return exits;
}

/** Exit vet: the console sign-up must answer 200 and the API host must resolve. */
async function vetExit(exit) {
  const t0 = Date.now();
  const su = await exitFetch(exit, `${CONSOLE}/sign-up`, { timeoutMs: 25000, redirects: 3 });
  if (su.status !== 200) return { ok: false, why: `console /sign-up ${su.status}` };
  let api = { status: 0 };
  try {
    api = await exitFetch(exit, `${API}/models`, { timeoutMs: 25000 });
  } catch (e) {
    return { ok: false, why: `api unreachable: ${String(e.message).slice(0, 60)}` };
  }
  // No key here, so 401/403/404 all prove reachability; only a network failure is fatal.
  return { ok: true, ms: Date.now() - t0, api: api.status, signupBytes: su.body.length };
}

async function screen(exits) {
  let ok = 0;
  for (const e of exits) {
    try {
      const v = await vetExit(e);
      if (v.ok) ok++;
      console.log(`  ${v.ok ? '✔' : '✘'} ${labelOf(e)} ${v.ok ? `ok ${v.ms}ms (api ${v.api})` : v.why}`);
    } catch (err) {
      console.log(`  ✘ ${labelOf(e)} ${String(err.message).slice(0, 90)}`);
    }
  }
  console.log(`screened ${exits.length} exit(s): ${ok} pass the console + api gates`);
  return ok;
}

// ------------------------------------------------------------------- mail
const emailnator = {
  headers: { origin: EMAILNATOR, referer: `${EMAILNATOR}/` },
  async json(exit, p, opts = {}) {
    return exitJson(exit, `${EMAILNATOR}${p}`, { ...opts, headers: { ...this.headers, ...(opts.headers || {}) } });
  },
};

async function newMailbox(exit) {
  const r = await emailnator.json(exit, '/api/generate-email', { method: 'POST', body: { ids: [3] } });
  const dotted = r.json && r.json.email;
  if (!dotted || !/@gmail\.com$/i.test(dotted)) throw new Error(`emailnator generate ${r.status}: ${String(r.text).slice(0, 120)}`);
  const [local, domain] = dotted.split('@');
  return { provider: 'emailnator', dotted, address: `${local.replace(/\./g, '')}@${domain}` };
}

const inboxList = async (exit, box) => {
  const r = await emailnator.json(exit, '/api/message-list', { method: 'POST', body: { email: box.address, limit: 20 } });
  return (r.json && r.json.messages) || [];
};

/**
 * A fresh Emailnator box. The rail recycles addresses: a box whose inbox is
 * nothing but the provider's own "Upgrade to Premium" wall never indexes new
 * mail, so it is dropped and another one is asked for.
 */
async function pickMailbox(exit, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const box = await newMailbox(exit);
    const msgs = await inboxList(exit, box).catch(() => []);
    const wall = msgs.filter((m) => /locked sender|upgrade to premium/i.test(`${m.from || ''} ${m.subject || ''}`));
    if (!msgs.length || wall.length < msgs.length) return box;
    log(`  mailbox ${box.address} is an expired box (${msgs.length} locked messages) — asking for another`);
  }
  throw new Error('every mailbox the rail offered was an expired/locked box');
}
const inboxRead = async (exit, box, id) => (await emailnator.json(exit, `/api/message/${encodeURIComponent(id)}`)).json || {};
/** Message ids already in the (recycled) box before this run — never accepted. */
async function baseline(exit, box) {
  try {
    return new Set((await inboxList(exit, box)).map((m) => String(m.id)));
  } catch (e) {
    return new Set();
  }
}

/**
 * A recycled gmail box is full of other panels' mail — lamp spam, SHEIN ads,
 * other panels' codes. Only the panel's own sender is accepted (its mail reads
 * `<code> is your verification code` from `notifications@<panel-mail>`), so a
 * stray 6-digit number can never be typed into Clerk.
 */
const isBrandMail = (from, subject) => /mixlayer|clerk/i.test(`${from} ${subject}`);

function extractCode(blobRaw) {
  const blob = String(blobRaw)
    .replace(/<[^>]+>/g, ' ')
    .replace(/#[0-9a-fA-F]{3,8}\b/g, ' ') // HTML templates carry #000000 hex colors
    .replace(/&nbsp;|&amp;/g, ' ');
  const near = [
    /(\d{4,8})\s*is your verification code/i,
    /(?:验证码|verification code|code)[^0-9a-z]{0,24}(\d{4,8})/i,
  ];
  for (const re of near) {
    const m = re.exec(blob);
    if (m) return m[1];
  }
  const six = /\b(\d{6})\b/.exec(blob);
  return six ? six[1] : null;
}

/** Every not-yet-tried brand code currently in the box, newest first. */
async function collectCodes(exit, box, skip, tried) {
  const out = [];
  let messages = [];
  try { messages = await inboxList(exit, box); } catch (e) { return out; }
  for (const m of messages) {
    const id = String(m.id);
    const from = String(m.from || '');
    const subject = String(m.subject || '');
    if (skip.has(id) || !isBrandMail(from, subject)) continue;
    let text = `${subject}\n${m.content || ''}`;
    if (!m.content) {
      const full = await inboxRead(exit, box, id).catch(() => null);
      if (full) text = `${subject}\n${full.content || full.html || full.text || ''}`;
    }
    const code = extractCode(text);
    if (code && !tried.has(code)) out.push({ code, id, subject: subject.slice(0, 80), from: from.slice(0, 80) });
  }
  return out;
}

/** Waits for the panel's own code mail; returns candidates in arrival order. */
async function waitForCode(exit, box, skip, tried, { timeoutMs = Math.min(CODE_TIMEOUT_MS, 150000), pollMs = 5000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const cands = await collectCodes(exit, box, skip, tried);
    if (cands.length) return cands;
    if (Date.now() > deadline) throw new Error('no verification code arrived in the window');
    await sleep(pollMs);
  }
}

// ------------------------------------------------------------ websocket CDP
/**
 * Minimal RFC6455 client for Chrome's ws:// DevTools endpoint. Node 18 has no
 * global WebSocket, so the handshake and framing are done here on `net`.
 */
class WsClient extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
    this.sock = null;
    this.buf = Buffer.alloc(0);
    this.frag = [];
    this.id = 0;
    this.pending = new Map();
  }
  connect(timeoutMs = 15000) {
    const u = new URL(this.url);
    return new Promise((resolve, reject) => {
      const sock = net.connect({ host: u.hostname, port: Number(u.port || 80) });
      this.sock = sock;
      const t = setTimeout(() => { sock.destroy(); reject(new Error('websocket handshake timeout')); }, timeoutMs);
      sock.once('error', (e) => { clearTimeout(t); reject(new Error(`websocket error: ${e.message}`)); });
      sock.once('close', () => {
        for (const [, p] of this.pending) p.reject(new Error('websocket closed'));
        this.pending.clear();
        this.emit('closed');
      });
      sock.once('connect', () => {
        sock.write(
          `GET ${u.pathname} HTTP/1.1\r\n` +
            `Host: ${u.hostname}:${u.port}\r\n` +
            'Upgrade: websocket\r\n' +
            'Connection: Upgrade\r\n' +
            `Sec-WebSocket-Key: ${crypto.randomBytes(16).toString('base64')}\r\n` +
            'Sec-WebSocket-Version: 13\r\n\r\n'
        );
      });
      let handshake = '';
      const onData = (d) => {
        handshake += d.toString('latin1');
        const idx = handshake.indexOf('\r\n\r\n');
        if (idx === -1) return;
        sock.off('data', onData);
        const head = handshake.slice(0, idx);
        if (!/^HTTP\/1\.1 101/.test(head)) {
          clearTimeout(t);
          sock.destroy();
          reject(new Error(`websocket refused: ${head.split('\r\n')[0]}`));
          return;
        }
        clearTimeout(t);
        const rest = Buffer.from(handshake.slice(idx + 4), 'latin1');
        sock.on('data', (chunk) => this._feed(chunk));
        if (rest.length) this._feed(rest);
        resolve(this);
      };
      sock.on('data', onData);
    });
  }
  _feed(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    for (;;) {
      const b = this.buf;
      if (b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0;
      const op = b[0] & 0x0f;
      const masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f;
      let off = 2;
      if (len === 126) {
        if (b.length < 4) return;
        len = b.readUInt16BE(2);
        off = 4;
      } else if (len === 127) {
        if (b.length < 10) return;
        len = Number(b.readBigUInt64BE(2));
        off = 10;
      }
      let mask = null;
      if (masked) {
        if (b.length < off + 4) return;
        mask = b.slice(off, off + 4);
        off += 4;
      }
      if (b.length < off + len) return;
      const payload = Buffer.from(b.slice(off, off + len));
      if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      this.buf = b.slice(off + len);
      if (op === 0x0) {
        this.frag.push(payload);
        if (fin) { const full = Buffer.concat(this.frag).toString('utf8'); this.frag = []; this._message(full); }
        continue;
      }
      if (op === 0x1) {
        if (fin) this._message(payload.toString('utf8'));
        else this.frag = [payload];
        continue;
      }
      if (op === 0x9) { this._frame(payload, 0xa); continue; }
      if (op === 0x8) { try { this.sock.destroy(); } catch {} return; }
      // 0xa pong — ignore
    }
  }
  _frame(payload, opcode) {
    const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
    const len = data.length;
    let header;
    if (len < 126) header = Buffer.from([0x80 | opcode, 0x80 | len]);
    else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    const mask = crypto.randomBytes(4);
    const out = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++) out[i] = data[i] ^ mask[i & 3];
    try { this.sock.write(Buffer.concat([header, mask, out])); } catch (e) { /* closed */ }
  }
  _message(text) {
    let msg;
    try { msg = JSON.parse(text); } catch { return; }
    if (msg.id !== undefined && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || 'cdp error'));
      else resolve(msg.result || {});
      return;
    }
    if (msg.method) this.emit('event', msg);
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this._frame(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }), 0x1);
    });
  }
  close() { try { this.sock.destroy(); } catch {} }
}

/** Thin CDP layer: session-aware send + method-scoped events. */
class CDP {
  constructor(ws) {
    this.ws = ws;
  }
  send(method, params, sessionId) { return this.ws.send(method, params, sessionId); }
  /** No `sessionId` = every session (attach events carry the new session id). */
  on(method, fn, sessionId) {
    const h = (msg) => {
      if (msg.method !== method) return;
      if (sessionId !== undefined && (msg.sessionId || undefined) !== sessionId) return;
      fn(msg.params);
    };
    this.ws.on('event', h);
    return () => this.ws.off('event', h);
  }
}

// ------------------------------------------------------------------- chrome
function findChrome() {
  if (CHROME_BIN) return CHROME_BIN;
  const cands =
    process.platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe') : null,
        ]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
  for (const c of cands) {
    if (!c) continue;
    if (c.includes('/') || c.includes('\\')) { if (fs.existsSync(c)) return c; continue; }
    const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', [c], { encoding: 'utf8', windowsHide: true });
    if (probe.status === 0 && String(probe.stdout).trim()) return String(probe.stdout).trim().split(/\r?\n/)[0];
  }
  throw new Error('Chrome not found — pass --browser <chrome.exe> or set CHROME_PATH');
}

function killChromeTree(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else child.kill('SIGTERM');
  } catch (e) { /* best effort */ }
}

/** A free loopback port — each run gets its own browser and profile. */
function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

/**
 * Launch Chrome with lean flags over the pinned exit (whole-browser
 * --proxy-server; authenticated HTTP proxies are answered through the Fetch
 * domain). A fresh profile per call keeps every account's Clerk session clean.
 */
async function launchChrome(exit) {
  const bin = findChrome();
  const debugPort = DEBUG_PORT || (await freePort());
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mixlayer-cli-'));
  const args = [
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
    '--renderer-process-limit=2',
    '--js-flags=--max-old-space-size=256',
    '--no-first-run',
    '--no-default-browser-check',
    '--mute-audio',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    '--window-size=1280,900',
    '--remote-allow-origins=*',
  ];
  if (HEADLESS) args.push('--headless=new');
  if (exit) args.push(`--proxy-server=${exit.protocol}://${exit.host}:${exit.port}`);
  args.push('about:blank');

  const child = spawn(bin, args, { detached: false, stdio: 'ignore' });
  const cleanup = () => {
    killChromeTree(child);
    setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {} }, 2000).unref();
  };
  child.once('error', cleanup);

  const devFile = path.join(profile, 'DevToolsActivePort');
  let port = 0;
  let wsPath = '';
  for (let i = 0; i < 160 && !port; i++) {
    const v = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then((r) => r.json()).catch(() => null);
    if (v && v.webSocketDebuggerUrl) {
      const u = new URL(v.webSocketDebuggerUrl);
      port = Number(u.port);
      wsPath = u.pathname;
      break;
    }
    if (fs.existsSync(devFile)) {
      const lines = fs.readFileSync(devFile, 'utf8').split('\n');
      port = Number(lines[0]);
      wsPath = (lines[1] || '').trim();
      break;
    }
    await sleep(300);
  }
  if (!port) {
    cleanup();
    throw new Error(`chrome never came up (debug port ${debugPort} busy? pass --debug-port N)`);
  }

  const ws = new WsClient(`ws://127.0.0.1:${port}${wsPath || '/devtools/browser'}`);
  try {
    await ws.connect();
  } catch (e) {
    cleanup();
    throw e;
  }
  const cdp = new CDP(ws);

  // Auth'd HTTP proxy: answer 407 challenges via the Fetch domain, on the page
  // session and on every auto-attached child (out-of-process iframes).
  const needAuth = !!(exit && exit.username && exit.protocol !== 'socks5');
  const wired = new Set();
  const wireAuth = async (sid) => {
    if (!needAuth || !sid || wired.has(sid)) return;
    wired.add(sid);
    cdp.on('Fetch.authRequired', (p) => {
      cdp.send('Fetch.continueWithAuth', {
        requestId: p.requestId,
        authChallengeResponse: {
          response: 'ProvideCredentials',
          username: exit.username,
          password: exit.password || '',
          proxyUsername: exit.username,
          proxyPassword: exit.password || '',
        },
      }, sid).catch(() => {});
    }, sid);
    cdp.on('Fetch.requestPaused', (p) => cdp.send('Fetch.continueRequest', { requestId: p.requestId }, sid).catch(() => {}), sid);
    await cdp.send('Fetch.enable', { handleAuthRequests: true, patterns: [{ urlPattern: '*' }] }, sid).catch(() => {});
  };

  cdp.on('Target.attachedToTarget', (p) => wireAuth(p && p.sessionId));
  await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  for (const d of ['Page', 'Runtime', 'Network']) await cdp.send(`${d}.enable`, {}, sessionId);
  await wireAuth(sessionId);

  return {
    cdp,
    targetId,
    sessionId,
    close: async () => {
      try { await cdp.send('Target.closeTarget', { targetId }); } catch (e) {}
      try { ws.close(); } catch (e) {}
      cleanup();
    },
  };
}

class Page {
  constructor(cdp, sessionId) {
    this.cdp = cdp;
    this.sessionId = sessionId;
  }
  async eval(expr, { awaitPromise = false, timeoutMs = 70000 } = {}) {
    const r = await withTimeout(this.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise }, this.sessionId), timeoutMs, 'eval timeout');
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
    return r.result && r.result.value;
  }
  async goto(url) {
    await this.cdp.send('Page.navigate', { url }, this.sessionId);
  }
  async url() {
    return this.eval('location.href', { timeoutMs: 20000 }).catch(() => '');
  }
  async shoot(name) {
    try {
      const r = await this.cdp.send('Page.captureScreenshot', { format: 'png' }, this.sessionId);
      fs.mkdirSync(SHOTS_DIR, { recursive: true });
      fs.writeFileSync(path.join(SHOTS_DIR, `${name}.png`), Buffer.from(r.data, 'base64'));
    } catch (e) { /* diagnostics only */ }
  }
}

// ---------------------------------------------------------- in-page helpers
/**
 * Clerk renders its fields inside shadow roots, so every lookup walks them.
 * `set` writes through the native value descriptor and fires input/change the
 * way a real keystroke does — Clerk ignores a bare `el.value = …`.
 */
const pageHelper = () => `
window.__mx = window.__mx || {};
window.__mx.deep = (sel) => {
  const walk = (r) => {
    const el = r.querySelector(sel);
    if (el) return el;
    for (const e of r.querySelectorAll('*')) if (e.shadowRoot) { const f = walk(e.shadowRoot); if (f) return f; }
    return null;
  };
  return walk(document);
};
window.__mx.set = (sel, text) => {
  const el = window.__mx.deep(sel);
  if (!el) return false;
  el.focus();
  const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  d.set.call(el, text);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};
window.__mx.clickSel = (sel) => { const el = window.__mx.deep(sel); if (!el) return false; el.click(); return true; };
window.__mx.clickText = (re) => {
  const out = [];
  const walk = (r) => { out.push(...r.querySelectorAll('button,[role=button],a')); for (const e of r.querySelectorAll('*')) if (e.shadowRoot) walk(e.shadowRoot); };
  walk(document);
  const b = out.find((x) => new RegExp(re, 'i').test((x.innerText || '').trim()));
  if (!b) return false;
  b.click();
  return true;
};
window.__mx.text = () => {
  const out = [];
  const walk = (r) => { out.push(r.textContent || ''); for (const e of r.querySelectorAll('*')) if (e.shadowRoot) walk(e.shadowRoot); };
  walk(document);
  return out.join(' ').replace(/\\s+/g, ' ').slice(0, 400);
};
window.__mx.fetchJson = async (p, opts) => {
  opts = opts || {};
  const r = await fetch(p, {
    method: opts.method || 'GET',
    headers: Object.assign({ Accept: 'application/json', 'Content-Type': 'application/json' }, opts.headers || {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include',
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: r.status, json, text };
};
true;
`;

const CODE_SEL = 'input[name="code"], input#code-field, input[autocomplete="one-time-code"], input[inputmode="numeric"]';

/**
 * Installs (and re-installs) the in-page helper. Clerk navigates to a fresh
 * document when the code is accepted, which drops every `window.__mx` binding,
 * and an evaluate that lands mid-navigation throws — so install is retried.
 */
async function ensureHelper(page, tries = 20) {
  for (let i = 0; i < tries; i++) {
    const ok = await page.eval(`!!(window.__mx && window.__mx.deep)`).catch(() => false);
    if (ok) return true;
    await page.eval(pageHelper()).catch(() => {});
    await sleep(700);
  }
  return false;
}

// ------------------------------------------------------------ account flow
async function mintOnExit(n, exit) {
  const started = Date.now();
  const box = await pickMailbox(exit);
  log(`account ${n}: mailbox ${box.address}`);

  const chrome = await launchChrome(exit);
  const page = new Page(chrome.cdp, chrome.sessionId);
  let ua = null;
  let stage = 'browser';
  try {
    const inPage = (p, opts) => page.eval(`window.__mx.fetchJson(${JSON.stringify(p)}, ${JSON.stringify(opts || {})})`, { awaitPromise: true, timeoutMs: 90000 });

    log(`account ${n}: goto ${CONSOLE}/sign-up via ${labelOf(exit)}`);
    await page.goto(`${CONSOLE}/sign-up`);
    await sleep(10000);
    ua = await page.eval('navigator.userAgent');
    await ensureHelper(page);
    await page.shoot('01-signup');

    // the code inbox is a recycled gmail box: anything already there is not ours
    const skip = await baseline(exit, box);

    const password = `Mx${rand(10)}!7a`;
    const email = box.address;
    stage = 'form';
    for (let i = 0; i < 30; i++) {
      const ready = await page.eval(`!!window.__mx.deep('#emailAddress-field, input[name="identifier"]')`);
      if (ready) break;
      await sleep(1500);
    }
    const filled = await page.eval(`window.__mx.set('#emailAddress-field, input[name="identifier"]', ${JSON.stringify(email)})`);
    await sleep(400);
    const pw = await page.eval(`window.__mx.set('#password-field', ${JSON.stringify(password)})`);
    await page.eval(`window.__mx.clickSel('#legalAccepted-field')`).catch(() => {});
    await sleep(300);
    log(`  form: email=${filled} password=${pw}`);
    if (!filled || !pw) throw new Error('sign-up form never rendered (e-mail/password fields not found)');
    await page.shoot('02-filled');

    await page.eval(`window.__mx.clickText('^continue$|continue|sign up')`).catch(() => {});
    await sleep(6000);
    log(`  after-continue url=${await page.url()}`);
    await page.shoot('03-after-continue');

    // 4) code step — Clerk mails a 6-digit code; the field may sit in a shadow root
    stage = 'code';
    let hasCode = false;
    for (let i = 0; i < 30 && !hasCode; i++) {
      hasCode = await page.eval(`!!(window.__mx && window.__mx.deep(${JSON.stringify(CODE_SEL)}))`).catch(() => false);
      if (!hasCode && (await page.url()).includes('/app')) break;
      if (!hasCode) await sleep(2000);
    }
    if (!(await page.url()).includes('/app')) {
      if (!hasCode) throw new Error('code input never appeared after continue');
      // Candidate codes are tried in arrival order: the box is shared, and a
      // mistyped/rejected code leaves Clerk on the same verify step.
      const tried = new Set();
      for (let attempt = 1; attempt <= 5 && !(await page.url()).includes('/app'); attempt++) {
        const hit = (await waitForCode(exit, box, skip, tried))[0];
        tried.add(hit.code);
        log(`  code attempt ${attempt}: ${hit.code} «${hit.subject}» from ${hit.from}`);
        const typed = await page.eval(`!!(window.__mx && window.__mx.set(${JSON.stringify(CODE_SEL)}, ${JSON.stringify(hit.code)}))`).catch(() => false);
        log(`  code set=${typed}`);
        await sleep(600);
        await page.eval(`window.__mx.clickText('^continue$|^verify$|continue|verify')`).catch(() => {});
        for (let i = 0; i < 20; i++) {
          if ((await page.url()).includes('/app')) break;
          await sleep(1500);
        }
        if (!(await page.url()).includes('/app')) await page.shoot(`04-code-attempt${attempt}`);
      }
    }
    // /app is a fresh document — the in-page helper has to be installed again
    if (!(await ensureHelper(page))) throw new Error('page helper could not be installed on /app');
    await page.shoot('04-signed-in');

    // 5) the personal organization
    stage = 'account';
    const cu = await inPage('/api/cloud/user');
    let orgId = '';
    try {
      const j = cu.json || {};
      const arr = j.organizations || (j.data && j.data.organizations) || [];
      orgId = (arr[0] && arr[0].id) || '';
    } catch (e) { /* handled below */ }
    log(`  /api/cloud/user -> ${cu.status} org=${orgId || '(none)'}`);
    if (!orgId) throw new Error(`no organization in /api/cloud/user (${String(cu.text).slice(0, 140)})`);

    // 6) key create (the console route authenticates from its own page)
    stage = 'token';
    const created = await inPage(`/api/cloud/organizations/${orgId}/api_keys`, {
      method: 'POST',
      body: { name: KEY_NAME, permissions: PERMS },
    });
    log(`  key create -> ${created.status} ${String(created.text).slice(0, 160)}`);
    let key = '';
    try {
      const d = created.json && created.json.data;
      key = String((d && (d.key || d.secret || d.token)) || '');
    } catch (e) { /* handled below */ }
    if (!key) {
      const m = String(created.text || '').match(/["']?(sk_[A-Za-z0-9_\-]{16,})["']?/);
      if (m) key = m[1];
    }
    if (!key) throw new Error(`no key in create response: ${String(created.text).slice(0, 140)}`);
    // Persist BEFORE the gate: the console reveals a key exactly once, so a
    // gate/exit hiccup must not throw the account's only copy away.
    const accounts = loadAccounts();
    const rec = {
      provider: 'mixlayer',
      address: box.address,
      password,
      org: orgId,
      key,
      keyName: KEY_NAME,
      permissions: PERMS.join(','),
      exit: labelOf(exit),
      ua,
      ts: new Date().toISOString(),
      gate: 'pending',
    };
    accounts.push(rec);
    saveAccounts(accounts);
    await page.shoot('05-key');

    // 7) live proof through the same pinned exit — keys.txt takes the key only on 200
    stage = 'verify';
    const proof = await proveKey(exit, key);
    if (!proof.ok) {
      rec.gate = `failed:${proof.status}`;
      rec.sample = String(proof.sample).slice(0, 200);
      saveAccounts(accounts);
      throw new Error(`chat gate ${proof.status}: ${String(proof.sample).slice(0, 120)}`);
    }
    rec.gate = 200;
    rec.models = proof.models;
    rec.rateLimits = proof.rateLimits;
    saveAccounts(accounts);

    log(`account ${n}: key LIVE on ${proof.model} (${proof.models} models, rl ${JSON.stringify(proof.rateLimits)}) · ${key.slice(0, 12)}… · ${Math.round((Date.now() - started) / 1000)}s`);
    return rec;
  } catch (e) {
    await page.shoot(`99-fatal-${stage}`).catch(() => {});
    e.mxStage = stage;
    throw e;
  } finally {
    await chrome.close();
  }
}

async function attemptAccount(n, exits, seed) {
  const limit = Math.min(TRIES, exits.length);
  for (let t = 0; t < limit; t++) {
    const exit = exits[(seed + t) % exits.length];
    let vet;
    try {
      vet = await vetExit(exit);
    } catch (e) {
      vet = { ok: false, why: String(e.message).slice(0, 90) };
    }
    if (!vet.ok) {
      log(`account ${n}: exit ${labelOf(exit)} failed the vet (${vet.why}) — trying the next one`);
      ledger({ account: n, exit: labelOf(exit), class: 'exit-vet', detail: vet.why });
      continue;
    }
    log(`account ${n}: exit pinned ${labelOf(exit)} (vet ${vet.ms}ms)`);
    // The mailbox rail is the flaky half: a dead box costs one full attempt,
    // then the next try builds a new box (and a new Chrome) on the same exit.
    for (let m = 1; m <= MINT_TRIES; m++) {
      try {
        return await mintOnExit(n, exit);
      } catch (e) {
        const cls = classify(e);
        log(`account ${n}: ${cls} failed (try ${m}/${MINT_TRIES}) — ${String(e.message).slice(0, 150)}`);
        ledger({ account: n, exit: labelOf(exit), class: cls, stage: e.mxStage, try: m, detail: String(e.message).slice(0, 300) });
        if (m < MINT_TRIES && GAP_MS) await sleep(GAP_MS);
      }
    }
  }
  return null;
}

// ------------------------------------------------------------ key handling
function readKeys(file = KEYS_PATH) {
  try {
    return fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
function appendKey(key) {
  fs.appendFileSync(KEYS_FILE, (fs.existsSync(KEYS_FILE) && fs.statSync(KEYS_FILE).size ? '\n' : '') + key + '\n');
}
function loadAccounts() {
  try { return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')); } catch { return []; }
}
function saveAccounts(list) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(list, null, 2) + '\n');
}

// ------------------------------------------------------------------- proof
/** Chat-capable candidates, free/cheap-looking first, embedding ids excluded. */
function pickCandidates(ids) {
  const chat = (ids || []).filter((id) => id && !/embedding|rerank/i.test(id));
  const out = [MODEL];
  for (const hint of ['free', 'flash', 'lite', 'mini', 'small', 'qwen']) {
    for (const id of chat) if (!out.includes(id) && id.toLowerCase().includes(hint)) out.push(id);
  }
  for (const id of chat) if (!out.includes(id)) out.push(id);
  return out.slice(0, 4);
}

async function listModels(exit, key) {
  const r = await exitJson(exit, `${API}/models`, { headers: { authorization: `Bearer ${key}` }, timeoutMs: TIMEOUT_MS });
  return { status: r.status, ids: ((r.json && r.json.data) || []).map((m) => m.id).filter(Boolean) };
}

const RL_HEADERS = [
  'x-ratelimit-limit-requests',
  'x-ratelimit-remaining-requests',
  'x-ratelimit-limit-tokens',
  'x-ratelimit-remaining-tokens',
  'retry-after',
];
/** One real completion; 200 with content (or reasoning) = the key is live. */
async function chatGate(exit, key, model) {
  const r = await exitJson(exit, `${API}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    timeoutMs: GATE_MS,
    body: { model, messages: [{ role: 'user', content: 'Reply with the single word: ok' }], max_tokens: 16, stream: false },
  });
  const msg = r.json && r.json.choices && r.json.choices[0] && r.json.choices[0].message;
  const content = msg && (msg.content || msg.reasoning_content);
  const rateLimits = {};
  for (const k of RL_HEADERS) if (r.headers && r.headers[k] != null) rateLimits[k] = String(r.headers[k]);
  return {
    ok: r.status === 200 && !!content,
    status: r.status,
    model,
    sample: content ? String(content).slice(0, 60) : String(r.text).slice(0, 140),
    rateLimits,
  };
}

/**
 * Models + a completion on the first model that answers — the keep/drop gate.
 * A whole pass that only produced exit-class errors is retried once: the exit,
 * not the key, is the usual reason a fresh key appears dead.
 */
async function proveKey(exit, key, { attempts = 2 } = {}) {
  let last = null;
  for (let a = 1; a <= attempts; a++) {
    let models;
    try {
      models = await listModels(exit, key);
    } catch (e) {
      last = { ok: false, status: 0, models: 0, sample: `GET /v1/models: ${String(e.message).slice(0, 100)}`, rateLimits: {} };
      await sleep(2000);
      continue;
    }
    if (models.status !== 200 || !models.ids.length) {
      return { ok: false, status: models.status, models: 0, sample: `GET /v1/models -> ${models.status}`, rateLimits: {} };
    }
    let networkOnly = true;
    for (const model of pickCandidates(models.ids)) {
      try {
        const g = await chatGate(exit, key, model);
        if (g.ok) return { ok: true, status: 200, model: g.model, sample: g.sample, models: models.ids.length, rateLimits: g.rateLimits };
        networkOnly = false;
        last = g;
      } catch (e) {
        last = { status: 0, model, sample: String(e.message).slice(0, 120), rateLimits: {} };
      }
    }
    if (!networkOnly) break;
    await sleep(2000);
  }
  return { ok: false, status: last && last.status, models: (last && last.models) || 0, sample: (last && last.sample) || 'no model answered', rateLimits: (last && last.rateLimits) || {} };
}

// ------------------------------------------------------------------- modes
async function mint(exits) {
  log(`mixlayer mint · ${COUNT} account(s) · model ${MODEL} · exits ${exits.filter(Boolean).length || 'direct'} · keys land in ${KEYS_FILE}`);
  let made = 0;
  for (let i = 0; i < COUNT; i++) {
    const rec = await attemptAccount(i + 1, exits, i);
    // mintOnExit has already recorded the account (key + gate result) in
    // accounts.json; keys.txt is the only file written here.
    if (rec) {
      appendKey(rec.key);
      made++;
    }
    if (i < COUNT - 1 && GAP_MS) await sleep(GAP_MS);
  }
  log(`done — ${made}/${COUNT} key(s) written to ${KEYS_FILE}`);
  process.exit(made === COUNT ? 0 : 1);
}

async function verifyOnly(exits) {
  const keys = readKeys();
  if (!keys.length) {
    console.log(`no keys in ${KEYS_PATH}`);
    process.exit(0);
  }
  console.log(`keys: ${keys.length} from ${KEYS_PATH} · exits ${exits.filter(Boolean).length || 'direct'}`);
  let live = 0;
  let modelCount = null;
  for (let i = 0; i < keys.length; i++) {
    const exit = exits[i % exits.length];
    try {
      if (modelCount === null) {
        const m = await listModels(exit, keys[i]);
        modelCount = m.ids.length;
        console.log(`  /v1/models -> ${m.status}, ${modelCount} models`);
      }
      const g = await proveKey(exit, keys[i]);
      if (g.ok) live++;
      console.log(`  ${g.ok ? '✔' : '✘'} ${keys[i].slice(0, 12)}… chat=${g.ok ? 200 : g.status || 0} ${g.ok ? `${g.model} "${g.sample}" rl=${JSON.stringify(g.rateLimits)}` : String(g.sample).slice(0, 90)}`);
    } catch (e) {
      console.log(`  ✘ ${keys[i].slice(0, 12)}… ${String(e.message).slice(0, 90)}`);
    }
  }
  console.log(`verify: ${live}/${keys.length} keys live`);
  process.exit(live === keys.length ? 0 : 1);
}

// ------------------------------------------------------------ 9Router
/** Register the provider-node + one connection per key on a local 9Router. */
async function connect9router() {
  const base = (arg('9router-base', 'http://localhost:20128')).replace(/\/$/, '');
  const password = arg('9router-password', '123456');
  const name = arg('9router-name', 'Mixlayer');
  const prefix = arg('9router-prefix', 'mixlayer');
  const baseUrl = arg('base-url', `${API}`);
  const r9ua = 'mixlayer-bulk-9router-connector/1.0';
  const keys = arg('api-key', '') ? [arg('api-key', '')] : readKeys();
  if (!keys.length) {
    console.log(`no keys — mint one first (node src/cli.js --count 1), or pass --api-key <key>`);
    process.exit(1);
  }

  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': r9ua },
    body: JSON.stringify({ password }),
  });
  const setCookie = typeof login.headers.getSetCookie === 'function' ? login.headers.getSetCookie() : [];
  const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  console.log(`9Router login: ${login.ok ? 'ok' : `not required/failed ${(await login.text()).slice(0, 120)}`}`);

  const api = async (route, init = {}) => {
    const res = await fetch(`${base}${route}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'User-Agent': r9ua, ...(cookie ? { Cookie: cookie } : {}), ...(init.headers || {}) },
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON reported as text */ }
    return { status: res.status, ok: res.ok, json, text: text.slice(0, 300) };
  };

  const nodes = await api('/api/provider-nodes');
  let node = (((nodes.json || {}).nodes) || []).find((n) => n.prefix === prefix || n.name === name);
  if (node) {
    console.log(`provider-node exists: ${node.id} (prefix ${node.prefix})`);
  } else {
    const created = await api('/api/provider-nodes', {
      method: 'POST',
      body: JSON.stringify({ name, prefix, apiType: 'chat', type: 'openai-compatible', baseUrl }),
    });
    if (!created.ok) throw new Error(`create node failed ${created.status}: ${created.text}`);
    node = created.json.node;
    console.log(`provider-node created: ${node.id} (${baseUrl})`);
  }

  const conns = await api('/api/providers');
  const existing = (((conns.json || {}).connections) || []).filter((c) => c.provider === node.id || c.name === name);
  let added = 0;
  for (let i = 0; i < keys.length; i++) {
    const connName = keys.length === 1 ? name : `${prefix}-${String(i + 1).padStart(3, '0')}`;
    if (existing.some((c) => c.name === connName)) {
      console.log(`connection exists: ${connName}`);
      continue;
    }
    const created = await api('/api/providers', {
      method: 'POST',
      body: JSON.stringify({ provider: node.id, apiKey: keys[i], name: connName, priority: 1, defaultModel: MODEL }),
    });
    if (!created.ok && created.status !== 409) throw new Error(`create connection ${connName} failed ${created.status}: ${created.text}`);
    added++;
    console.log(`connection created: ${connName}`);
  }
  console.log(`\nDone — ${added} new connection(s). Models are served as ${prefix}/<model id>:\n  ${prefix}/${MODEL}`);
}

// ------------------------------------------------------------------- main
if (require.main === module) {
  (async () => {
    if (CONNECT_9ROUTER) {
      await connect9router();
      process.exit(0);
    }
    const exits = loadExits();
    if (SCREEN) {
      const pass = await screen(exits);
      process.exit(pass ? 0 : 1);
    }
    if (VERIFY_ONLY) {
      await verifyOnly(exits);
      return;
    }
    await mint(exits);
  })().catch((e) => {
    console.error('[fatal]', e.message);
    process.exit(1);
  });
}

// Exported so the lab can drive parts of the rail directly (page probe); the
// CLI itself only runs its main flow when executed as a script.
module.exports = { parseProxy, extractCode, pickCandidates, launchChrome, Page, pageHelper, WsClient, CDP, proveKey, vetExit, newMailbox, parseArgs: arg };
