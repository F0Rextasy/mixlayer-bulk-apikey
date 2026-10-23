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

**Массовое создание аккаунтов Mixlayer с автоматически сгенерированными API-ключами — OpenAI-совместимый инференс + коннектор 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-6%20served-412991?style=for-the-badge)](https://mixlayer.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный тариф](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-6-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

Mixlayer размещает тщательно отобранный набор open-source моделей за OpenAI-совместимым инференсом, и один из его идентификаторов находится на **бесплатном тарифе**: `qwen/qwen3.5-4b-free` ничего не стоит и не требует предоплаченного баланса. Это делает панель бесплатной точкой доступа для текста и кода — единственное, что нужно создать, это собственный ключ аккаунта. Регистрация проходит через **Clerk** на `console.mixlayer.com`: e-mail + пароль + условия, затем 6-значный код из почтового ящика. Капча экземпляра Clerk невидима и решается clerk-js *внутри страницы* (серверный вызов регистрации отвечает `captcha_missing_token`), поэтому инструмент управляет настоящим Chrome, а не отправляет запросы на endpoint регистрации. Консоль показывает ключ ровно один раз, а маршрут ключа аутентифицируется со своей собственной страницы, поэтому браузерный путь — это также то, что создаёт ключ.

## 🎁 Бесплатный тариф — сколько вы получаете

| Что | Значение |
| --- | --- |
| Бесплатная модель | **`qwen/qwen3.5-4b-free`** — $0 на вход/выход, **предоплаченный баланс не требуется** (документация: «Бесплатные модели не требуют предоплаченного баланса») |
| Платные модели | `qwen/qwen3.5-9b`, `qwen/qwen3.6-35b-a3b`, `qwen/qwen3.8-27b`, `z-ai/glm-5.3`, `deepseek/deepseek-v4.1-flash` — на новом аккаунте они отвечают `insufficient_prepaid_credits` |
| Регистрация | e-mail + пароль + условия, затем 6-значный код из письма (Clerk); **без телефона, без карты** |
| Ключ | один ключ на личную организацию, создаётся в консоли (`inference`, `api-read`, `api-write`; `expires_at: null`) |
| Лимиты | **120 запросов/мин и 500 000 токенов/мин** (измерено на каждом аккаунте, на организацию + на модель) |
| Единица масштабирования | **один аккаунт = один ключ** (ключ принадлежит организации аккаунта) |

> 💡 Бесплатный тариф устанавливается Mixlayer и может измениться. Проверяйте актуальные цифры на [mixlayer.ai](https://mixlayer.ai) — и пусть собственный шлюз инструмента решает:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Модели — все 6

`GET /v1/models` вернул **6 идентификаторов** на живом ключе (2026-10-21):

| ID модели | примечание |
| --- | --- |
| `qwen/qwen3.5-4b-free` | бесплатный тариф — проверено чатом **11/11** ключей; reasoning-модель, короткие ответы помещают текст в `reasoning_content` |
| `qwen/qwen3.5-9b` | платная (требуется предоплаченный баланс) |
| `qwen/qwen3.6-35b-a3b` | платная |
| `qwen/qwen3.8-27b` | платная |
| `z-ai/glm-5.3` | платная, постоянно включённый reasoning с уровнями Low/High/Max |
| `deepseek/deepseek-v4.1-flash` | платная, опциональное мышление с уровнями усилия |

Проверка по умолчанию отвечает 200 с content или reasoning:

```bash
curl https://mixlayer.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-4b-free","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🧪 Как использовать API

Базовый URL **`https://mixlayer.ai/v1`** — OpenAI-совместимый. Ключи имеют префикс `sk_mxl_`.

Форма аутентификации: bearer-токен в каждом запросе (`Authorization: Bearer <key>`) — собственный `MIXLAYER_API_KEY` из документации это ровно эта строка.

```python
from openai import OpenAI
c = OpenAI(base_url="https://mixlayer.ai/v1", api_key="YOUR_KEY")
print(c.chat.completions.create(model="qwen/qwen3.5-4b-free",
      messages=[{"role":"user","content":"hi"}]).choices[0].message.content)
```

Лимиты публикуются только в заголовках ответа — `x-ratelimit-limit-requests` / `-limit-tokens` (и их пары `remaining`, плюс `retry-after`). Отклонённый запрос отвечает HTTP **429** `{"error":{"type":"rate_limit_exceeded"}}`; дождитесь `retry-after`.

Платная модель без баланса отвечает HTTP 400 `{"error":{"type":"billing_error","code":"insufficient_prepaid_credits"}}` — не повторяйте запрос с backoff.

## 🛠 Быстрый старт

```bash
cd mixlayer-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 1        # one Clerk sign-up in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # test the exit list against the console + API
```

Регистрация требует настоящего Chrome (Clerk устанавливает свою собственную капчу); `keys.txt` записывается только после `GET /v1/models` + реального завершения, а `accounts.json` записывает ключ в момент, когда консоль его возвращает (так что сбой шлюза не может его потерять).

### 🖱️ Лаунчер

Лаунчер запрашивает список прокси (опционально — без него CLI работает напрямую) и количество аккаунтов, запоминает их и запускает CLI — создание, проверка, проверка выходов, настройки, справка, подключение к 9Router.

## ✅ Проверено в работе — каждый ключ протестирован

Все проверки ниже выполнены **2026-10-21** из поставляемого CLI (выход пула: proxy через `socks5h://127.0.0.1:40000`).

| Проверка | Результат |
| --- | --- |
| `--screen` (проверка выхода) | **✔ 0.9 с** — `console.mixlayer.com/sign-up` **200** + `mixlayer.ai/v1/models` доступен (**401** без ключа) |
| Регистрация в Clerk в настоящем Chrome | **✔** — `/sign-up` → e-mail + пароль + условия → продолжить → `#/verify-email-address` → 6-значный код → `/app` |
| `POST /api/cloud/organizations/<org>/api_keys` | **200** — ключ возвращён один раз (`inference`, `api-read`, `api-write`) |
| `GET /v1/models` на каждый ключ | **200**, 6 идентификаторов |
| `POST /v1/chat/completions` на каждый ключ до его записи | **200** — **11/11** ключей на `qwen/qwen3.5-4b-free` (`content \|\| reasoning_content`) |
| `--verify-only` (независимая перепроверка всех 11) | **11/11** chat-200, каждый с `x-ratelimit-limit-requests: 120` + `-limit-tokens: 500000` |
| ключ, не прошедший проверку чата | никогда не записывается в `keys.txt` — аккаунт остаётся в `accounts.json` с `gate: failed` |

```bash
node src/cli.js --verify-only
node src/cli.js --screen
```

## 🧭 Как это работает

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Mixlayer page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://mixlayer.ai/v1/chat/completions → real content = the key is live
```

| Шаг | Вызов | Примечания |
| --- | --- | --- |
| проверка | `GET console.mixlayer.com/sign-up` + `GET mixlayer.ai/v1/models` | выход, который не может достичь ни одного из них, пропускается до всего остального |
| почтовый ящик | gmail-ящик Emailnator | ящик, входящие которого содержат только «Upgrade to Premium» от провайдера, отбрасывается и запрашивается другой |
| регистрация | консоль `/sign-up` в настоящем Chrome | e-mail + пароль + условия; невидимая капча Clerk решается clerk-js на странице |
| код | 6-значный код из входящих, вводится на странице | **отправитель — это шлюз** (`mixlayer`/`clerk`): ящик перерабатывается, и его id сообщений меняются между вызовами, поэтому случайный 6-значный код никогда не может быть введён |
| аккаунт | `/api/cloud/user` (fetch на странице) | id личной организации |
| ключ | `POST /api/cloud/organizations/<org>/api_keys` | немедленно записывается в `accounts.json` — консоль показывает его один раз |
| доказательство | `GET /v1/models` + реальное завершение | `keys.txt` принимает ключ только при chat 200 |

## ⚙️ Опции CLI

```bash
node src/cli.js --count N        # mint N keys (one Clerk sign-up each)
node src/cli.js --model qwen/qwen3.5-4b-free
node src/cli.js --verify-only    # re-verify every key in keys.txt
node src/cli.js --screen         # exit pool self-test
node src/cli.js --connect-9router
node src/cli.js --help
```

| Флаг | По умолчанию | Значение |
| --- | --- | --- |
| `--count N` | `1` | количество аккаунтов для создания, последовательно |
| `--model <id>` | `qwen/qwen3.5-4b-free` | модель, используемая для живого шлюза |
| `--pool <file>` | `proxies.txt` | пул выходов, одна строка на прокси — опционально |
| `--tries N` | `3` | кандидаты выходов, проверяемые на аккаунт |
| `--mint-tries N` | `3` | полные попытки регистрации на выход (новый почтовый ящик каждый раз) |
| `--gap MS` | `4000` | пауза между аккаунтами |
| `--code-timeout S` | `300` | секунды ожидания кода из письма на попытку почтового ящика |
| `--key-name <s>` | `mixlayer-1` | имя, присваиваемое созданному ключу |
| `--keys <file>` | `keys.txt` | файл ключей для `--verify-only` / `--connect-9router` |
| `--headless` | выкл | запуск Chrome в headless-режиме (видимый Chrome — проверенный путь) |
| `--browser <exe>` | авто | бинарник Chrome (переменная `CHROME_PATH`) |
| `--debug-port N` | авто | порт Chrome DevTools (по умолчанию свободный ненулевой) |

| Переменная | По умолчанию | Значение |
| --- | --- | --- |
| `MIXLAYER_PROXIES` | `proxies.txt` | пул выходов, одна строка на прокси — опционально: без пула CLI подключается напрямую |
| `MIXLAYER_MODEL` | `qwen/qwen3.5-4b-free` | модель для живой проверки |
| `CHROME_PATH` | авто | бинарник Chrome для браузерного пути |

## 🛰️ За прокси

**Опционально — рекомендуется при масштабировании (лимиты на IP, блокировки).** Инструмент работает и без прокси.

- **С пулом:** передайте `--pool <file>` (или задайте `MIXLAYER_PROXIES`), и каждый запрос — включая браузер Chrome — идёт через выход из этого списка, fail-closed: каждый кандидат сначала проверяется (`console.mixlayer.com/sign-up` 200 + хост API доступен), и запуск затем закрепляется за этим выходом. Мёртвая линия проваливает свою попытку, и CLI переходит к следующему кандидату.
- **Без пула:** CLI выводит `running WITHOUT a proxy (direct)` и подключается напрямую. Ничего в регистрации, создании ключей или проверке не меняется — только то, откуда уходят пакеты.
- Запустите `--screen` в любом из режимов: он проверяет имеющиеся у вас выходы (или прямой маршрут) против консоли и API перед реальным запуском.
- Chrome не может аутентифицироваться в SOCKS5-прокси, поэтому строки `socks5://user:pass@host:port` отбрасываются из браузерного пути (fail-closed, никогда не напрямую молча).

## 📄 Файлы

| Путь | Содержимое |
| --- | --- |
| `keys.txt` | один проверенный в работе ключ на строку — игнорируется git |
| `accounts.json` | e-mail / организация / пароль / ключ + `gate` — записывается в момент появления ключа |
| `proxies.txt` | ваши выходы — игнорируется git |
| `out/` | логи запусков, скриншоты сбоев, журнал `attempts.jsonl` — игнорируется git |

## 🔌 Подключение к 9Router

[9Router](https://9router.com) — это самостоятельно размещаемый OpenAI-совместимый роутер:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

По умолчанию: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Модели подаются как `mixlayer/<model id>`. CLI может сделать то же самое одним выстрелом: `node src/cli.js --connect-9router`.

## 🔌 Подключение к OmniRoute

[OmniRoute](https://omniroute.online) — это самостоятельно размещаемый OpenAI-совместимый роутер:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

По умолчанию: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Модели подаются как `mixlayer/<model id>`. CLI может сделать то же самое одним выстрелом: `node src/cli.js --connect-omniroute`.

## 🔑 Что даёт один ключ

| | |
| --- | --- |
| 🏢 Провайдер | **Mixlayer** — [mixlayer.ai](https://mixlayer.ai) |
| 🎁 Что даёт провайдер | бесплатный тариф на `qwen/qwen3.5-4b-free` ($0 на вход/выход, без предоплаченного баланса) плюс 5 платных идентификаторов |
| 🔑 Что даёт один ключ | один ключ на собственном аккаунте: 6 идентификаторов на `https://mixlayer.ai/v1`, 120 RPM / 500k TPM |
| 🌐 Форма API | OpenAI-совместимая: `POST https://mixlayer.ai/v1/chat/completions` |
| 🔒 Ваши данные | контакт только с `mixlayer.ai` / `console.mixlayer.com` и вашим почтовым бэкендом |

## 🐞 Проблемы

Если Mixlayer изменит форму регистрации в Clerk, маршрут ключа в консоли или каталог моделей, инструмент остановится там и сообщит об этом. **[Откройте issue](../../issues)** с командой и точным выводом.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 mixlayer-bulk-apikey contributors

</div>