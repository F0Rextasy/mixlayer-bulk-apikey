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

**Crie contas Mixlayer em massa com chaves de API geradas automaticamente — inferência compatível com OpenAI + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-6%20served-412991?style=for-the-badge)](https://mixlayer.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Camada gratuita](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-6-of-them) · [🧪 Use a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isto existe

A Mixlayer hospeda um conjunto selecionado de modelos de código aberto por trás de uma inferência compatível com OpenAI, e um de seus ids está em uma **camada gratuita**: `qwen/qwen3.5-4b-free` não custa nada e não exige crédito pré-pago. Isso torna o painel um endpoint de texto/código de custo zero — a própria chave da conta é a única coisa a ser criada. O cadastro passa pelo **Clerk** em `console.mixlayer.com`: e-mail + senha + termos, depois um código de 6 dígitos da caixa de entrada. O captcha da instância do Clerk é invisível e resolvido pelo clerk-js *dentro da página* (uma chamada de cadastro do lado do servidor responde `captcha_missing_token`), e é por isso que a ferramenta controla um Chrome real em vez de fazer POST no endpoint de registro. O console revela uma chave exatamente uma vez e a rota da chave se autentica a partir de sua própria página, então o trilho do navegador também é o que cria a chave.

## 🎁 Camada gratuita — quanto você recebe

| O quê | Valor |
| --- | --- |
| Modelo gratuito | **`qwen/qwen3.5-4b-free`** — $0 entrada/saída, **não exige crédito pré-pago** (docs: “Free models do not require prepaid credit”) |
| Modelos pagos | `qwen/qwen3.5-9b`, `qwen/qwen3.6-35b-a3b`, `qwen/qwen3.8-27b`, `z-ai/glm-5.3`, `deepseek/deepseek-v4.1-flash` — estes respondem `insufficient_prepaid_credits` em uma conta nova |
| Cadastro | e-mail + senha + termos, depois um código de 6 dígitos por e-mail (Clerk); **sem telefone, sem cartão** |
| Chave | uma chave por organização pessoal, criada no console (`inference`, `api-read`, `api-write`; `expires_at: null`) |
| Limites de taxa | **120 requisições/min e 500.000 tokens/min** (medidos em cada conta, por organização + por modelo) |
| A unidade que escala | **uma conta = uma chave** (a chave pertence à organização da conta) |

> 💡 A camada gratuita é definida pela Mixlayer e pode mudar. Confira os números ao vivo em [mixlayer.ai](https://mixlayer.ai) — e deixe o próprio portão da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 6

`GET /v1/models` retornou **6 ids** em uma chave ativa (2026-10-21):

| ID do modelo | observação |
| --- | --- |
| `qwen/qwen3.5-4b-free` | a camada gratuita — chaves verificadas por chat **11/11**; modelo de raciocínio, respostas curtas colocam o texto em `reasoning_content` |
| `qwen/qwen3.5-9b` | pago (exige crédito pré-pago) |
| `qwen/qwen3.6-35b-a3b` | pago |
| `qwen/qwen3.8-27b` | pago |
| `z-ai/glm-5.3` | pago, raciocínio sempre ativo com esforço Low/High/Max |
| `deepseek/deepseek-v4.1-flash` | pago, pensamento opcional com níveis de esforço |

A verificação padrão responde 200 com conteúdo ou raciocínio:

```bash
curl https://mixlayer.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-4b-free","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🧪 Como usar a API

URL base **`https://mixlayer.ai/v1`** — compatível com OpenAI. As chaves têm o prefixo `sk_mxl_`.

Forma de autenticação: um token bearer em cada requisição (`Authorization: Bearer <key>`) — o próprio `MIXLAYER_API_KEY` dos docs é exatamente essa string.

```python
from openai import OpenAI
c = OpenAI(base_url="https://mixlayer.ai/v1", api_key="YOUR_KEY")
print(c.chat.completions.create(model="qwen/qwen3.5-4b-free",
      messages=[{"role":"user","content":"hi"}]).choices[0].message.content)
```

Os limites de taxa são publicados apenas como cabeçalhos de resposta — `x-ratelimit-limit-requests` / `-limit-tokens` (e os gêmeos `remaining`, além de `retry-after`). Uma requisição rejeitada responde HTTP **429** `{"error":{"type":"rate_limit_exceeded"}}`; aguarde o `retry-after`.

Um modelo pago sem crédito responde HTTP 400 `{"error":{"type":"billing_error","code":"insufficient_prepaid_credits"}}` — não tente novamente com backoff.

## 🛠 Início rápido

```bash
cd mixlayer-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings
# or directly:
node src/cli.js --count 1        # one Clerk sign-up in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # test the exit list against the console + API
```

O cadastro precisa de um Chrome real (o Clerk monta seu próprio captcha); `keys.txt` só é escrito após `GET /v1/models` + uma conclusão real, e `accounts.json` registra a chave no momento em que o console a retorna (assim um tropeço no portão não pode perdê-la).

### 🖱️ O launcher

O launcher pede a lista de proxies (opcional — sem uma, o CLI roda direto) e a contagem de contas, memoriza ambos e executa o CLI — criar, verificar, testar saídas, configurações, ajuda, Connect to 9Router.

## ✅ Verificado e funcionando — toda chave é testada

Todas as verificações abaixo rodaram em **2026-10-21** a partir do CLI fornecido (saída do pool: proxy sobre `socks5h://127.0.0.1:40000`).

| Verificação | Resultado |
| --- | --- |
| `--screen` (validação de saída) | **✔ 0,9 s** — `console.mixlayer.com/sign-up` **200** + `mixlayer.ai/v1/models` acessível (**401** sem chave) |
| Cadastro no Clerk em Chrome real | **✔** — `/sign-up` → e-mail + senha + termos → continuar → `#/verify-email-address` → código de 6 dígitos → `/app` |
| `POST /api/cloud/organizations/<org>/api_keys` | **200** — chave retornada uma vez (`inference`, `api-read`, `api-write`) |
| `GET /v1/models` por chave | **200**, 6 ids |
| `POST /v1/chat/completions` por chave antes de ser escrita | **200** — **11/11** chaves em `qwen/qwen3.5-4b-free` (`content \|\| reasoning_content`) |
| `--verify-only` (reverificação independente de todas as 11) | **11/11** chat-200, cada uma com `x-ratelimit-limit-requests: 120` + `-limit-tokens: 500000` |
| uma chave que falha na verificação de chat | nunca escrita em `keys.txt` — a conta permanece em `accounts.json` com `gate: failed` |

```bash
node src/cli.js --verify-only
node src/cli.js --screen
```

## 🧭 Como funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Mixlayer page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://mixlayer.ai/v1/chat/completions → real content = the key is live
```

| Etapa | Chamada | Observações |
| --- | --- | --- |
| validação | `GET console.mixlayer.com/sign-up` + `GET mixlayer.ai/v1/models` | uma saída que não alcança nenhum dos dois é descartada antes de qualquer outra coisa |
| caixa de correio | caixa gmail do Emailnator | uma caixa cuja entrada é apenas o muro “Upgrade to Premium” do provedor é descartada e outra é solicitada |
| cadastro | console `/sign-up` em Chrome real | e-mail + senha + termos; o captcha invisível do Clerk é resolvido pelo clerk-js na página |
| código | código de 6 dígitos da caixa de entrada, digitado na página | **o remetente é o portão** (`mixlayer`/`clerk`): a caixa é reciclada e seus ids de mensagem giram entre chamadas, então um código de 6 dígitos perdido nunca pode ser digitado |
| conta | `/api/cloud/user` (fetch na página) | o id da organização pessoal |
| chave | `POST /api/cloud/organizations/<org>/api_keys` | registrada em `accounts.json` imediatamente — o console a revela uma vez |
| prova | `GET /v1/models` + uma conclusão real | `keys.txt` só recebe a chave no chat 200 |

## ⚙️ Opções do CLI

```bash
node src/cli.js --count N        # mint N keys (one Clerk sign-up each)
node src/cli.js --model qwen/qwen3.5-4b-free
node src/cli.js --verify-only    # re-verify every key in keys.txt
node src/cli.js --screen         # exit pool self-test
node src/cli.js --connect-9router
node src/cli.js --help
```

| Flag | Padrão | Significado |
| --- | --- | --- |
| `--count N` | `1` | contas a criar, em série |
| `--model <id>` | `qwen/qwen3.5-4b-free` | modelo usado para o portão ao vivo |
| `--pool <file>` | `proxies.txt` | pool de saídas, uma linha por proxy — opcional |
| `--tries N` | `3` | candidatos de saída avaliados por conta |
| `--mint-tries N` | `3` | tentativas completas de cadastro por saída (nova caixa de correio a cada uma) |
| `--gap MS` | `4000` | pausa entre contas |
| `--code-timeout S` | `300` | segundos para esperar o código por e-mail, por tentativa de caixa de correio |
| `--key-name <s>` | `mixlayer-1` | nome dado à chave criada |
| `--keys <file>` | `keys.txt` | arquivo de chaves para `--verify-only` / `--connect-9router` |
| `--headless` | desligado | executar o Chrome em modo headless (o Chrome visível é o trilho testado) |
| `--browser <exe>` | automático | binário do Chrome (env `CHROME_PATH`) |
| `--debug-port N` | automático | porta do Chrome DevTools (uma porta livre diferente de zero por padrão) |

| Env | Padrão | Significado |
| --- | --- | --- |
| `MIXLAYER_PROXIES` | `proxies.txt` | pool de saídas, uma linha por proxy — opcional: sem um pool o CLI se conecta diretamente |
| `MIXLAYER_MODEL` | `qwen/qwen3.5-4b-free` | modelo para a verificação ao vivo |
| `CHROME_PATH` | automático | binário do Chrome para o trilho do navegador |

## 🛰️ Atrás de um proxy

**Opcional — recomendado em escala (limites por IP, banimentos).** A ferramenta funciona sem proxy também.

- **Com um pool:** passe `--pool <file>` (ou defina `MIXLAYER_PROXIES`) e toda requisição — incluindo o navegador Chrome — passa por uma saída dessa lista, fail-closed: cada candidato é avaliado primeiro (`console.mixlayer.com/sign-up` 200 + o host da API acessível) e a execução então permanece fixada nessa saída. Uma linha morta falha sua tentativa e o CLI passa para o próximo candidato.
- **Sem um pool:** o CLI imprime `running WITHOUT a proxy (direct)` e se conecta diretamente. Nada sobre cadastro, criação de chave ou verificação muda — apenas de onde os pacotes saem.
- Execute `--screen` em qualquer um dos modos: ele testa as saídas que você tem (ou a rota direta) contra o console e a API antes de uma execução real.
- O Chrome não consegue se autenticar em um proxy SOCKS5, então linhas `socks5://user:pass@host:port` são descartadas do trilho do navegador (fail-closed, nunca silenciosamente direto).

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `keys.txt` | uma chave verificada ao vivo por linha — ignorado pelo git |
| `accounts.json` | e-mail / organização / senha / chave + `gate` — escrito no momento em que a chave existe |
| `proxies.txt` | suas saídas — ignorado pelo git |
| `out/` | logs de execução, capturas de tela de falhas, registro `attempts.jsonl` — ignorado pelo git |

## 🔌 Conectar ao 9Router

[9Router](https://9router.com) é um roteador auto-hospedado e compatível com OpenAI:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Padrões: `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Os modelos são servidos como `mixlayer/<model id>`. O CLI pode fazer o mesmo em um único comando: `node src/cli.js --connect-9router`.

## 🔑 O que uma chave lhe dá

| | |
| --- | --- |
| 🏢 Provedor | **Mixlayer** — [mixlayer.ai](https://mixlayer.ai) |
| 🎁 O que o provedor oferece | uma camada gratuita em `qwen/qwen3.5-4b-free` ($0 entrada/saída, sem crédito pré-pago) mais 5 ids pagos |
| 🔑 O que uma chave lhe dá | uma chave em sua própria conta: os 6 ids em `https://mixlayer.ai/v1`, 120 RPM / 500k TPM |
| 🌐 Forma da API | compatível com OpenAI: `POST https://mixlayer.ai/v1/chat/completions` |
| 🔒 Seus dados | apenas `mixlayer.ai` / `console.mixlayer.com` e seu backend de caixa de entrada são contatados |

## 🐞 Problemas

Se a Mixlayer mudar a forma do cadastro no Clerk, a rota da chave no console ou o catálogo de modelos, a ferramenta para ali e avisa. **[Abra uma issue](../../issues)** com o comando e a saída exata.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 mixlayer-bulk-apikey contributors

</div>