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

**Otomatik oluşturulan API anahtarlarıyla toplu Mixlayer hesabı açın — OpenAI uyumlu çıkarım + 9Router bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-6%20served-412991?style=for-the-badge)](https://mixlayer.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-6-of-them) · [🧪 API'yi kullanma](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

Mixlayer, OpenAI uyumlu çıkarım arkasında özenle seçilmiş bir açık kaynak model kümesi barındırır ve kimliklerinden biri **ücretsiz katmanda**dır: `qwen/qwen3.5-4b-free` hiçbir ücret gerektirmez ve ön ödemeli kredi istemez. Bu da paneli sıfır maliyetli bir metin/kod uç noktası yapar — hesabın kendi anahtarı üretilecek tek şeydir. Kayıt, `console.mixlayer.com` üzerinde **Clerk** üzerinden yürür: e-posta + parola + koşullar, ardından gelen kutudan 6 haneli bir kod. Clerk'in örnek captcha'sı görünmezdir ve clerk-js tarafından *sayfa içinde* çözülür (sunucu tarafı bir kayıt çağrısı `captcha_missing_token` yanıtı verir), bu yüzden araç kayıt uç noktasına POST atmak yerine gerçek bir Chrome'u sürer. Konsol anahtarı yalnızca bir kez gösterir ve anahtar rotası kendi sayfasından kimlik doğrular, dolayısıyla anahtarı üreten şey de tarayıcı rayıdır.

## 🎁 Ücretsiz katman — ne kadar alıyorsunuz

| Ne | Değer |
| --- | --- |
| Ücretsiz model | **`qwen/qwen3.5-4b-free`** — giriş/çıkış $0, **ön ödemeli kredi gerekmez** (dokümanlar: "Ücretsiz modeller ön ödemeli kredi gerektirmez") |
| Ücretli modeller | `qwen/qwen3.5-9b`, `qwen/qwen3.6-35b-a3b`, `qwen/qwen3.8-27b`, `z-ai/glm-5.3`, `deepseek/deepseek-v4.1-flash` — bunlar yeni bir hesapta `insufficient_prepaid_credits` yanıtı verir |
| Kayıt | e-posta + parola + koşullar, ardından 6 haneli e-posta kodu (Clerk); **telefon yok, kart yok** |
| Anahtar | kişisel organizasyon başına bir anahtar, konsolda oluşturulur (`inference`, `api-read`, `api-write`; `expires_at: null`) |
| Hız limitleri | **dakikada 120 istek ve dakikada 500.000 token** (her hesapta ölçülür, organizasyon başına + model başına) |
| Ölçeklenen birim | **bir hesap = bir anahtar** (anahtar hesabın organizasyonuna aittir) |

> 💡 Ücretsiz katman Mixlayer tarafından belirlenir ve değişebilir. Güncel sayıları [mixlayer.ai](https://mixlayer.ai) adresinden kontrol edin — ve kararı aracın kendi kapısına bırakın:

```bash
node src/cli.js --verify-only     # keys.txt içindeki her anahtar gerçek bir sohbet çağrısıyla yeniden test edilir
```

## 🤖 Modeller — 6'sının tamamı

`GET /v1/models` canlı bir anahtarda **6 kimlik** döndürdü (2026-10-21):

| Model Kimliği | not |
| --- | --- |
| `qwen/qwen3.5-4b-free` | ücretsiz katman — sohbetle doğrulanmış **11/11** anahtar; akıl yürütme modeli, kısa yanıtlar metni `reasoning_content` içine koyar |
| `qwen/qwen3.5-9b` | ücretli (ön ödemeli kredi gerekir) |
| `qwen/qwen3.6-35b-a3b` | ücretli |
| `qwen/qwen3.8-27b` | ücretli |
| `z-ai/glm-5.3` | ücretli, Low/High/Max eforlu her zaman açık akıl yürütme |
| `deepseek/deepseek-v4.1-flash` | ücretli, efor seviyeleriyle isteğe bağlı düşünme |

Doğrulama varsayılanı içerik veya akıl yürütmeyle 200 yanıtı verir:

```bash
curl https://mixlayer.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-4b-free","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🧪 API nasıl kullanılır

Temel URL **`https://mixlayer.ai/v1`** — OpenAI uyumlu. Anahtarlar `sk_mxl_` öneki taşır.

Kimlik doğrulama şekli: her istekte bir bearer token (`Authorization: Bearer <key>`) — dokümanların kendi `MIXLAYER_API_KEY` değeri tam olarak bu dizedir.

```python
from openai import OpenAI
c = OpenAI(base_url="https://mixlayer.ai/v1", api_key="YOUR_KEY")
print(c.chat.completions.create(model="qwen/qwen3.5-4b-free",
      messages=[{"role":"user","content":"hi"}]).choices[0].message.content)
```

Hız limitleri yalnızca yanıt başlıkları olarak yayımlanır — `x-ratelimit-limit-requests` / `-limit-tokens` (ve `remaining` ikizleri, ayrıca `retry-after`). Reddedilen bir istek HTTP **429** `{"error":{"type":"rate_limit_exceeded"}}` yanıtı verir; `retry-after` süresini bekleyin.

Kredisiz bir ücretli model HTTP 400 `{"error":{"type":"billing_error","code":"insufficient_prepaid_credits"}}` yanıtı verir — geri çekilmeli yeniden denemeyin.

## 🛠 Hızlı başlangıç

```bash
cd mixlayer-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # isteğe bağlı — olmadan araç doğrudan çalışır
node src/launcher.js        # etkileşimli: üret / doğrula / tara / ayarlar

# veya doğrudan:
node src/cli.js --count 1        # gerçek bir Chrome'da bir Clerk kaydı
node src/cli.js --verify-only    # keys.txt içinde zaten bulunan her anahtarı yeniden test et
node src/cli.js --screen         # çıkış listesini konsol + API'ye karşı test et
```

Kayıt gerçek bir Chrome gerektirir (Clerk kendi captcha'sını bağlar); `keys.txt` yalnızca `GET /v1/models` + gerçek bir tamamlama sonrasında yazılır ve `accounts.json` konsol anahtarı döndürdüğü anda anahtarı kaydeder (böylece bir kapı aksaklığı onu kaybedemez).

### 🖱️ Başlatıcı

Başlatıcı proxy listesini (isteğe bağlı — olmadan CLI doğrudan çalışır) ve hesap sayısını sorar, bunları hatırlar ve CLI'yi çalıştırır — üret, doğrula, çıkışları tara, ayarlar, yardım, 9Router'a Bağlan.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

Aşağıdaki tüm kontroller **2026-10-21** tarihinde gönderilen CLI üzerinde çalıştırıldı (havuz çıkışı: `socks5h://127.0.0.1:40000` üzerinden proxy).

| Kontrol | Sonuç |
| --- | --- |
| `--screen` (çıkış denetimi) | **✔ 0.9 sn** — `console.mixlayer.com/sign-up` **200** + `mixlayer.ai/v1/models` erişilebilir (anahtarsız **401**) |
| Gerçek Chrome'da Clerk kaydı | **✔** — `/sign-up` → e-posta + parola + koşullar → devam → `#/verify-email-address` → 6 haneli kod → `/app` |
| `POST /api/cloud/organizations/<org>/api_keys` | **200** — anahtar bir kez döndürülür (`inference`, `api-read`, `api-write`) |
| Anahtar başına `GET /v1/models` | **200**, 6 kimlik |
| Yazılmadan önce anahtar başına `POST /v1/chat/completions` | **200** — `qwen/qwen3.5-4b-free` üzerinde **11/11** anahtar (`content \|\| reasoning_content`) |
| `--verify-only` (11'inin bağımsız yeniden kontrolü) | **11/11** sohbet-200, her biri `x-ratelimit-limit-requests: 120` + `-limit-tokens: 500000` ile |
| sohbet kontrolünde başarısız olan bir anahtar | `keys.txt` dosyasına asla yazılmaz — hesap `accounts.json` içinde `gate: failed` ile kalır |

```bash
node src/cli.js --verify-only
node src/cli.js --screen
```

## 🧭 Nasıl çalışır

```
gelen kutusu (hesap başına bir adres)                            hesap başına yeni bir adres
   │
   ├─▶ kayıt: Mixlayer sayfası → e-posta adresi → gelen kutusundan kod / bağlantı
   ├─▶ oturum: hesabın çerezleri veya erişim token'ı elde
   ├─▶ anahtar üretimi: hesabın anahtar uç noktası → düz metin anahtar bir kez döndürülür (hemen diske yazılır)
   └─▶ canlı kanıt: POST https://mixlayer.ai/v1/chat/completions → gerçek içerik = anahtar canlı
```

| Adım | Çağrı | Notlar |
| --- | --- | --- |
| denetim | `GET console.mixlayer.com/sign-up` + `GET mixlayer.ai/v1/models` | ikisine de ulaşamayan bir çıkış, başka her şeyden önce atlanır |
| posta kutusu | Emailnator gmail kutusu | gelen kutusu yalnızca sağlayıcının "Upgrade to Premium" duvarından ibaret olan bir kutu bırakılır ve başka bir tane istenir |
| kayıt | gerçek Chrome'da konsol `/sign-up` | e-posta + parola + koşullar; Clerk'in görünmez captcha'sı sayfadaki clerk-js tarafından çözülür |
| kod | gelen kutusundan 6 haneli kod, sayfa içinde girilir | **gönderen kapıdır** (`mixlayer`/`clerk`): kutu geri dönüştürülür ve mesaj kimlikleri çağrılar arasında değişir, böylece başıboş bir 6 haneli kod asla girilemez |
| hesap | `/api/cloud/user` (sayfa içi fetch) | kişisel organizasyon kimliği |
| anahtar | `POST /api/cloud/organizations/<org>/api_keys` | hemen `accounts.json` içine kaydedilir — konsol onu bir kez gösterir |
| kanıt | `GET /v1/models` + gerçek bir tamamlama | `keys.txt` anahtarı yalnızca sohbet 200'ünde alır |

## ⚙️ CLI seçenekleri

```bash
node src/cli.js --count N        # N anahtar üret (her biri için bir Clerk kaydı)
node src/cli.js --model qwen/qwen3.5-4b-free
node src/cli.js --verify-only    # keys.txt içindeki her anahtarı yeniden doğrula
node src/cli.js --screen         # çıkış havuzu öz testi
node src/cli.js --connect-9router
node src/cli.js --help
```

| Bayrak | Varsayılan | Anlamı |
| --- | --- | --- |
| `--count N` | `1` | üretilecek hesap sayısı, sıralı |
| `--model <id>` | `qwen/qwen3.5-4b-free` | canlı kapı için kullanılan model |
| `--pool <file>` | `proxies.txt` | çıkış havuzu, satır başına bir proxy — isteğe bağlı |
| `--tries N` | `3` | hesap başına denetlenen çıkış adayı |
| `--mint-tries N` | `3` | çıkış başına tam kayıt denemesi (her seferinde yeni posta kutusu) |
| `--gap MS` | `4000` | hesaplar arası bekleme |
| `--code-timeout S` | `300` | posta kutusu denemesi başına e-posta kodunu bekleme saniyesi |
| `--key-name <s>` | `mixlayer-1` | oluşturulan anahtara verilen ad |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router` için anahtar dosyası |
| `--headless` | kapalı | Chrome'u headless çalıştır (görünür Chrome test edilen raydır) |
| `--browser <exe>` | otomatik | Chrome ikili dosyası (ortam değişkeni `CHROME_PATH`) |
| `--debug-port N` | otomatik | Chrome DevTools portu (varsayılan olarak boş, sıfır olmayan bir port) |

| Ortam Değişkeni | Varsayılan | Anlamı |
| --- | --- | --- |
| `MIXLAYER_PROXIES` | `proxies.txt` | çıkış havuzu, satır başına bir proxy — isteğe bağlı: havuz olmadan CLI doğrudan bağlanır |
| `MIXLAYER_MODEL` | `qwen/qwen3.5-4b-free` | canlı doğrulama için model |
| `CHROME_PATH` | otomatik | tarayıcı rayı için Chrome ikili dosyası |

## 🛰️ Proxy arkasında

**İsteğe bağlı — ölçekte önerilir (IP başına limitler, yasaklar).** Araç proxy olmadan da çalışır.

- **Havuzla:** `--pool <file>` geçin (veya `MIXLAYER_PROXIES` ayarlayın) ve her istek — Chrome tarayıcısı dahil — o listeden bir çıkıştan geçer, fail-closed: her aday önce denetlenir (`console.mixlayer.com/sign-up` 200 + API ana bilgisayarı erişilebilir) ve çalışma ardından o çıkışa sabitlenir. Ölü bir hat denemesinde başarısız olur ve CLI bir sonraki adaya geçer.
- **Havuzsuz:** CLI `running WITHOUT a proxy (direct)` yazdırır ve doğrudan bağlanır. Kayıt, anahtar üretimi veya doğrulamayla ilgili hiçbir şey değişmez — yalnızca paketlerin nereden çıktığı değişir.
- Her iki moda karşı `--screen` çalıştırın: gerçek bir çalıştırmadan önce sahip olduğunuz çıkışları (veya doğrudan rotayı) konsol ve API'ye karşı test eder.
- Chrome bir SOCKS5 proxy'sine kimlik doğrulayamaz, bu nedenle `socks5://user:pass@host:port` satırları tarayıcı rayından çıkarılır (fail-closed, asla sessizce doğrudan değil).

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `keys.txt` | satır başına bir canlı doğrulanmış anahtar — git tarafından yok sayılır |
| `accounts.json` | e-posta / organizasyon / parola / anahtar + `gate` — anahtar var olduğu anda yazılır |
| `proxies.txt` | çıkışlarınız — git tarafından yok sayılır |
| `out/` | çalıştırma günlükleri, başarısızlık ekran görüntüleri, `attempts.jsonl` defteri — git tarafından yok sayılır |

## 🔌 9Router'a bağlan

[9Router](https://9router.com) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Varsayılanlar: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Modeller `mixlayer/<model id>` olarak sunulur. CLI aynısını tek seferde yapabilir: `node src/cli.js --connect-9router`.

## 🔌 OmniRoute'a bağlan

[OmniRoute](https://omniroute.online) kendi kendine barındırılan, OpenAI uyumlu bir yönlendiricidir:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Varsayılanlar: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Modeller `mixlayer/<model id>` olarak sunulur. CLI aynısını tek seferde yapabilir: `node src/cli.js --connect-omniroute`.
## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **Mixlayer** — [mixlayer.ai](https://mixlayer.ai) |
| 🎁 Sağlayıcının verdikleri | `qwen/qwen3.5-4b-free` üzerinde ücretsiz katman (giriş/çıkış $0, ön ödemeli kredi yok) artı 5 ücretli kimlik |
| 🔑 Bir anahtarın size kazandırdıkları | kendi hesabında bir anahtar: `https://mixlayer.ai/v1` üzerinde 6 kimlik, 120 RPM / 500k TPM |
| 🌐 API şekli | OpenAI uyumlu: `POST https://mixlayer.ai/v1/chat/completions` |
| 🔒 Verileriniz | yalnızca `mixlayer.ai` / `console.mixlayer.com` ve gelen kutusu arka ucunuzla iletişim kurulur |

## 🐞 Sorunlar

Mixlayer Clerk kayıt şeklini, konsol anahtar rotasını veya model kataloğunu değiştirirse, araç orada durur ve bunu bildirir. Komut ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 mixlayer-bulk-apikey katkıda bulunanlar

</div>