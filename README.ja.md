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

**自動生成された API キーで Mixlayer アカウントを一括作成 — OpenAI 互換の推論 + 9Router コネクタ。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-6%20served-412991?style=for-the-badge)](https://mixlayer.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-6-of-them) · [🧪 API の使い方](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🐞 問題](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ これが存在する理由

Mixlayer は OpenAI 互換の推論の背後で厳選されたオープンソースモデルのセットをホストしており、そのうちの 1 つの id は**無料枠**にあります: `qwen/qwen3.5-4b-free` は無料で、前払いクレジットも不要です。これにより、このパネルはゼロコストのテキスト/コーディングエンドポイントになります — アカウント自身のキーだけが発行すべきものです。サインアップは `console.mixlayer.com` 上の **Clerk** を通じて行われます: メールアドレス + パスワード + 規約、そして受信トレイに届く 6 桁のコード。Clerk のインスタンスキャプチャは不可視で、clerk-js によって*ページ内で*解決されます（サーバー側のサインアップ呼び出しは `captcha_missing_token` を返します）。だからこそ、このツールは register エンドポイントに POST するのではなく、実際の Chrome を操作します。コンソールはキーを一度だけ表示し、キーのルートは自身のページから認証するため、ブラウザ経由のルートがキーを発行する手段でもあります。

## 🎁 無料枠 — どれだけ得られるか

| 項目 | 値 |
| --- | --- |
| 無料モデル | **`qwen/qwen3.5-4b-free`** — 入力/出力 $0、**前払いクレジット不要**（ドキュメント: 「無料モデルは前払いクレジットを必要としません」） |
| 有料モデル | `qwen/qwen3.5-9b`、`qwen/qwen3.6-35b-a3b`、`qwen/qwen3.8-27b`、`z-ai/glm-5.3`、`deepseek/deepseek-v4.1-flash` — 新規アカウントでは `insufficient_prepaid_credits` を返します |
| サインアップ | メールアドレス + パスワード + 規約、そして 6 桁のメールコード（Clerk）。**電話番号不要、カード不要** |
| キー | 個人組織ごとに 1 つのキー、コンソールで作成（`inference`、`api-read`、`api-write`、`expires_at: null`） |
| レート制限 | **120 リクエスト/分、500,000 トークン/分**（すべてのアカウントで測定、組織単位 + モデル単位） |
| スケールする単位 | **1 アカウント = 1 キー**（キーはアカウントの組織に属します） |

> 💡 無料枠は Mixlayer によって設定されており、変更される可能性があります。最新の数値は [mixlayer.ai](https://mixlayer.ai) で確認してください — そしてツール自身のゲートに判断させてください:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 モデル — 全 6 種類

`GET /v1/models` はライブキーで **6 つの id** を返しました（2026-10-21）:

| モデル ID | 備考 |
| --- | --- |
| `qwen/qwen3.5-4b-free` | 無料枠 — チャット検証済み **11/11** キー。推論モデルで、短い回答ではテキストが `reasoning_content` に入ります |
| `qwen/qwen3.5-9b` | 有料（前払いクレジットが必要） |
| `qwen/qwen3.6-35b-a3b` | 有料 |
| `qwen/qwen3.8-27b` | 有料 |
| `z-ai/glm-5.3` | 有料、常時推論で Low/High/Max のエフォート |
| `deepseek/deepseek-v4.1-flash` | 有料、エフォートレベル付きのオプションの思考 |

検証のデフォルトはコンテンツまたは推論を含む 200 を返します:

```bash
curl https://mixlayer.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-4b-free","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🧪 API の使い方

ベース URL **`https://mixlayer.ai/v1`** — OpenAI 互換。キーには `sk_mxl_` のプレフィックスが付きます。

認証の形式: すべてのリクエストにベアラートークン（`Authorization: Bearer <key>`）— ドキュメント自身の `MIXLAYER_API_KEY` はまさにこの文字列です。

```python
from openai import OpenAI
c = OpenAI(base_url="https://mixlayer.ai/v1", api_key="YOUR_KEY")
print(c.chat.completions.create(model="qwen/qwen3.5-4b-free",
      messages=[{"role":"user","content":"hi"}]).choices[0].message.content)
```

レート制限はレスポンスヘッダーとしてのみ公開されています — `x-ratelimit-limit-requests` / `-limit-tokens`（および `remaining` の双子、さらに `retry-after`）。拒否されたリクエストは HTTP **429** `{"error":{"type":"rate_limit_exceeded"}}` を返します。`retry-after` が経過するまで待ってください。

クレジットのない有料モデルは HTTP 400 `{"error":{"type":"billing_error","code":"insufficient_prepaid_credits"}}` を返します — バックオフで再試行しないでください。

## 🛠 クイックスタート

```bash
cd mixlayer-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings

# or directly:
node src/cli.js --count 1        # one Clerk sign-up in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # test the exit list against the console + API
```

サインアップには実際の Chrome が必要です（Clerk が独自のキャプチャをマウントします）。`keys.txt` は `GET /v1/models` + 実際の補完の後にのみ書き込まれ、`accounts.json` はコンソールがキーを返した瞬間にそのキーを記録します（ゲートの不具合で失われることがないように）。

### 🖱️ ランチャー

ランチャーはプロキシリスト（オプション — なしの場合は CLI が直接実行されます）とアカウント数を尋ね、それらを記憶して CLI を実行します — mint、verify、screen exits、settings、help、Connect to 9Router。

## ✅ 動作検証済み — すべてのキーがテストされています

以下のすべてのチェックは **2026-10-21** に出荷された CLI から実行されました（プール出口: `socks5h://127.0.0.1:40000` 経由の proxy）。

| チェック | 結果 |
| --- | --- |
| `--screen`（出口審査） | **✔ 0.9 秒** — `console.mixlayer.com/sign-up` **200** + `mixlayer.ai/v1/models` 到達可能（キーなしで **401**） |
| 実際の Chrome での Clerk サインアップ | **✔** — `/sign-up` → メールアドレス + パスワード + 規約 → 続行 → `#/verify-email-address` → 6 桁のコード → `/app` |
| `POST /api/cloud/organizations/<org>/api_keys` | **200** — キーが一度だけ返される（`inference`、`api-read`、`api-write`） |
| キーごとの `GET /v1/models` | **200**、6 つの id |
| 書き込まれる前のキーごとの `POST /v1/chat/completions` | **200** — `qwen/qwen3.5-4b-free` で **11/11** キー（`content \|\| reasoning_content`） |
| `--verify-only`（全 11 の独立した再チェック） | **11/11** チャット 200、それぞれ `x-ratelimit-limit-requests: 120` + `-limit-tokens: 500000` |
| チャットチェックに失敗したキー | `keys.txt` に書き込まれることはありません — アカウントは `gate: failed` として `accounts.json` に残ります |

```bash
node src/cli.js --verify-only
node src/cli.js --screen
```

## 🧭 仕組み

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Mixlayer page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://mixlayer.ai/v1/chat/completions → real content = the key is live
```

| ステップ | 呼び出し | 備考 |
| --- | --- | --- |
| 審査 | `GET console.mixlayer.com/sign-up` + `GET mixlayer.ai/v1/models` | どちらにも到達できない出口は、他の何よりも前にスキップされます |
| メールボックス | Emailnator gmail box | 受信トレイがプロバイダの「Upgrade to Premium」の壁だけであるボックスは破棄され、別のものが要求されます |
| サインアップ | 実際の Chrome でのコンソール `/sign-up` | メールアドレス + パスワード + 規約。Clerk の不可視キャプチャはページ内の clerk-js によって解決されます |
| コード | 受信トレイからの 6 桁のコードをページ内で入力 | **送信者がゲートです**（`mixlayer`/`clerk`）: ボックスはリサイクルされ、そのメッセージ id は呼び出し間でローテーションするため、無関係な 6 桁のコードが入力されることは決してありません |
| アカウント | `/api/cloud/user`（ページ内 fetch） | 個人組織の id |
| キー | `POST /api/cloud/organizations/<org>/api_keys` | 直ちに `accounts.json` に記録されます — コンソールは一度だけ表示します |
| 証明 | `GET /v1/models` + 実際の補完 | `keys.txt` はチャット 200 の場合にのみキーを受け取ります |

## ⚙️ CLI オプション

```bash
node src/cli.js --count N        # mint N keys (one Clerk sign-up each)
node src/cli.js --model qwen/qwen3.5-4b-free
node src/cli.js --verify-only    # re-verify every key in keys.txt
node src/cli.js --screen         # exit pool self-test
node src/cli.js --connect-9router
node src/cli.js --help
```

| フラグ | デフォルト | 意味 |
| --- | --- | --- |
| `--count N` | `1` | 発行するアカウント数、直列 |
| `--model <id>` | `qwen/qwen3.5-4b-free` | ライブゲートに使用するモデル |
| `--pool <file>` | `proxies.txt` | 出口プール、1 行につき 1 プロキシ — オプション |
| `--tries N` | `3` | アカウントごとに審査する出口候補 |
| `--mint-tries N` | `3` | 出口ごとの完全なサインアップ試行（毎回新しいメールボックス） |
| `--gap MS` | `4000` | アカウント間の一時停止 |
| `--code-timeout S` | `300` | メールコードを待つ秒数、メールボックス試行ごと |
| `--key-name <s>` | `mixlayer-1` | 作成されるキーに与える名前 |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router` 用のキーファイル |
| `--headless` | オフ | Chrome をヘッドレスで実行（可視 Chrome がテスト済みのルート） |
| `--browser <exe>` | 自動 | Chrome バイナリ（環境変数 `CHROME_PATH`） |
| `--debug-port N` | 自動 | Chrome DevTools ポート（デフォルトでは空いている非ゼロのもの） |

| 環境変数 | デフォルト | 意味 |
| --- | --- | --- |
| `MIXLAYER_PROXIES` | `proxies.txt` | 出口プール、1 行につき 1 プロキシ — オプション: プールなしの場合、CLI は直接接続します |
| `MIXLAYER_MODEL` | `qwen/qwen3.5-4b-free` | ライブ検証用のモデル |
| `CHROME_PATH` | 自動 | ブラウザルート用の Chrome バイナリ |

## 🛰️ プロキシの背後で

**オプション — 規模を拡大する場合は推奨（IP ごとの制限、BAN）。** このツールはプロキシなしでも動作します。

- **プールあり:** `--pool <file>` を渡す（または `MIXLAYER_PROXIES` を設定する）と、すべてのリクエスト — Chrome ブラウザを含む — がそのリストの出口を経由し、フェイルクローズドになります: 各候補は最初に審査され（`console.mixlayer.com/sign-up` 200 + API ホストに到達可能）、その後実行はその出口に固定されたままになります。死んだ回線はその試行に失敗し、CLI は次の候補に移ります。
- **プールなし:** CLI は `running WITHOUT a proxy (direct)` と表示し、直接接続します。サインアップ、キー発行、検証について何も変わりません — パケットが出ていく場所だけが変わります。
- どちらのモードでも `--screen` を実行してください: 実際の実行前に、持っている出口（または直接ルート）をコンソールと API に対してテストします。
- Chrome は SOCKS5 プロキシに認証できないため、`socks5://user:pass@host:port` の行はブラウザルートから除外されます（フェイルクローズド、決して暗黙に直接接続しない）。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `keys.txt` | 1 行につき 1 つのライブ検証済みキー — git 無視 |
| `accounts.json` | メールアドレス / 組織 / パスワード / キー + `gate` — キーが存在した瞬間に書き込まれます |
| `proxies.txt` | あなたの出口 — git 無視 |
| `out/` | 実行ログ、失敗のスクリーンショット、`attempts.jsonl` 台帳 — git 無視 |

## 🔌 9Router に接続

[9Router](https://9router.com) はセルフホスト型の OpenAI 互換ルーターです:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

デフォルト: `--prefix mixlayer`、`--base-url https://mixlayer.ai/v1`、`--model qwen/qwen3.5-4b-free`。モデルは `mixlayer/<model id>` として提供されます。CLI でもワンショットで同じことができます: `node src/cli.js --connect-9router`。

## 🔌 OmniRoute に接続

[OmniRoute](https://omniroute.online) はセルフホスト型の OpenAI 互換ルーターです:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

デフォルト: `--prefix mixlayer`、`--base-url https://mixlayer.ai/v1`、`--model qwen/qwen3.5-4b-free`。モデルは `mixlayer/<model id>` として提供されます。CLI でもワンショットで同じことができます: `node src/cli.js --connect-omniroute`。

## 🔑 1 つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダー | **Mixlayer** — [mixlayer.ai](https://mixlayer.ai) |
| 🎁 プロバイダーが提供するもの | `qwen/qwen3.5-4b-free` の無料枠（入力/出力 $0、前払いクレジット不要）に加えて 5 つの有料 id |
| 🔑 1 つのキーで得られるもの | 独自のアカウント上の 1 つのキー: `https://mixlayer.ai/v1` の 6 つの id、120 RPM / 500k TPM |
| 🌐 API の形式 | OpenAI 互換: `POST https://mixlayer.ai/v1/chat/completions` |
| 🔒 あなたのデータ | `mixlayer.ai` / `console.mixlayer.com` とあなたの受信トレイバックエンドのみが接触されます |

## 🐞 問題

Mixlayer が Clerk のサインアップ形式、コンソールのキールート、またはモデルカタログを変更した場合、ツールはそこで停止し、その旨を報告します。コマンドと正確な出力を添えて **[issue を作成してください](../../issues)**。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照。

<div align="center">

**[MIT](LICENSE)** © 2026 mixlayer-bulk-apikey contributors

</div>