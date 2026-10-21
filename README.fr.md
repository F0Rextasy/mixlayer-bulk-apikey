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

**Création en masse de comptes Mixlayer avec clés API générées automatiquement — inférence compatible OpenAI + connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-6%20served-412991?style=for-the-badge)](https://mixlayer.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Niveau gratuit](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-6-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi cet outil existe

Mixlayer héberge un ensemble sélectionné de modèles open-source derrière une inférence compatible OpenAI, et l'un de ses identifiants est sur un **niveau gratuit** : `qwen/qwen3.5-4b-free` ne coûte rien et ne nécessite aucun crédit prépayé. Cela fait du panneau un point de terminaison texte/code à coût nul — la propre clé du compte est la seule chose à générer. L'inscription passe par **Clerk** sur `console.mixlayer.com` : e-mail + mot de passe + conditions, puis un code à 6 chiffres reçu dans la boîte de réception. Le captcha d'instance de Clerk est invisible et résolu par clerk-js *à l'intérieur de la page* (un appel d'inscription côté serveur répond `captcha_missing_token`), c'est pourquoi l'outil pilote un vrai Chrome au lieu de poster vers le point de terminaison d'enregistrement. La console révèle une clé exactement une fois et la route de la clé s'authentifie depuis sa propre page, donc le rail du navigateur est aussi ce qui génère la clé.

## 🎁 Niveau gratuit — ce que vous obtenez

| Quoi | Valeur |
| --- | --- |
| Modèle gratuit | **`qwen/qwen3.5-4b-free`** — 0 $ en entrée/sortie, **aucun crédit prépayé requis** (docs : « Les modèles gratuits ne nécessitent pas de crédit prépayé ») |
| Modèles payants | `qwen/qwen3.5-9b`, `qwen/qwen3.6-35b-a3b`, `qwen/qwen3.8-27b`, `z-ai/glm-5.3`, `deepseek/deepseek-v4.1-flash` — ceux-ci répondent `insufficient_prepaid_credits` sur un compte fraîchement créé |
| Inscription | e-mail + mot de passe + conditions, puis un code à 6 chiffres par e-mail (Clerk) ; **pas de téléphone, pas de carte** |
| Clé | une clé par organisation personnelle, créée dans la console (`inference`, `api-read`, `api-write` ; `expires_at: null`) |
| Limites de débit | **120 requêtes/min et 500 000 tokens/min** (mesurées sur chaque compte, par organisation + par modèle) |
| L'unité qui évolue | **un compte = une clé** (la clé appartient à l'organisation du compte) |

> 💡 Le niveau gratuit est défini par Mixlayer et peut changer. Consultez les chiffres en direct sur [mixlayer.ai](https://mixlayer.ai) — et laissez la propre barrière de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 6 au complet

`GET /v1/models` a renvoyé **6 identifiants** sur une clé active (2026-10-21) :

| ID du modèle | note |
| --- | --- |
| `qwen/qwen3.5-4b-free` | le niveau gratuit — chat vérifié **11/11** clés ; modèle de raisonnement, les réponses courtes placent le texte dans `reasoning_content` |
| `qwen/qwen3.5-9b` | payant (crédit prépayé requis) |
| `qwen/qwen3.6-35b-a3b` | payant |
| `qwen/qwen3.8-27b` | payant |
| `z-ai/glm-5.3` | payant, raisonnement toujours actif avec effort Low/High/Max |
| `deepseek/deepseek-v4.1-flash` | payant, réflexion optionnelle avec niveaux d'effort |

La vérification par défaut répond 200 avec du contenu ou du raisonnement :

```bash
curl https://mixlayer.ai/v1/chat/completions \
  -H "Authorization: Bearer sk_mxl_1OPE0pEo…" -H "Content-Type: application/json" \
  -d '{"model":"qwen/qwen3.5-4b-free","messages":[{"role":"user","content":"hi"}],"max_tokens":16}'
```

## 🧪 Comment utiliser l'API

URL de base **`https://mixlayer.ai/v1`** — compatible OpenAI. Les clés sont préfixées `sk_mxl_`.

Forme d'authentification : un jeton bearer sur chaque requête (`Authorization: Bearer <key>`) — le `MIXLAYER_API_KEY` des docs est exactement cette chaîne.

```python
from openai import OpenAI
c = OpenAI(base_url="https://mixlayer.ai/v1", api_key="sk_mxl_1OPE0pEo…")
print(c.chat.completions.create(model="qwen/qwen3.5-4b-free",
      messages=[{"role":"user","content":"hi"}]).choices[0].message.content)
```

Les limites de débit ne sont publiées que sous forme d'en-têtes de réponse — `x-ratelimit-limit-requests` / `-limit-tokens` (et leurs jumeaux `remaining`, plus `retry-after`). Une requête rejetée répond HTTP **429** `{"error":{"type":"rate_limit_exceeded"}}` ; attendez la fin de `retry-after`.

Un modèle payant sans crédit répond HTTP 400 `{"error":{"type":"billing_error","code":"insufficient_prepaid_credits"}}` — ne le réessayez pas avec un backoff.

## 🛠 Démarrage rapide

```bash
cd mixlayer-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen / settings
# or directly:
node src/cli.js --count 1        # one Clerk sign-up in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # test the exit list against the console + API
```

L'inscription nécessite un vrai Chrome (Clerk monte son propre captcha) ; `keys.txt` n'est écrit qu'après `GET /v1/models` + une complétion réelle, et `accounts.json` enregistre la clé au moment où la console la renvoie (ainsi un hoquet de la barrière ne peut pas la perdre).

### 🖱️ Le lanceur

Le lanceur demande la liste de proxys (facultative — sans elle, le CLI s'exécute en direct) et le nombre de comptes, les mémorise, et exécute le CLI — générer, vérifier, tester les sorties, paramètres, aide, Connecter à 9Router.

## ✅ Vérifié fonctionnel — chaque clé est testée

Toutes les vérifications ci-dessous ont été exécutées le **2026-10-21** depuis le CLI livré (sortie du pool : WARP via `socks5h://127.0.0.1:40000`).

| Vérification | Résultat |
| --- | --- |
| `--screen` (validation des sorties) | **✔ 0,9 s** — `console.mixlayer.com/sign-up` **200** + `mixlayer.ai/v1/models` joignable (**401** sans clé) |
| Inscription Clerk dans un vrai Chrome | **✔** — `/sign-up` → e-mail + mot de passe + conditions → continuer → `#/verify-email-address` → code à 6 chiffres → `/app` |
| `POST /api/cloud/organizations/<org>/api_keys` | **200** — clé renvoyée une fois (`inference`, `api-read`, `api-write`) |
| `GET /v1/models` par clé | **200**, 6 identifiants |
| `POST /v1/chat/completions` par clé avant son écriture | **200** — **11/11** clés sur `qwen/qwen3.5-4b-free` (`content \|\| reasoning_content`) |
| `--verify-only` (re-vérification indépendante des 11) | **11/11** chat-200, chacune avec `x-ratelimit-limit-requests: 120` + `-limit-tokens: 500000` |
| une clé qui échoue à sa vérification de chat | jamais écrite dans `keys.txt` — le compte reste dans `accounts.json` avec `gate: failed` |

```bash
node src/cli.js --verify-only
node src/cli.js --screen
```

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Mixlayer page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://mixlayer.ai/v1/chat/completions → real content = the key is live
```

| Étape | Appel | Notes |
| --- | --- | --- |
| validation | `GET console.mixlayer.com/sign-up` + `GET mixlayer.ai/v1/models` | une sortie qui ne peut atteindre ni l'un ni l'autre est ignorée avant toute autre chose |
| boîte mail | boîte gmail Emailnator | une boîte dont la réception n'est que le mur « Upgrade to Premium » du fournisseur est écartée et une autre est demandée |
| inscription | console `/sign-up` dans un vrai Chrome | e-mail + mot de passe + conditions ; le captcha invisible de Clerk est résolu par clerk-js dans la page |
| code | code à 6 chiffres depuis la boîte de réception, saisi dans la page | **l'expéditeur est la barrière** (`mixlayer`/`clerk`) : la boîte est recyclée et ses ids de message changent entre les appels, donc un code à 6 chiffres parasite ne peut jamais être saisi |
| compte | `/api/cloud/user` (fetch dans la page) | l'id de l'organisation personnelle |
| clé | `POST /api/cloud/organizations/<org>/api_keys` | enregistrée dans `accounts.json` immédiatement — la console ne la révèle qu'une fois |
| preuve | `GET /v1/models` + une complétion réelle | `keys.txt` n'accepte la clé qu'au chat 200 |

## ⚙️ Options du CLI

```bash
node src/cli.js --count N        # mint N keys (one Clerk sign-up each)
node src/cli.js --model qwen/qwen3.5-4b-free
node src/cli.js --verify-only    # re-verify every key in keys.txt
node src/cli.js --screen         # exit pool self-test
node src/cli.js --connect-9router
node src/cli.js --help
```

| Option | Défaut | Signification |
| --- | --- | --- |
| `--count N` | `1` | comptes à générer, en série |
| `--model <id>` | `qwen/qwen3.5-4b-free` | modèle utilisé pour la barrière en direct |
| `--pool <file>` | `proxies.txt` | pool de sorties, une ligne par proxy — facultatif |
| `--tries N` | `3` | candidats de sortie validés par compte |
| `--mint-tries N` | `3` | tentatives d'inscription complètes par sortie (nouvelle boîte mail à chaque fois) |
| `--gap MS` | `4000` | pause entre les comptes |
| `--code-timeout S` | `300` | secondes d'attente du code e-mail, par tentative de boîte mail |
| `--key-name <s>` | `mixlayer-1` | nom donné à la clé créée |
| `--keys <file>` | `keys.txt` | fichier de clés pour `--verify-only` / `--connect-9router` |
| `--headless` | désactivé | exécuter Chrome en mode headless (Chrome visible est le rail testé) |
| `--browser <exe>` | auto | binaire Chrome (env `CHROME_PATH`) |
| `--debug-port N` | auto | port Chrome DevTools (un port libre non nul par défaut) |

| Env | Défaut | Signification |
| --- | --- | --- |
| `MIXLAYER_PROXIES` | `proxies.txt` | pool de sorties, une ligne par proxy — facultatif : sans pool, le CLI se connecte directement |
| `MIXLAYER_MODEL` | `qwen/qwen3.5-4b-free` | modèle pour la vérification en direct |
| `CHROME_PATH` | auto | binaire Chrome pour le rail navigateur |

## 🛰️ Derrière un proxy

**Facultatif — recommandé à grande échelle (limites par IP, bannissements).** L'outil fonctionne aussi sans proxy.

- **Avec un pool :** passez `--pool <file>` (ou définissez `MIXLAYER_PROXIES`) et chaque requête — le navigateur Chrome inclus — passe par une sortie de cette liste, en échec fermé : chaque candidat est d'abord validé (`console.mixlayer.com/sign-up` 200 + l'hôte de l'API joignable) et l'exécution reste ensuite épinglée à cette sortie. Une ligne morte fait échouer sa tentative et le CLI passe au candidat suivant.
- **Sans pool :** le CLI affiche `running WITHOUT a proxy (direct)` et se connecte directement. Rien ne change concernant l'inscription, la génération de clé ou la vérification — seul le point de départ des paquets change.
- Lancez `--screen` dans l'un ou l'autre mode : il teste les sorties dont vous disposez (ou la route directe) contre la console et l'API avant une exécution réelle.
- Chrome ne peut pas s'authentifier auprès d'un proxy SOCKS5, donc les lignes `socks5://user:pass@host:port` sont écartées du rail navigateur (échec fermé, jamais silencieusement en direct).

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | une clé vérifiée en direct par ligne — ignoré par git |
| `accounts.json` | e-mail / org / mot de passe / clé + `gate` — écrit au moment où la clé existe |
| `proxies.txt` | vos sorties — ignoré par git |
| `out/` | journaux d'exécution, captures d'écran d'échec, registre `attempts.jsonl` — ignoré par git |

## 🔌 Connecter à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé, compatible OpenAI :

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Défauts : `--prefix mixlayer`, `--base-url https://mixlayer.ai/v1`, `--model qwen/qwen3.5-4b-free`. Les modèles sont servis sous `mixlayer/<model id>`. Le CLI peut faire la même chose en une seule fois : `node src/cli.js --connect-9router`.

## 🔑 Ce qu'une clé vous apporte

| | |
| --- | --- |
| 🏢 Fournisseur | **Mixlayer** — [mixlayer.ai](https://mixlayer.ai) |
| 🎁 Ce que le fournisseur offre | un niveau gratuit sur `qwen/qwen3.5-4b-free` (0 $ en entrée/sortie, sans crédit prépayé) plus 5 identifiants payants |
| 🔑 Ce qu'une clé vous apporte | une clé sur son propre compte : les 6 identifiants sur `https://mixlayer.ai/v1`, 120 RPM / 500k TPM |
| 🌐 Forme de l'API | compatible OpenAI : `POST https://mixlayer.ai/v1/chat/completions` |
| 🔒 Vos données | seuls `mixlayer.ai` / `console.mixlayer.com` et votre backend de boîte mail sont contactés |

## 🐞 Problèmes

Si Mixlayer modifie la forme de son inscription Clerk, la route de clé de la console ou le catalogue de modèles, l'outil s'arrête là et le signale. **[Ouvrez un ticket](../../issues)** avec la commande et la sortie exacte.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 mixlayer-bulk-apikey contributors

</div>