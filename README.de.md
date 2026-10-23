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

**Mixlayer-Konten im Bulk anlegen mit automatisch generierten API-Schlüsseln — OpenAI-kompatible Inferenz + 9Router-Connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-6%20served-412991?style=for-the-badge)](https://mixlayer.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Free-Tier](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-6-of-them) · [🧪 API verwenden](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 Funktionsweise](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

Mixlayer hostet eine kuratierte Auswahl quelloffener Modelle hinter OpenAI-kompatibler Inferenz, und eine der IDs liegt auf einem **Free-Tier**: `qwen/qwen3.5-4b-free` kostet nichts und benötigt kein vorausbezahltes Guthaben. Damit ist das Panel ein kostenloser Text-/Coding-Endpunkt — der eigene Schlüssel des Kontos ist das Einzige, was erzeugt werden muss. Die Registrierung läuft über **Clerk** auf `console.mixlayer.com`: E-Mail + Passwort + AGB, dann ein 6-stelliger Code aus dem Postfach. Das Instanz-Captcha von Clerk ist unsichtbar und wird von clerk-js *innerhalb der Seite* gelöst (ein serverseitiger Sign-up-Aufruf antwortet mit `captcha_missing_token`), weshalb das Tool einen echten Chrome steuert, statt an den Register-Endpunkt zu posten. Die Konsole zeigt einen Schlüssel genau einmal an, und die Schlüssel-Route authentifiziert sich über ihre eigene Seite, also ist die Browser-Schiene auch das, was den Schlüssel erzeugt.

## 🎁 Free-Tier — wie viel du bekommst

| Was | Wert |
| --- | --- |
| Kostenloses Modell | **`qwen/qwen3.5-4b-free`** — $0 in/out, **kein vorausbezahltes Guthaben erforderlich** (Doku: „Free models do not require prepaid credit“) |
| Kostenpflichtige Modelle | `qwen/qwen3.5-9b`, `qwen/qwen3.6-35b-a3b`, `qwen/qwen3.8-27b`, `z-ai/glm-5.3`, `deepseek/deepseek-v4.1-flash` — diese antworten auf einem frischen Konto mit `insufficient_prepaid_credits` |
| Registrierung | E-Mail + Passwort + AGB, dann ein 6-stelliger E-Mail-Code (Clerk); **kein Telefon, keine Karte** |
| Schlüssel | ein Schlüssel pro persönlicher Organisation, in der Konsole erstellt (`inference`, `api-read`, `api-write`; `expires_at: null`) |
| Rate Limits | **120 Anfragen/Min. und 500.000 Tokens/Min.** (auf jedem Konto gemessen, pro Organisation + pro Modell) |
| Die skalierende Einheit | **ein Konto = ein Schlüssel** (der Schlüssel gehört zur Organisation des Kontos) |

> 💡 Der Free-Tier wird von Mixlayer festgelegt und kann sich ändern. Prüfe die aktuellen Zahlen auf [mixlayer.ai](https://mixlayer.ai) — und lass das Gate des Tools selbst entscheiden:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 6

`GET /v1/models` lieferte **6 IDs** auf einem Live-Schlüssel (2026-10-21):

| Modell-ID | Hinweis |
| --- | --- |
| `qwen/qwen3.5-4b-free` | der Free-Tier — chat-verifiziert **11/11** Schlüssel; Reasoning-Modell, kurze Antworten legen den Text in `reasoning_content` ab |
| `qwen/qwen3.5-9b` | kostenpflichtig (vorausbezahltes Guthaben erforderlich) |
| `qwen/qwen3.6-35b-a3b` | kostenpflichtig |
| `qwen/qwen3.8-27b` | kostenpflichtig |
| `z-ai/glm-5.3` | kostenpflichtig, immer aktives Reasoning mit Low/High/Max-Aufwand |
| `deepseek/deepseek-v4.1-flash` | kostenpflichtig, optionales Denken mit Aufwandsstufen |

Die Verifizierung antwortet standardmäßig mit 200 und Inhalt oder Reasoning:

```bash
curl https://mixlayer.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-4b-free","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🧪 So verwendest du die API

Basis-URL **`https://mixlayer.ai/v1`** — OpenAI-kompatibel. Schlüssel haben das Präfix `sk_mxl_`.

Auth-Form: ein Bearer-Token bei jeder Anfrage (`Authorization: Bearer <key>`) — der `MIXLAYER_API_KEY` aus der Doku ist genau dieser String.

```python
from openai import OpenAI
c = OpenAI(base_url="https://mixlayer.ai/v1", api_key="YOUR_KEY")
print(c.chat.completions.create(model="qwen/qwen3.5-4b-free",
      messages=[{"role":"user","content":"hi"}]).choices[0].message.content)
```

Rate Limits werden nur als Response-Header veröffentlicht — `x-ratelimit-limit-requests` / `-limit-tokens` (und die `remaining`-Zwillinge, plus `retry-after`). Eine abgelehnte Anfrage antwortet mit HTTP **429** `{"error":{"type":"rate_limit_exceeded"}}`; warte `retry-after` ab.

Ein kostenpflichtiges Modell ohne Guthaben antwortet mit HTTP 400 `{"error":{"type":"billing_error","code":"insufficient_prepaid_credits"}}` — nicht mit Backoff erneut versuchen.

## 🛠 Schnellstart

```bash
cd mixlayer-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 1        # one Clerk sign-up in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # test the exit list against the console + API
```

Die Registrierung benötigt einen echten Chrome (Clerk bindet sein eigenes Captcha ein); `keys.txt` wird erst nach `GET /v1/models` + einer echten Completion geschrieben, und `accounts.json` zeichnet den Schlüssel in dem Moment auf, in dem die Konsole ihn zurückgibt (damit ein Gate-Aussetzer ihn nicht verlieren kann).

### 🖱️ Der Launcher

Der Launcher fragt nach der Proxy-Liste (optional — ohne eine läuft die CLI direkt) und der Kontenanzahl, merkt sie sich und führt die CLI aus — mint, verify, screen exits, settings, help, Connect to 9Router.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

Alle Prüfungen unten liefen am **2026-10-21** aus der ausgelieferten CLI (Pool-Exit: proxy über `socks5h://127.0.0.1:40000`).

| Prüfung | Ergebnis |
| --- | --- |
| `--screen` (Exit-Prüfung) | **✔ 0,9 s** — `console.mixlayer.com/sign-up` **200** + `mixlayer.ai/v1/models` erreichbar (**401** ohne Schlüssel) |
| Clerk-Registrierung in echtem Chrome | **✔** — `/sign-up` → E-Mail + Passwort + AGB → weiter → `#/verify-email-address` → 6-stelliger Code → `/app` |
| `POST /api/cloud/organizations/<org>/api_keys` | **200** — Schlüssel einmal zurückgegeben (`inference`, `api-read`, `api-write`) |
| `GET /v1/models` pro Schlüssel | **200**, 6 IDs |
| `POST /v1/chat/completions` pro Schlüssel, bevor er geschrieben wird | **200** — **11/11** Schlüssel auf `qwen/qwen3.5-4b-free` (`content \|\| reasoning_content`) |
| `--verify-only` (unabhängige Nachprüfung aller 11) | **11/11** Chat-200, jeweils mit `x-ratelimit-limit-requests: 120` + `-limit-tokens: 500000` |
| ein Schlüssel, der seine Chat-Prüfung nicht besteht | wird nie in `keys.txt` geschrieben — das Konto bleibt in `accounts.json` mit `gate: failed` |

```bash
node src/cli.js --verify-only
node src/cli.js --screen
```

## 🧭 Funktionsweise

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Mixlayer page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://mixlayer.ai/v1/chat/completions → real content = the key is live
```

| Schritt | Aufruf | Hinweise |
| --- | --- | --- |
| Prüfung | `GET console.mixlayer.com/sign-up` + `GET mixlayer.ai/v1/models` | ein Exit, der keinen der beiden erreicht, wird vor allem anderen übersprungen |
| Postfach | Emailnator-Gmail-Box | eine Box, deren Postfach nur die „Upgrade to Premium“-Wand des Anbieters ist, wird verworfen und eine andere angefordert |
| Registrierung | Konsole `/sign-up` in echtem Chrome | E-Mail + Passwort + AGB; Clerks unsichtbares Captcha wird von clerk-js in der Seite gelöst |
| Code | 6-stelliger Code aus dem Postfach, in der Seite eingegeben | **der Absender ist das Gate** (`mixlayer`/`clerk`): die Box wird recycelt und ihre Nachrichten-IDs rotieren zwischen Aufrufen, sodass ein fremder 6-stelliger Code niemals eingegeben werden kann |
| Konto | `/api/cloud/user` (In-Page-Fetch) | die ID der persönlichen Organisation |
| Schlüssel | `POST /api/cloud/organizations/<org>/api_keys` | sofort in `accounts.json` aufgezeichnet — die Konsole zeigt ihn einmal an |
| Nachweis | `GET /v1/models` + eine echte Completion | `keys.txt` übernimmt den Schlüssel nur bei Chat-200 |

## ⚙️ CLI-Optionen

```bash
node src/cli.js --count N        # mint N keys (one Clerk sign-up each)
node src/cli.js --model qwen/qwen3.5-4b-free
node src/cli.js --verify-only    # re-verify every key in keys.txt
node src/cli.js --screen         # exit pool self-test
node src/cli.js --connect-9router
node src/cli.js --help
```

| Flag | Standard | Bedeutung |
| --- | --- | --- |
| `--count N` | `1` | Anzahl der zu erzeugenden Konten, seriell |
| `--model <id>` | `qwen/qwen3.5-4b-free` | Modell für das Live-Gate |
| `--pool <file>` | `proxies.txt` | Exit-Pool, eine Zeile pro Proxy — optional |
| `--tries N` | `3` | pro Konto geprüfte Exit-Kandidaten |
| `--mint-tries N` | `3` | vollständige Registrierungsversuche pro Exit (jeweils frisches Postfach) |
| `--gap MS` | `4000` | Pause zwischen Konten |
| `--code-timeout S` | `300` | Sekunden Wartezeit auf den E-Mail-Code, pro Postfach-Versuch |
| `--key-name <s>` | `mixlayer-1` | Name, der dem erstellten Schlüssel gegeben wird |
| `--keys <file>` | `keys.txt` | Schlüsseldatei für `--verify-only` / `--connect-9router` |
| `--headless` | aus | Chrome headless ausführen (sichtbarer Chrome ist die getestete Schiene) |
| `--browser <exe>` | auto | Chrome-Binary (Env `CHROME_PATH`) |
| `--debug-port N` | auto | Chrome-DevTools-Port (standardmäßig ein freier, von null verschiedener) |

| Env | Standard | Bedeutung |
| --- | --- | --- |
| `MIXLAYER_PROXIES` | `proxies.txt` | Exit-Pool, eine Zeile pro Proxy — optional: ohne Pool verbindet sich die CLI direkt |
| `MIXLAYER_MODEL` | `qwen/qwen3.5-4b-free` | Modell für die Live-Verifizierung |
| `CHROME_PATH` | auto | Chrome-Binary für die Browser-Schiene |

## 🛰️ Hinter einem Proxy

**Optional — bei Skalierung empfohlen (Limits pro IP, Bans).** Das Tool funktioniert auch ohne Proxy.

- **Mit einem Pool:** übergib `--pool <file>` (oder setze `MIXLAYER_PROXIES`), und jede Anfrage — einschließlich des Chrome-Browsers — läuft über einen Exit aus dieser Liste, fail-closed: jeder Kandidat wird zuerst geprüft (`console.mixlayer.com/sign-up` 200 + der API-Host erreichbar), und der Lauf bleibt dann an diesen Exit gebunden. Eine tote Leitung lässt ihren Versuch scheitern, und die CLI geht zum nächsten Kandidaten über.
- **Ohne einen Pool:** die CLI gibt `running WITHOUT a proxy (direct)` aus und verbindet sich direkt. An Registrierung, Schlüsselerzeugung oder Verifizierung ändert sich nichts — nur daran, wo die Pakete das Haus verlassen.
- Führe `--screen` gegen beide Modi aus: es testet die Exits, die du hast (oder die direkte Route), gegen die Konsole und die API vor einem echten Lauf.
- Chrome kann sich nicht an einem SOCKS5-Proxy authentifizieren, daher werden `socks5://user:pass@host:port`-Zeilen aus der Browser-Schiene entfernt (fail-closed, niemals stillschweigend direkt).

## 📄 Dateien

| Pfad | Inhalt |
| --- | --- |
| `keys.txt` | ein live-verifizierter Schlüssel pro Zeile — von Git ignoriert |
| `accounts.json` | E-Mail / Organisation / Passwort / Schlüssel + `gate` — geschrieben, sobald der Schlüssel existiert |
| `proxies.txt` | deine Exits — von Git ignoriert |
| `out/` | Lauf-Logs, Fehler-Screenshots, `attempts.jsonl`-Ledger — von Git ignoriert |

## 🔌 Mit 9Router verbinden

[9Router](https://9router.com) ist ein selbst gehosteter, OpenAI-kompatibler Router:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Standardwerte: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Modelle werden als `mixlayer/<model id>` bereitgestellt. Die CLI kann dasselbe in einem Durchgang erledigen: `node src/cli.js --connect-9router`.

## 🔌 Mit OmniRoute verbinden

[OmniRoute](https://omniroute.online) ist ein selbst gehosteter, OpenAI-kompatibler Router:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Standardwerte: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Modelle werden als `mixlayer/<model id>` bereitgestellt. Die CLI kann dasselbe in einem Durchgang erledigen: `node src/cli.js --connect-omniroute`.

## 🔑 Was ein Schlüssel dir bringt

| | |
| --- | --- |
| 🏢 Anbieter | **Mixlayer** — [mixlayer.ai](https://mixlayer.ai) |
| 🎁 Was der Anbieter gibt | einen Free-Tier auf `qwen/qwen3.5-4b-free` ($0 in/out, kein vorausbezahltes Guthaben) plus 5 kostenpflichtige IDs |
| 🔑 Was ein Schlüssel dir bringt | einen Schlüssel auf seinem eigenen Konto: die 6 IDs auf `https://mixlayer.ai/v1`, 120 RPM / 500k TPM |
| 🌐 API-Form | OpenAI-kompatibel: `POST https://mixlayer.ai/v1/chat/completions` |
| 🔒 Deine Daten | nur `mixlayer.ai` / `console.mixlayer.com` und dein Postfach-Backend werden kontaktiert |

## 🐞 Issues

Wenn Mixlayer seine Clerk-Registrierungsform, die Konsolen-Schlüssel-Route oder den Modellkatalog ändert, stoppt das Tool dort und sagt es. **[Öffne ein Issue](../../issues)** mit dem Befehl und der exakten Ausgabe.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 mixlayer-bulk-apikey contributors

</div>