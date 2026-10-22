# DesiTease — Premium Store

Static storefront for **desitease.netlify.app**. No build step, no framework, no
runtime dependencies: plain HTML, CSS and JavaScript, deployed straight from
this repo to Netlify.

```
index.html            catalogue + checkout markup
style.css             design system
script.js             pricing engine, cart, payments
success.html          order confirmation
success-style.css
success-script.js
netlify.toml          build + minification config
_headers              cache + security headers
robots.txt sitemap.xml site.webmanifest favicon.svg
assets/packs/*.webp   generated pack cover art
assets/bg/*.webp      hero / footer backdrops
assets/brand/         UPI QR, OG card
tools/                asset generators (python)
```

---

## 1. Editing the catalogue

**The markup is the single source of truth.** `script.js` reads prices, names,
vaults and specs straight out of the DOM, so a pack only ever needs to be
added in one place.

To add a pack:

1. Copy an existing `<article class="pack">` block in `index.html`.
2. Update `data-id`, `data-price`, `data-old`, `data-blurb`, `data-specs`.
3. Drop it in the right `<div class="grid">` (one per vault).
4. Add a matching cover at `assets/packs/<data-id>.webp` (800×800 WebP).

Bundle prices, the mega-bundle price, the savings line and the PayPal/crypto
amounts all recalculate automatically — there is nothing else to touch.

### Pack attributes

| Attribute | Meaning | Example |
|---|---|---|
| `data-id` | unique key, also the cover filename | `aivideo` |
| `data-price` | INR price | `209` |
| `data-old` | struck-through "was" price | `299` |
| `data-blurb` | long description shown in the detail dialog | … |
| `data-specs` | spec tiles, `LABEL:value;LABEL:value` | `RESOLUTION:1080p / 4K;ACCESS:Lifetime` |
| `data-badge` | optional ribbon on the cover | `New` |

### Vaults

Vaults are `<section class="vault" data-vault="key">` blocks. Add a fourth by
copying a section and giving it a new key, then adding the key to
`VAULT_LABELS` in `script.js`.

Discounts live in `CONFIG` (`vaultDiscount`, `megaDiscount`).

---

## 2. Business configuration

All the money settings live in one block at the top of `script.js`:

```js
const CONFIG = {
  fxInrPerUsd: 91.68,   // fallback rupees per US dollar
  paypalMarkup: 1.20,   // +20% on the PayPal amount
  cryptoMarkup: 1.20,   // +20% on the crypto amount
  paypalHandle: 'desitease',
  addr: { usdtTron: 'TLqu…', bsc: '0x68cb…', btc: '114wb…' },
  vaultDiscount: 0.20,
  megaDiscount:  0.30,
  fallbackRates: { tether: 91.7, bitcoin: 9200000, ethereum: 320000, binancecoin: 61000 },
  …
};
```

### How the PayPal / crypto markup works

`₹ total → × markup → ÷ FX rate → USD` for PayPal, and
`₹ total → × markup → ÷ coin price in INR → coin units` for crypto.

So a ₹1,082 mega vault bills as **$14.16** on PayPal, **14.16 USDT**,
**0.00014113 BTC** and **0.004057 ETH**.

### Exchange rates

Rates come from **CoinGecko** (`/simple/price?ids=…&vs_currencies=inr`) with a
**Coinbase** fallback (`/v2/exchange-rates?currency=INR`), cached in
`sessionStorage` for 10 minutes. If both fail, `CONFIG.fallbackRates` is used
and the crypto panel shows an amber "amounts are indicative" warning.

> The `fallbackRates` values are placeholders — refresh them if the shop is
> likely to run with no network, otherwise the live feed always wins.

---

## 3. Payments

| Method | How it works |
|---|---|
| **UPI** | Static merchant QR (`assets/brand/upi-qr.*`) with the exact INR amount shown next to it. |
| **PayPal** | Opens `paypal.me/desitease/<amount>USD/<description>` in a new tab. |
| **Crypto** | Ten networks; each shows the exact coin amount for the current order, plus copy-address and copy-amount+address buttons. |

Orders are captured by a **Netlify form** (`desi-orders`) that asks for a
Telegram username and a payment screenshot, then redirects to
`success.html` — which builds a pre-filled Telegram deep link for the buyer.

---

## 4. Assets

All artwork is generated, so it can be rebuilt at any time:

```bash
python tools/make-assets.py   # pack covers + backdrops
python tools/make-qr.py       # re-render the UPI QR with a quiet zone
python tools/make-brand.py    # PWA icons + Open Graph card
```

`tools/source/` keeps the original backdrop art and the original QR payload so
the generators are reproducible. It is excluded from the deploy.

---

## 5. Deploying

The repo is the site. Connect it to Netlify with:

| Setting | Value |
|---|---|
| Build command | *(empty)* |
| Publish directory | `.` |
| Branch | `main` |

`netlify.toml` enables Netlify's HTML/CSS/JS minification. `_headers` adds
long-lived caching for `/assets` and images, `no-store`-style revalidation for
the app shell, and a Content-Security-Policy.

> **CSP note** — if you add a third-party script (analytics, a chat widget),
> add its origin to `script-src` / `connect-src` in `_headers`, otherwise the
> browser will block it.

---

## 6. House rules

* 18+ only. The age gate is stored in `localStorage` under `dt-age-verified`.
* The store lists original, licensed and AI-synthetic material featuring
  consenting adults aged 18 and over. Do not add packs of leaked, covertly
  recorded or non-consensual material, and do not add packs containing
  anything that depicts a minor or a childlike character.
* Every performer must be a consenting adult, and the licence for the
  material must be written down somewhere you can produce it on request.
