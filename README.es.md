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

**Crea cuentas de Mixlayer en masa con claves API generadas automáticamente — inferencia compatible con OpenAI + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-6%20served-412991?style=for-the-badge)](https://mixlayer.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Inicio rápido](#-quick-start) · [🎁 Nivel gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-6-of-them) · [🧪 Usar la API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Opciones](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por qué existe esto

Mixlayer aloja un conjunto seleccionado de modelos de código abierto detrás de una inferencia compatible con OpenAI, y uno de sus ids está en un **nivel gratuito**: `qwen/qwen3.5-4b-free` no cuesta nada y no requiere crédito prepago. Eso convierte el panel en un endpoint de texto/código de coste cero — la propia clave de la cuenta es lo único que hay que acuñar. El registro pasa por **Clerk** en `console.mixlayer.com`: correo electrónico + contraseña + términos, luego un código de 6 dígitos de la bandeja de entrada. El captcha de instancia de Clerk es invisible y lo resuelve clerk-js *dentro de la página* (una llamada de registro del lado del servidor responde `captcha_missing_token`), por eso la herramienta maneja un Chrome real en lugar de hacer una petición POST al endpoint de registro. La consola revela una clave exactamente una vez y la ruta de la clave se autentica desde su propia página, así que el riel del navegador es también lo que acuña la clave.

## 🎁 Nivel gratuito — cuánto obtienes

| Qué | Valor |
| --- | --- |
| Modelo gratuito | **`qwen/qwen3.5-4b-free`** — $0 entrada/salida, **no requiere crédito prepago** (docs: “Los modelos gratuitos no requieren crédito prepago”) |
| Modelos de pago | `qwen/qwen3.5-9b`, `qwen/qwen3.6-35b-a3b`, `qwen/qwen3.8-27b`, `z-ai/glm-5.3`, `deepseek/deepseek-v4.1-flash` — estos responden `insufficient_prepaid_credits` en una cuenta nueva |
| Registro | correo electrónico + contraseña + términos, luego un código de 6 dígitos por correo (Clerk); **sin teléfono, sin tarjeta** |
| Clave | una clave por organización personal, creada en la consola (`inference`, `api-read`, `api-write`; `expires_at: null`) |
| Límites de tasa | **120 solicitudes/min y 500.000 tokens/min** (medidos en cada cuenta, por organización + por modelo) |
| La unidad que escala | **una cuenta = una clave** (la clave pertenece a la organización de la cuenta) |

> 💡 El nivel gratuito lo define Mixlayer y puede cambiar. Consulta los números en vivo en [mixlayer.ai](https://mixlayer.ai) — y deja que la propia puerta de la herramienta decida:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — los 6

`GET /v1/models` devolvió **6 ids** con una clave en vivo (2026-10-21):

| ID del modelo | nota |
| --- | --- |
| `qwen/qwen3.5-4b-free` | el nivel gratuito — verificado por chat **11/11** claves; modelo de razonamiento, las respuestas cortas ponen el texto en `reasoning_content` |
| `qwen/qwen3.5-9b` | de pago (requiere crédito prepago) |
| `qwen/qwen3.6-35b-a3b` | de pago |
| `qwen/qwen3.8-27b` | de pago |
| `z-ai/glm-5.3` | de pago, razonamiento siempre activo con esfuerzo Low/High/Max |
| `deepseek/deepseek-v4.1-flash` | de pago, pensamiento opcional con niveles de esfuerzo |

La verificación por defecto responde 200 con contenido o razonamiento:

```bash
curl https://mixlayer.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-4b-free","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🧪 Cómo usar la API

URL base **`https://mixlayer.ai/v1`** — compatible con OpenAI. Las claves llevan el prefijo `sk_mxl_`.

Forma de autenticación: un token bearer en cada solicitud (`Authorization: Bearer <key>`) — el propio `MIXLAYER_API_KEY` de los docs es exactamente esta cadena.

```python
from openai import OpenAI
c = OpenAI(base_url="https://mixlayer.ai/v1", api_key="YOUR_KEY")
print(c.chat.completions.create(model="qwen/qwen3.5-4b-free",
      messages=[{"role":"user","content":"hi"}]).choices[0].message.content)
```

Los límites de tasa se publican solo como cabeceras de respuesta — `x-ratelimit-limit-requests` / `-limit-tokens` (y sus gemelas `remaining`, más `retry-after`). Una solicitud rechazada responde HTTP **429** `{"error":{"type":"rate_limit_exceeded"}}`; espera a que pase `retry-after`.

Un modelo de pago sin crédito responde HTTP 400 `{"error":{"type":"billing_error","code":"insufficient_prepaid_credits"}}` — no lo reintentes con retroceso exponencial.

## 🛠 Inicio rápido

```bash
cd mixlayer-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 1        # one Clerk sign-up in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # test the exit list against the console + API
```

El registro necesita un Chrome real (Clerk monta su propio captcha); `keys.txt` se escribe solo después de `GET /v1/models` + una completion real, y `accounts.json` registra la clave en el momento en que la consola la devuelve (así un tropiezo en la puerta no puede perderla).

### 🖱️ El lanzador

El lanzador pide la lista de proxies (opcional — sin una, el CLI se ejecuta directo) y el número de cuentas, los recuerda y ejecuta el CLI — acuñar, verificar, cribar salidas, ajustes, ayuda, Conectar a 9Router.

## ✅ Verificado y funcionando — cada clave se prueba

Todas las comprobaciones siguientes se ejecutaron el **2026-10-21** desde el CLI incluido (salida del pool: proxy sobre `socks5h://127.0.0.1:40000`).

| Comprobación | Resultado |
| --- | --- |
| `--screen` (vet de salida) | **✔ 0,9 s** — `console.mixlayer.com/sign-up` **200** + `mixlayer.ai/v1/models` accesible (**401** sin clave) |
| Registro en Clerk en Chrome real | **✔** — `/sign-up` → correo + contraseña + términos → continuar → `#/verify-email-address` → código de 6 dígitos → `/app` |
| `POST /api/cloud/organizations/<org>/api_keys` | **200** — clave devuelta una vez (`inference`, `api-read`, `api-write`) |
| `GET /v1/models` por clave | **200**, 6 ids |
| `POST /v1/chat/completions` por clave antes de escribirse | **200** — **11/11** claves en `qwen/qwen3.5-4b-free` (`content \|\| reasoning_content`) |
| `--verify-only` (recomprobación independiente de las 11) | **11/11** chat-200, cada una con `x-ratelimit-limit-requests: 120` + `-limit-tokens: 500000` |
| una clave que falla su comprobación de chat | nunca se escribe en `keys.txt` — la cuenta permanece en `accounts.json` con `gate: failed` |

```bash
node src/cli.js --verify-only
node src/cli.js --screen
```

## 🧭 Cómo funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Mixlayer page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://mixlayer.ai/v1/chat/completions → real content = the key is live
```

| Paso | Llamada | Notas |
| --- | --- | --- |
| vet | `GET console.mixlayer.com/sign-up` + `GET mixlayer.ai/v1/models` | una salida que no puede alcanzar ninguna de las dos se omite antes que nada |
| buzón | caja gmail de Emailnator | una caja cuya bandeja de entrada es solo el muro “Upgrade to Premium” del proveedor se descarta y se pide otra |
| registro | consola `/sign-up` en Chrome real | correo + contraseña + términos; el captcha invisible de Clerk lo resuelve clerk-js en la página |
| código | código de 6 dígitos de la bandeja de entrada, escrito en la página | **el remitente es la puerta** (`mixlayer`/`clerk`): la caja se recicla y sus ids de mensaje rotan entre llamadas, así que un código de 6 dígitos extraño nunca puede escribirse |
| cuenta | `/api/cloud/user` (fetch en la página) | el id de la organización personal |
| clave | `POST /api/cloud/organizations/<org>/api_keys` | registrada en `accounts.json` inmediatamente — la consola la revela una vez |
| prueba | `GET /v1/models` + una completion real | `keys.txt` solo acepta la clave con el chat 200 |

## ⚙️ Opciones del CLI

```bash
node src/cli.js --count N        # mint N keys (one Clerk sign-up each)
node src/cli.js --model qwen/qwen3.5-4b-free
node src/cli.js --verify-only    # re-verify every key in keys.txt
node src/cli.js --screen         # exit pool self-test
node src/cli.js --connect-9router
node src/cli.js --help
```

| Flag | Predeterminado | Significado |
| --- | --- | --- |
| `--count N` | `1` | cuentas a acuñar, en serie |
| `--model <id>` | `qwen/qwen3.5-4b-free` | modelo usado para la puerta en vivo |
| `--pool <file>` | `proxies.txt` | pool de salidas, una línea por proxy — opcional |
| `--tries N` | `3` | candidatos de salida evaluados por cuenta |
| `--mint-tries N` | `3` | intentos completos de registro por salida (buzón nuevo cada vez) |
| `--gap MS` | `4000` | pausa entre cuentas |
| `--code-timeout S` | `300` | segundos de espera del código por correo, por intento de buzón |
| `--key-name <s>` | `mixlayer-1` | nombre dado a la clave creada |
| `--keys <file>` | `keys.txt` | archivo de claves para `--verify-only` / `--connect-9router` |
| `--headless` | off | ejecutar Chrome sin interfaz (Chrome visible es el riel probado) |
| `--browser <exe>` | auto | binario de Chrome (env `CHROME_PATH`) |
| `--debug-port N` | auto | puerto DevTools de Chrome (uno libre distinto de cero por defecto) |

| Env | Predeterminado | Significado |
| --- | --- | --- |
| `MIXLAYER_PROXIES` | `proxies.txt` | pool de salidas, una línea por proxy — opcional: sin un pool el CLI se conecta directamente |
| `MIXLAYER_MODEL` | `qwen/qwen3.5-4b-free` | modelo para la verificación en vivo |
| `CHROME_PATH` | auto | binario de Chrome para el riel del navegador |

## 🛰️ Detrás de un proxy

**Opcional — recomendado a escala (límites por IP, baneos).** La herramienta también funciona sin proxy.

- **Con un pool:** pasa `--pool <file>` (o define `MIXLAYER_PROXIES`) y cada solicitud — incluido el navegador Chrome — pasa por una salida de esa lista, fail-closed: cada candidato se evalúa primero (`console.mixlayer.com/sign-up` 200 + el host de la API accesible) y la ejecución luego queda fijada a esa salida. Una línea muerta falla su intento y el CLI pasa al siguiente candidato.
- **Sin un pool:** el CLI imprime `running WITHOUT a proxy (direct)` y se conecta directamente. Nada del registro, la acuñación de claves o la verificación cambia — solo desde dónde salen los paquetes.
- Ejecuta `--screen` en cualquiera de los dos modos: prueba las salidas que tengas (o la ruta directa) contra la consola y la API antes de una ejecución real.
- Chrome no puede autenticarse ante un proxy SOCKS5, así que las líneas `socks5://user:pass@host:port` se descartan del riel del navegador (fail-closed, nunca directo en silencio).

## 📄 Archivos

| Ruta | Contenido |
| --- | --- |
| `keys.txt` | una clave verificada en vivo por línea — ignorada por git |
| `accounts.json` | correo / organización / contraseña / clave + `gate` — escrito en el momento en que la clave existe |
| `proxies.txt` | tus salidas — ignorado por git |
| `out/` | registros de ejecución, capturas de fallos, libro mayor `attempts.jsonl` — ignorado por git |

## 🔌 Conectar a 9Router

[9Router](https://9router.com) es un router autoalojado y compatible con OpenAI:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Predeterminados: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Los modelos se sirven como `mixlayer/<model id>`. El CLI puede hacer lo mismo de una vez: `node src/cli.js --connect-9router`.

## 🔌 Conectar a OmniRoute

[OmniRoute](https://omniroute.online) es un router autoalojado y compatible con OpenAI:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Predeterminados: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Los modelos se sirven como `mixlayer/<model id>`. El CLI puede hacer lo mismo de una vez: `node src/cli.js --connect-omniroute`.
## 🔑 Qué te da una clave

| | |
| --- | --- |
| 🏢 Proveedor | **Mixlayer** — [mixlayer.ai](https://mixlayer.ai) |
| 🎁 Qué da el proveedor | un nivel gratuito en `qwen/qwen3.5-4b-free` ($0 entrada/salida, sin crédito prepago) más 5 ids de pago |
| 🔑 Qué te da una clave | una clave en su propia cuenta: los 6 ids en `https://mixlayer.ai/v1`, 120 RPM / 500k TPM |
| 🌐 Forma de la API | compatible con OpenAI: `POST https://mixlayer.ai/v1/chat/completions` |
| 🔒 Tus datos | solo se contacta con `mixlayer.ai` / `console.mixlayer.com` y tu backend de buzón |

## 🐞 Problemas

Si Mixlayer cambia la forma de su registro en Clerk, la ruta de claves de la consola o el catálogo de modelos, la herramienta se detiene ahí y lo dice. **[Abre un issue](../../issues)** con el comando y la salida exacta.

## 📄 Licencia

MIT © 2026 — consulta [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 mixlayer-bulk-apikey contributors

</div>