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

**批量创建 Mixlayer 账户并自动生成 API 密钥 — 兼容 OpenAI 的推理 + 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-6%20served-412991?style=for-the-badge)](https://mixlayer.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-6-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题反馈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么会有这个项目

Mixlayer 托管了一组精选的开源模型，提供兼容 OpenAI 的推理服务，其中一个 id 属于**免费额度**：`qwen/qwen3.5-4b-free` 完全免费，且无需预付费余额。这使得该平台成为一个零成本的文本/编程端点——唯一需要生成的就是账户自己的密钥。注册流程通过 `console.mixlayer.com` 上的 **Clerk** 完成：邮箱 + 密码 + 条款，然后是从收件箱获取的 6 位验证码。Clerk 实例的验证码是不可见的，由页面内的 clerk-js 解决（服务端注册调用会返回 `captcha_missing_token`），这就是为什么该工具驱动真实的 Chrome，而不是向注册端点发送请求。控制台只会显示一次密钥，而密钥路由需要从其自身页面进行身份验证，因此浏览器通道也是生成密钥的方式。

## 🎁 免费额度 — 你能获得多少

| 项目 | 值 |
| --- | --- |
| 免费模型 | **`qwen/qwen3.5-4b-free`** — 输入/输出均为 $0，**无需预付费余额**（文档：“免费模型不需要预付费余额”） |
| 付费模型 | `qwen/qwen3.5-9b`、`qwen/qwen3.6-35b-a3b`、`qwen/qwen3.8-27b`、`z-ai/glm-5.3`、`deepseek/deepseek-v4.1-flash` — 在新账户上会返回 `insufficient_prepaid_credits` |
| 注册 | 邮箱 + 密码 + 条款，然后是 6 位邮箱验证码（Clerk）；**无需手机号，无需银行卡** |
| 密钥 | 每个个人组织一个密钥，在控制台中创建（`inference`、`api-read`、`api-write`；`expires_at: null`） |
| 速率限制 | **每分钟 120 次请求和每分钟 500,000 个 token**（在每个账户上实测，按组织 + 按模型） |
| 可扩展的单位 | **一个账户 = 一个密钥**（密钥属于账户的组织） |

> 💡 免费额度由 Mixlayer 设定，可能会变化。请在 [mixlayer.ai](https://mixlayer.ai) 查看实时数据——并让工具自身的关卡来判定：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 模型 — 全部 6 个

`GET /v1/models` 在一个有效密钥上返回了 **6 个 id**（2026-10-21）：

| 模型 ID | 备注 |
| --- | --- |
| `qwen/qwen3.5-4b-free` | 免费额度 — 聊天验证 **11/11** 个密钥通过；推理模型，简短回答会将文本放在 `reasoning_content` 中 |
| `qwen/qwen3.5-9b` | 付费（需要预付费余额） |
| `qwen/qwen3.6-35b-a3b` | 付费 |
| `qwen/qwen3.8-27b` | 付费 |
| `z-ai/glm-5.3` | 付费，始终开启推理，支持 Low/High/Max 强度 |
| `deepseek/deepseek-v4.1-flash` | 付费，可选思考，支持强度级别 |

验证默认返回 200 并带有内容或推理：

```bash
curl https://mixlayer.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-4b-free","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🧪 如何使用 API

基础 URL **`https://mixlayer.ai/v1`** — 兼容 OpenAI。密钥以 `sk_mxl_` 为前缀。

认证形式：每个请求都带一个 bearer token（`Authorization: Bearer <key>`）——文档中的 `MIXLAYER_API_KEY` 正是这个字符串。

```python
from openai import OpenAI
c = OpenAI(base_url="https://mixlayer.ai/v1", api_key="YOUR_KEY")
print(c.chat.completions.create(model="qwen/qwen3.5-4b-free",
      messages=[{"role":"user","content":"hi"}]).choices[0].message.content)
```

速率限制仅以响应头的形式公布——`x-ratelimit-limit-requests` / `-limit-tokens`（以及对应的 `remaining` 头，外加 `retry-after`）。被拒绝的请求会返回 HTTP **429** `{"error":{"type":"rate_limit_exceeded"}}`；请等待 `retry-after` 时间结束。

没有余额的付费模型会返回 HTTP 400 `{"error":{"type":"billing_error","code":"insufficient_prepaid_credits"}}`——不要用退避重试它。

## 🛠 快速开始

```bash
cd mixlayer-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 1        # one Clerk sign-up in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # test the exit list against the console + API
```

注册需要真实的 Chrome（Clerk 会挂载自己的验证码）；`keys.txt` 只有在 `GET /v1/models` + 一次真实补全之后才会写入，而 `accounts.json` 会在控制台返回密钥的那一刻记录它（这样即使关卡出现小故障也不会丢失它）。

### 🖱️ 启动器

启动器会询问代理列表（可选——没有代理时 CLI 直接运行）和账户数量，记住它们，然后运行 CLI——生成、验证、筛选出口、设置、帮助、连接到 9Router。

## ✅ 已验证可用 — 每个密钥都经过测试

以下所有检查均于 **2026-10-21** 在随附的 CLI 上运行（代理池出口：通过 `socks5h://127.0.0.1:40000` 的 proxy）。

| 检查 | 结果 |
| --- | --- |
| `--screen`（出口审查） | **✔ 0.9 秒** — `console.mixlayer.com/sign-up` **200** + `mixlayer.ai/v1/models` 可达（无密钥时 **401**） |
| 真实 Chrome 中的 Clerk 注册 | **✔** — `/sign-up` → 邮箱 + 密码 + 条款 → 继续 → `#/verify-email-address` → 6 位验证码 → `/app` |
| `POST /api/cloud/organizations/<org>/api_keys` | **200** — 密钥仅返回一次（`inference`、`api-read`、`api-write`） |
| 每个密钥的 `GET /v1/models` | **200**，6 个 id |
| 写入前每个密钥的 `POST /v1/chat/completions` | **200** — 在 `qwen/qwen3.5-4b-free` 上 **11/11** 个密钥通过（`content \|\| reasoning_content`） |
| `--verify-only`（对全部 11 个的独立复查） | **11/11** 聊天返回 200，每个都带有 `x-ratelimit-limit-requests: 120` + `-limit-tokens: 500000` |
| 聊天检查失败的密钥 | 永远不会写入 `keys.txt` — 该账户保留在 `accounts.json` 中并标记 `gate: failed` |

```bash
node src/cli.js --verify-only
node src/cli.js --screen
```

## 🧭 工作原理

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Mixlayer page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://mixlayer.ai/v1/chat/completions → real content = the key is live
```

| 步骤 | 调用 | 备注 |
| --- | --- | --- |
| 审查 | `GET console.mixlayer.com/sign-up` + `GET mixlayer.ai/v1/models` | 无法访问其中任何一个的出口会在其他一切之前被跳过 |
| 邮箱 | Emailnator gmail 邮箱 | 收件箱只有服务商“升级到高级版”付费墙的邮箱会被丢弃，并请求另一个 |
| 注册 | 真实 Chrome 中的控制台 `/sign-up` | 邮箱 + 密码 + 条款；Clerk 的不可见验证码由页面内的 clerk-js 解决 |
| 验证码 | 从收件箱获取的 6 位验证码，在页面内输入 | **发件人是关卡**（`mixlayer`/`clerk`）：邮箱会被回收，其消息 id 在调用之间轮换，因此绝不会输入来路不明的 6 位验证码 |
| 账户 | `/api/cloud/user`（页面内 fetch） | 个人组织 id |
| 密钥 | `POST /api/cloud/organizations/<org>/api_keys` | 立即记录到 `accounts.json` — 控制台只显示一次 |
| 证明 | `GET /v1/models` + 一次真实补全 | `keys.txt` 仅在聊天返回 200 时才接收该密钥 |

## ⚙️ CLI 选项

```bash
node src/cli.js --count N        # mint N keys (one Clerk sign-up each)
node src/cli.js --model qwen/qwen3.5-4b-free
node src/cli.js --verify-only    # re-verify every key in keys.txt
node src/cli.js --screen         # exit pool self-test
node src/cli.js --connect-9router
node src/cli.js --help
```

| 标志 | 默认值 | 含义 |
| --- | --- | --- |
| `--count N` | `1` | 要生成的账户数量，串行 |
| `--model <id>` | `qwen/qwen3.5-4b-free` | 用于实时关卡的模型 |
| `--pool <file>` | `proxies.txt` | 出口池，每行一个代理 — 可选 |
| `--tries N` | `3` | 每个账户审查的出口候选数 |
| `--mint-tries N` | `3` | 每个出口的完整注册尝试次数（每次使用全新邮箱） |
| `--gap MS` | `4000` | 账户之间的暂停 |
| `--code-timeout S` | `300` | 每次邮箱尝试等待邮件验证码的秒数 |
| `--key-name <s>` | `mixlayer-1` | 为创建的密钥指定的名称 |
| `--keys <file>` | `keys.txt` | 用于 `--verify-only` / `--connect-9router` 的密钥文件 |
| `--headless` | 关闭 | 以无头模式运行 Chrome（可见的 Chrome 是经过测试的通道） |
| `--browser <exe>` | 自动 | Chrome 二进制文件（环境变量 `CHROME_PATH`） |
| `--debug-port N` | 自动 | Chrome DevTools 端口（默认使用一个空闲的非零端口） |

| 环境变量 | 默认值 | 含义 |
| --- | --- | --- |
| `MIXLAYER_PROXIES` | `proxies.txt` | 出口池，每行一个代理 — 可选：没有代理池时 CLI 直接连接 |
| `MIXLAYER_MODEL` | `qwen/qwen3.5-4b-free` | 用于实时验证的模型 |
| `CHROME_PATH` | 自动 | 浏览器通道使用的 Chrome 二进制文件 |

## 🛰️ 在代理后面

**可选 — 大规模使用时推荐（按 IP 的限制、封禁）。** 该工具在没有代理时也能工作。

- **有代理池时：** 传入 `--pool <file>`（或设置 `MIXLAYER_PROXIES`），每个请求——包括 Chrome 浏览器——都会经过该列表中的一个出口，故障关闭：每个候选都会先被审查（`console.mixlayer.com/sign-up` 200 + API 主机可达），然后运行会固定使用该出口。失效的线路会使其尝试失败，CLI 会转向下一个候选。
- **没有代理池时：** CLI 会打印 `running WITHOUT a proxy (direct)` 并直接连接。注册、密钥生成或验证没有任何变化——只是数据包发出的位置不同。
- 对任一模式运行 `--screen`：它会在真实运行之前，用你拥有的出口（或直接路由）对控制台和 API 进行测试。
- Chrome 无法向 SOCKS5 代理进行身份验证，因此 `socks5://user:pass@host:port` 行会从浏览器通道中丢弃（故障关闭，绝不静默直连）。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `keys.txt` | 每行一个经过实时验证的密钥 — 已被 git 忽略 |
| `accounts.json` | 邮箱 / 组织 / 密码 / 密钥 + `gate` — 在密钥存在的那一刻写入 |
| `proxies.txt` | 你的出口 — 已被 git 忽略 |
| `out/` | 运行日志、失败截图、`attempts.jsonl` 台账 — 已被 git 忽略 |

## 🔌 连接到 9Router

[9Router](https://9router.com) 是一个自托管、兼容 OpenAI 的路由器：

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

默认值：`--prefix mixlayer`、`--base-url https://mixlayer.ai/v1`、`--model qwen/qwen3.5-4b-free`。模型以 `mixlayer/<model id>` 的形式提供。CLI 可以一步完成同样的事情：`node src/cli.js --connect-9router`。

## 🔌 连接到 OmniRoute

[OmniRoute](https://omniroute.online) 是一个自托管、兼容 OpenAI 的路由器：

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

默认值：`--prefix mixlayer`、`--base-url https://mixlayer.ai/v1`、`--model qwen/qwen3.5-4b-free`。模型以 `mixlayer/<model id>` 的形式提供。CLI 可以一步完成同样的事情：`node src/cli.js --connect-omniroute`。
## 🔑 一个密钥能给你带来什么

| | |
| --- | --- |
| 🏢 提供商 | **Mixlayer** — [mixlayer.ai](https://mixlayer.ai) |
| 🎁 提供商提供的内容 | `qwen/qwen3.5-4b-free` 上的免费额度（输入/输出 $0，无需预付费余额）外加 5 个付费 id |
| 🔑 一个密钥能给你带来什么 | 在其自己账户上的一个密钥：`https://mixlayer.ai/v1` 上的 6 个 id，120 RPM / 500k TPM |
| 🌐 API 形式 | 兼容 OpenAI：`POST https://mixlayer.ai/v1/chat/completions` |
| 🔒 你的数据 | 仅会联系 `mixlayer.ai` / `console.mixlayer.com` 和你的收件箱后端 |

## 🐞 问题反馈

如果 Mixlayer 更改了其 Clerk 注册形式、控制台密钥路由或模型目录，该工具会停在那里并说明原因。请**[提交 issue](../../issues)**，附上命令和确切的输出。

## 📄 许可证

MIT © 2026 — 参见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 mixlayer-bulk-apikey contributors

</div>