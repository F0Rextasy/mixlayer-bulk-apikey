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

**자동 생성된 API 키로 Mixlayer 계정을 대량 생성 — OpenAI 호환 추론 + 9Router 커넥터.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-6%20served-412991?style=for-the-badge)](https://mixlayer.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-6-of-them) · [🧪 API 사용하기](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 이 도구가 존재하는 이유

Mixlayer는 OpenAI 호환 추론 뒤에 엄선된 오픈소스 모델 세트를 호스팅하며, 그중 하나의 id는 **무료 티어**에 있습니다: `qwen/qwen3.5-4b-free`는 비용이 들지 않고 선불 크레딧도 필요하지 않습니다. 따라서 이 패널은 비용 없는 텍스트/코딩 엔드포인트가 됩니다 — 계정 자체의 키만 발급하면 됩니다. 가입은 `console.mixlayer.com`의 **Clerk**를 통해 진행됩니다: 이메일 + 비밀번호 + 약관, 그다음 받은편지함으로 온 6자리 코드. Clerk 인스턴스의 캡차는 보이지 않으며 clerk-js가 *페이지 내부에서* 해결합니다(서버 측 가입 호출은 `captcha_missing_token`을 반환합니다). 그래서 이 도구는 register 엔드포인트에 POST하는 대신 실제 Chrome을 구동합니다. 콘솔은 키를 단 한 번만 공개하고 키 라우트는 자체 페이지에서 인증하므로, 브라우저 경로가 키를 발급하는 방식이기도 합니다.

## 🎁 무료 티어 — 얼마나 받을 수 있나

| 항목 | 값 |
| --- | --- |
| 무료 모델 | **`qwen/qwen3.5-4b-free`** — 입/출력 $0, **선불 크레딧 불필요** (문서: “무료 모델은 선불 크레딧이 필요하지 않습니다”) |
| 유료 모델 | `qwen/qwen3.5-9b`, `qwen/qwen3.6-35b-a3b`, `qwen/qwen3.8-27b`, `z-ai/glm-5.3`, `deepseek/deepseek-v4.1-flash` — 새 계정에서는 `insufficient_prepaid_credits`를 반환합니다 |
| 가입 | 이메일 + 비밀번호 + 약관, 그다음 6자리 이메일 코드 (Clerk); **전화번호 없음, 카드 없음** |
| 키 | 개인 조직당 하나의 키, 콘솔에서 생성 (`inference`, `api-read`, `api-write`; `expires_at: null`) |
| 속도 제한 | **분당 120 요청 및 분당 500,000 토큰** (모든 계정에서 측정, 조직별 + 모델별) |
| 확장 단위 | **계정 하나 = 키 하나** (키는 계정의 조직에 속함) |

> 💡 무료 티어는 Mixlayer가 설정하며 변경될 수 있습니다. 실시간 수치는 [mixlayer.ai](https://mixlayer.ai)에서 확인하세요 — 그리고 도구 자체의 게이트가 판단하게 하세요:

```bash
node src/cli.js --verify-only     # keys.txt의 모든 키를 실제 채팅 호출로 재검증
```

## 🤖 모델 — 6개 전부

`GET /v1/models`는 실제 키에서 **6개의 id**를 반환했습니다 (2026-10-21):

| 모델 ID | 비고 |
| --- | --- |
| `qwen/qwen3.5-4b-free` | 무료 티어 — 채팅 검증 **11/11** 키; 추론 모델, 짧은 답변은 텍스트를 `reasoning_content`에 넣음 |
| `qwen/qwen3.5-9b` | 유료 (선불 크레딧 필요) |
| `qwen/qwen3.6-35b-a3b` | 유료 |
| `qwen/qwen3.8-27b` | 유료 |
| `z-ai/glm-5.3` | 유료, 항상 켜진 추론, Low/High/Max 노력 수준 |
| `deepseek/deepseek-v4.1-flash` | 유료, 노력 수준이 있는 선택적 사고 |

검증 기본값은 콘텐츠 또는 추론과 함께 200을 반환합니다:

```bash
curl https://mixlayer.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-4b-free","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🧪 API 사용 방법

베이스 URL **`https://mixlayer.ai/v1`** — OpenAI 호환. 키는 `sk_mxl_` 접두사를 가집니다.

인증 형태: 모든 요청에 베어러 토큰 (`Authorization: Bearer <key>`) — 문서의 `MIXLAYER_API_KEY`가 바로 이 문자열입니다.

```python
from openai import OpenAI
c = OpenAI(base_url="https://mixlayer.ai/v1", api_key="YOUR_KEY")
print(c.chat.completions.create(model="qwen/qwen3.5-4b-free",
      messages=[{"role":"user","content":"hi"}]).choices[0].message.content)
```

속도 제한은 응답 헤더로만 공개됩니다 — `x-ratelimit-limit-requests` / `-limit-tokens` (그리고 `remaining` 쌍둥이, `retry-after` 포함). 거부된 요청은 HTTP **429** `{"error":{"type":"rate_limit_exceeded"}}`를 반환합니다; `retry-after`를 기다리세요.

크레딧 없는 유료 모델은 HTTP 400 `{"error":{"type":"billing_error","code":"insufficient_prepaid_credits"}}`를 반환합니다 — 백오프로 재시도하지 마세요.

## 🛠 빠른 시작

```bash
cd mixlayer-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # 선택 사항 — 없으면 도구는 직접 연결로 실행
node src/launcher.js        # 대화형: 발급 / 검증 / 스크린 / 설정

# 또는 직접:
node src/cli.js --count 1        # 실제 Chrome에서 Clerk 가입 한 번
node src/cli.js --verify-only    # keys.txt에 이미 있는 모든 키 재검증
node src/cli.js --screen         # 콘솔 + API에 대해 출구 목록 테스트
```

가입에는 실제 Chrome이 필요합니다 (Clerk가 자체 캡차를 마운트함); `keys.txt`는 `GET /v1/models` + 실제 완료 이후에만 작성되며, `accounts.json`은 콘솔이 키를 반환하는 순간 키를 기록합니다 (따라서 게이트 문제로 키를 잃을 수 없습니다).

### 🖱️ 런처

런처는 프록시 목록(선택 사항 — 없으면 CLI는 직접 실행)과 계정 수를 묻고, 이를 기억한 뒤 CLI를 실행합니다 — 발급, 검증, 출구 스크린, 설정, 도움말, 9Router 연결.

## ✅ 검증됨 — 모든 키가 테스트됨

아래 모든 검사는 **2026-10-21**에 배포된 CLI에서 실행되었습니다 (풀 출구: `socks5h://127.0.0.1:40000`을 통한 proxy).

| 검사 | 결과 |
| --- | --- |
| `--screen` (출구 검증) | **✔ 0.9초** — `console.mixlayer.com/sign-up` **200** + `mixlayer.ai/v1/models` 도달 가능 (키 없이 **401**) |
| 실제 Chrome에서 Clerk 가입 | **✔** — `/sign-up` → 이메일 + 비밀번호 + 약관 → 계속 → `#/verify-email-address` → 6자리 코드 → `/app` |
| `POST /api/cloud/organizations/<org>/api_keys` | **200** — 키 한 번 반환 (`inference`, `api-read`, `api-write`) |
| 키별 `GET /v1/models` | **200**, 6개 id |
| 작성 전 키별 `POST /v1/chat/completions` | **200** — `qwen/qwen3.5-4b-free`에서 **11/11** 키 (`content \|\| reasoning_content`) |
| `--verify-only` (11개 전부 독립 재검사) | **11/11** 채팅-200, 각각 `x-ratelimit-limit-requests: 120` + `-limit-tokens: 500000` |
| 채팅 검사에 실패한 키 | `keys.txt`에 절대 작성되지 않음 — 계정은 `gate: failed`와 함께 `accounts.json`에 남음 |

```bash
node src/cli.js --verify-only
node src/cli.js --screen
```

## 🧭 작동 방식

```
받은편지함 (계정당 하나의 주소)                                  계정마다 새 주소
   │
   ├─▶ 가입: Mixlayer 페이지 → 이메일 주소 → 받은편지함의 코드 / 링크
   ├─▶ 세션: 계정의 쿠키 또는 액세스 토큰 확보
   ├─▶ 키 발급: 계정의 키 엔드포인트 → 평문 키 한 번 반환 (즉시 디스크에 기록)
   └─▶ 실시간 증명: POST https://mixlayer.ai/v1/chat/completions → 실제 콘텐츠 = 키가 살아 있음
```

| 단계 | 호출 | 비고 |
| --- | --- | --- |
| 검증 | `GET console.mixlayer.com/sign-up` + `GET mixlayer.ai/v1/models` | 둘 중 어디에도 도달할 수 없는 출구는 다른 무엇보다 먼저 건너뜀 |
| 메일함 | Emailnator gmail 박스 | 받은편지함이 제공자의 “Upgrade to Premium” 벽뿐인 박스는 버리고 다른 것을 요청 |
| 가입 | 실제 Chrome에서 콘솔 `/sign-up` | 이메일 + 비밀번호 + 약관; Clerk의 보이지 않는 캡차는 페이지 내 clerk-js가 해결 |
| 코드 | 받은편지함의 6자리 코드, 페이지 내 입력 | **발신자가 게이트** (`mixlayer`/`clerk`): 박스는 재활용되고 메시지 id는 호출 간에 회전하므로, 엉뚱한 6자리 코드는 절대 입력될 수 없음 |
| 계정 | `/api/cloud/user` (페이지 내 fetch) | 개인 조직 id |
| 키 | `POST /api/cloud/organizations/<org>/api_keys` | 즉시 `accounts.json`에 기록 — 콘솔은 한 번만 공개 |
| 증명 | `GET /v1/models` + 실제 완료 | `keys.txt`는 채팅 200에서만 키를 받음 |

## ⚙️ CLI 옵션

```bash
node src/cli.js --count N        # N개의 키 발급 (각각 Clerk 가입 한 번)
node src/cli.js --model qwen/qwen3.5-4b-free
node src/cli.js --verify-only    # keys.txt의 모든 키 재검증
node src/cli.js --screen         # 출구 풀 자체 테스트
node src/cli.js --connect-9router
node src/cli.js --help
```

| 플래그 | 기본값 | 의미 |
| --- | --- | --- |
| `--count N` | `1` | 발급할 계정 수, 직렬 |
| `--model <id>` | `qwen/qwen3.5-4b-free` | 실시간 게이트에 사용되는 모델 |
| `--pool <file>` | `proxies.txt` | 출구 풀, 프록시당 한 줄 — 선택 사항 |
| `--tries N` | `3` | 계정당 검증할 출구 후보 |
| `--mint-tries N` | `3` | 출구당 전체 가입 시도 (매번 새 메일박스) |
| `--gap MS` | `4000` | 계정 간 일시 정지 |
| `--code-timeout S` | `300` | 메일박스 시도당 이메일 코드 대기 시간(초) |
| `--key-name <s>` | `mixlayer-1` | 생성된 키에 부여되는 이름 |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router`용 키 파일 |
| `--headless` | 꺼짐 | Chrome을 헤드리스로 실행 (보이는 Chrome이 테스트된 경로) |
| `--browser <exe>` | 자동 | Chrome 바이너리 (환경 변수 `CHROME_PATH`) |
| `--debug-port N` | 자동 | Chrome DevTools 포트 (기본적으로 사용 가능한 0이 아닌 포트) |

| 환경 변수 | 기본값 | 의미 |
| --- | --- | --- |
| `MIXLAYER_PROXIES` | `proxies.txt` | 출구 풀, 프록시당 한 줄 — 선택 사항: 풀이 없으면 CLI는 직접 연결 |
| `MIXLAYER_MODEL` | `qwen/qwen3.5-4b-free` | 실시간 검증용 모델 |
| `CHROME_PATH` | 자동 | 브라우저 경로용 Chrome 바이너리 |

## 🛰️ 프록시 뒤에서

**선택 사항 — 대규모에서는 권장 (IP별 제한, 차단).** 이 도구는 프록시 없이도 작동합니다.

- **풀이 있는 경우:** `--pool <file>`을 전달하거나 `MIXLAYER_PROXIES`를 설정하면 모든 요청 — Chrome 브라우저 포함 — 이 해당 목록의 출구를 통해 나가며, fail-closed 방식입니다: 각 후보는 먼저 검증되고 (`console.mixlayer.com/sign-up` 200 + API 호스트 도달 가능) 실행은 그 출구에 고정됩니다. 죽은 회선은 해당 시도에 실패하고 CLI는 다음 후보로 이동합니다.
- **풀이 없는 경우:** CLI는 `running WITHOUT a proxy (direct)`를 출력하고 직접 연결합니다. 가입, 키 발급 또는 검증에 관해서는 아무것도 바뀌지 않습니다 — 패킷이 나가는 위치만 바뀝니다.
- 두 모드 모두에 대해 `--screen`을 실행하세요: 실제 실행 전에 보유한 출구(또는 직접 경로)를 콘솔과 API에 대해 테스트합니다.
- Chrome은 SOCKS5 프록시에 인증할 수 없으므로 `socks5://user:pass@host:port` 줄은 브라우저 경로에서 제외됩니다 (fail-closed, 절대 조용히 직접 연결하지 않음).

## 📄 파일

| 경로 | 내용 |
| --- | --- |
| `keys.txt` | 한 줄에 하나의 실시간 검증된 키 — git 무시됨 |
| `accounts.json` | 이메일 / 조직 / 비밀번호 / 키 + `gate` — 키가 존재하는 순간 작성됨 |
| `proxies.txt` | 사용자의 출구 — git 무시됨 |
| `out/` | 실행 로그, 실패 스크린샷, `attempts.jsonl` 원장 — git 무시됨 |

## 🔌 9Router에 연결

[9Router](https://9router.com)는 자체 호스팅, OpenAI 호환 라우터입니다:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

기본값: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. 모델은 `mixlayer/<model id>`로 제공됩니다. CLI는 한 번에 동일하게 수행할 수 있습니다: `node src/cli.js --connect-9router`.

## 🔌 OmniRoute에 연결

[OmniRoute](https://omniroute.online)는 자체 호스팅, OpenAI 호환 라우터입니다:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

기본값: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. 모델은 `mixlayer/<model id>`로 제공됩니다. CLI는 한 번에 동일하게 수행할 수 있습니다: `node src/cli.js --connect-omniroute`.
## 🔑 키 하나로 얻는 것

| | |
| --- | --- |
| 🏢 제공자 | **Mixlayer** — [mixlayer.ai](https://mixlayer.ai) |
| 🎁 제공자가 주는 것 | `qwen/qwen3.5-4b-free`의 무료 티어 (입/출력 $0, 선불 크레딧 없음) 및 5개의 유료 id |
| 🔑 키 하나로 얻는 것 | 자체 계정의 키 하나: `https://mixlayer.ai/v1`의 6개 id, 120 RPM / 500k TPM |
| 🌐 API 형태 | OpenAI 호환: `POST https://mixlayer.ai/v1/chat/completions` |
| 🔒 데이터 | `mixlayer.ai` / `console.mixlayer.com` 및 사용자의 받은편지함 백엔드만 접촉됨 |

## 🐞 이슈

Mixlayer가 Clerk 가입 형태, 콘솔 키 라우트 또는 모델 카탈로그를 변경하면, 도구는 그 지점에서 멈추고 그렇게 알립니다. 명령과 정확한 출력을 포함하여 **[이슈를 열어주세요](../../issues)**.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE) 참조.

<div align="center">

**[MIT](LICENSE)** © 2026 mixlayer-bulk-apikey 기여자들

</div>