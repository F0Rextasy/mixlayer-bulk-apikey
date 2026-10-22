<div align="center">

```
███╗   ███╗██╗██╗  ██╗██╗      █████╗ ██╗   ██╗███████╗██████╗
████╗ ████║██║╚██╗██╔╝██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗
██╔████╔██║██║ ╚███╔╝ ██║     ███████║ ╚████╔╝ █████╗  ██████╔╝
██║╚██╔╝██║██║ ██╔██╗ ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗
██║ ╚═╝ ██║██║██╔╝ ██╗███████╗██║  ██║   ██║   ███████╗██║  ██║
╚═╝     ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
```

# mixlayer-bulk-apikey

**Bulk-create Mixlayer accounts with auto-generated API keys — OpenAI-compatible inference + 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-6%20served-412991?style=for-the-badge)](https://mixlayer.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-6-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

Mixlayer hosts a curated set of open-source models behind OpenAI-compatible inference, and one of its ids is on a **free tier**: `qwen/qwen3.5-4b-free` costs nothing and needs no prepaid credit. That makes the panel a zero-cost text/coding endpoint — the account's own key is the only thing to mint. Sign-up runs through **Clerk** on `console.mixlayer.com`: e-mail + password + terms, then a 6-digit code from the inbox. Clerk's instance captcha is invisible and solved by clerk-js *inside the page* (a server-side sign-up call answers `captcha_missing_token`), which is why the tool drives a real Chrome instead of posting to the register endpoint. The console reveals a key exactly once and the key route authenticates from its own page, so the browser rail is also what mints the key.

## 🎁 Free tier — how much you get

| What | Value |
| --- | --- |
| Free model | **`qwen/qwen3.5-4b-free`** — $0 in/out, **no prepaid credit required** (docs: “Free models do not require prepaid credit”) |
| Paid models | `qwen/qwen3.5-9b`, `qwen/qwen3.6-35b-a3b`, `qwen/qwen3.8-27b`, `z-ai/glm-5.3`, `deepseek/deepseek-v4.1-flash` — these answer `insufficient_prepaid_credits` on a fresh account |
| Signup | e-mail + password + terms, then a 6-digit e-mail code (Clerk); **no phone, no card** |
| Key | one key per personal organization, created in the console (`inference`, `api-read`, `api-write`; `expires_at: null`) |
| Rate limits | **120 requests/min and 500,000 tokens/min** (measured on every account, per-org + per-model) |
| The unit that scales | **one account = one key** (the key belongs to the account's organization) |

> 💡 The free tier is set by Mixlayer and can change. Check the live numbers at [mixlayer.ai](https://mixlayer.ai) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 6 of them

`GET /v1/models` returned **6 ids** on a live key (2026-10-21):

| Model ID | note |
| --- | --- |
| `qwen/qwen3.5-4b-free` | the free tier — chat-verified **11/11** keys; reasoning model, short answers put the text in `reasoning_content` |
| `qwen/qwen3.5-9b` | paid (prepaid credit required) |
| `qwen/qwen3.6-35b-a3b` | paid |
| `qwen/qwen3.8-27b` | paid |
| `z-ai/glm-5.3` | paid, always-on reasoning with Low/High/Max effort |
| `deepseek/deepseek-v4.1-flash` | paid, optional thinking with effort levels |

The verification default answers 200 with content or reasoning:

```bash
curl https://mixlayer.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-4b-free","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🧪 How to use the API

Base URL **`https://mixlayer.ai/v1`** — OpenAI-compatible. Keys are prefixed `sk_mxl_`.

Auth shape: a bearer token on every request (`Authorization: Bearer <key>`) — the docs' own `MIXLAYER_API_KEY` is exactly this string.

```python
from openai import OpenAI
c = OpenAI(base_url="https://mixlayer.ai/v1", api_key="YOUR_KEY")
print(c.chat.completions.create(model="qwen/qwen3.5-4b-free",
      messages=[{"role":"user","content":"hi"}]).choices[0].message.content)
```

Rate limits are published only as response headers — `x-ratelimit-limit-requests` / `-limit-tokens` (and the `remaining` twins, plus `retry-after`). A rejected request answers HTTP **429** `{"error":{"type":"rate_limit_exceeded"}}`; wait out `retry-after`.

A paid model without credit answers HTTP 400 `{"error":{"type":"billing_error","code":"insufficient_prepaid_credits"}}` — do not retry it with backoff.

## 🛠 Quick start

```bash
cd mixlayer-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings
# or directly:
node src/cli.js --count 1        # one Clerk sign-up in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # test the exit list against the console + API
```

The sign-up needs a real Chrome (Clerk mounts its own captcha); `keys.txt` is written only after `GET /v1/models` + a real completion, and `accounts.json` records the key the moment the console returns it (so a gate hiccup cannot lose it).

### 🖱️ The launcher

The launcher asks for the proxy list (optional — without one the CLI runs direct) and the account count, remembers them, and runs the CLI — mint, verify, screen exits, settings, help, Connect to 9Router.

## ✅ Verified working — every key is tested

All checks below ran on **2026-10-21** from the shipped CLI (pool exit: proxy over `socks5h://127.0.0.1:40000`).

| Check | Result |
| --- | --- |
| `--screen` (exit vet) | **✔ 0.9 s** — `console.mixlayer.com/sign-up` **200** + `mixlayer.ai/v1/models` reachable (**401** without a key) |
| Clerk sign-up in real Chrome | **✔** — `/sign-up` → e-mail + password + terms → continue → `#/verify-email-address` → 6-digit code → `/app` |
| `POST /api/cloud/organizations/<org>/api_keys` | **200** — key returned once (`inference`, `api-read`, `api-write`) |
| `GET /v1/models` per key | **200**, 6 ids |
| `POST /v1/chat/completions` per key before it is written | **200** — **11/11** keys on `qwen/qwen3.5-4b-free` (`content \|\| reasoning_content`) |
| `--verify-only` (independent re-check of all 11) | **11/11** chat-200, each with `x-ratelimit-limit-requests: 120` + `-limit-tokens: 500000` |
| a key that fails its chat check | never written to `keys.txt` — the account stays in `accounts.json` with `gate: failed` |

```bash
node src/cli.js --verify-only
node src/cli.js --screen
```

## 🧭 How it works

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Mixlayer page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://mixlayer.ai/v1/chat/completions → real content = the key is live
```

| Step | Call | Notes |
| --- | --- | --- |
| vet | `GET console.mixlayer.com/sign-up` + `GET mixlayer.ai/v1/models` | an exit that cannot reach either is skipped before anything else |
| mailbox | Emailnator gmail box | a box whose inbox is only the provider's “Upgrade to Premium” wall is dropped and another is asked for |
| sign-up | console `/sign-up` in real Chrome | e-mail + password + terms; Clerk's invisible captcha is solved by clerk-js in the page |
| code | 6-digit code from the inbox, typed in-page | **the sender is the gate** (`mixlayer`/`clerk`): the box is recycled and its message ids rotate between calls, so a stray 6-digit code can never be typed |
| account | `/api/cloud/user` (in-page fetch) | the personal organization id |
| key | `POST /api/cloud/organizations/<org>/api_keys` | recorded in `accounts.json` immediately — the console reveals it once |
| proof | `GET /v1/models` + a real completion | `keys.txt` takes the key only on the chat 200 |

## ⚙️ CLI options

```bash
node src/cli.js --count N        # mint N keys (one Clerk sign-up each)
node src/cli.js --model qwen/qwen3.5-4b-free
node src/cli.js --verify-only    # re-verify every key in keys.txt
node src/cli.js --screen         # exit pool self-test
node src/cli.js --connect-9router
node src/cli.js --help
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--count N` | `1` | accounts to mint, serial |
| `--model <id>` | `qwen/qwen3.5-4b-free` | model used for the live gate |
| `--pool <file>` | `proxies.txt` | exit pool, one line per proxy — optional |
| `--tries N` | `3` | exit candidates vetted per account |
| `--mint-tries N` | `3` | full sign-up attempts per exit (fresh mailbox each) |
| `--gap MS` | `4000` | pause between accounts |
| `--code-timeout S` | `300` | seconds to wait for the e-mail code, per mailbox attempt |
| `--key-name <s>` | `mixlayer-1` | name given to the created key |
| `--keys <file>` | `keys.txt` | key file for `--verify-only` / `--connect-9router` |
| `--headless` | off | run Chrome headless (visible Chrome is the tested rail) |
| `--browser <exe>` | auto | Chrome binary (env `CHROME_PATH`) |
| `--debug-port N` | auto | Chrome DevTools port (a free nonzero one by default) |

| Env | Default | Meaning |
| --- | --- | --- |
| `MIXLAYER_PROXIES` | `proxies.txt` | exit pool, one line per proxy — optional: without a pool the CLI connects directly |
| `MIXLAYER_MODEL` | `qwen/qwen3.5-4b-free` | model for the live verification |
| `CHROME_PATH` | auto | Chrome binary for the browser rail |

## 🛰️ Behind a proxy

**Optional — recommended at scale (per-IP limits, bans).** The tool works without a proxy too.

- **With a pool:** pass `--pool <file>` (or set `MIXLAYER_PROXIES`) and every request — the Chrome browser included — goes through an exit from that list, fail-closed: each candidate is vetted first (`console.mixlayer.com/sign-up` 200 + the API host reachable) and the run then stays pinned to that exit. A dead line fails its attempt and the CLI moves to the next candidate.
- **Without a pool:** the CLI prints `running WITHOUT a proxy (direct)` and connects directly. Nothing about sign-up, key minting or verification changes — only where the packets leave from.
- Run `--screen` against either mode: it tests the exits you have (or the direct route) against the console and the API before a real run.
- Chrome cannot authenticate to a SOCKS5 proxy, so `socks5://user:pass@host:port` lines are dropped from the browser rail (fail-closed, never silently direct).

## 📄 Files

| Path | Contents |
| --- | --- |
| `keys.txt` | one live-verified key per line — git-ignored |
| `accounts.json` | e-mail / org / password / key + `gate` — written the moment the key exists |
| `proxies.txt` | your exits — git-ignored |
| `out/` | run logs, failure screenshots, `attempts.jsonl` ledger — git-ignored |

## 🔌 Connect to 9Router

[9Router](https://9router.com) is a self-hosted, OpenAI-compatible router:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Defaults: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Models are served as `mixlayer/<model id>`. The CLI can do the same in one shot: `node src/cli.js --connect-9router`.

## 🔑 What one key gets you

| | |
| --- | --- |
| 🏢 Provider | **Mixlayer** — [mixlayer.ai](https://mixlayer.ai) |
| 🎁 What the provider gives | a free tier on `qwen/qwen3.5-4b-free` ($0 in/out, no prepaid credit) plus 5 paid ids |
| 🔑 What one key gets you | one key on its own account: the 6 ids on `https://mixlayer.ai/v1`, 120 RPM / 500k TPM |
| 🌐 API shape | OpenAI-compatible: `POST https://mixlayer.ai/v1/chat/completions` |
| 🔒 Your data | only `mixlayer.ai` / `console.mixlayer.com` and your inbox backend are contacted |

## 🐞 Issues

If Mixlayer changes its Clerk sign-up shape, the console key route or the model catalogue, the tool stops there and says so. **[Open an issue](../../issues)** with the command and the exact output.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 mixlayer-bulk-apikey contributors

</div>
