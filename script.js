/* =========================================================
   DesiTease — store front
   Single source of truth = the catalogue markup in index.html.
   The script reads prices/specs out of the DOM, so adding a pack
   means editing one file and nothing else.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     1. Configuration — tune the business numbers here
     --------------------------------------------------------- */
  const CONFIG = {
    // rupees per 1 US dollar (used for the PayPal + crypto conversion)
    fxInrPerUsd: 91.68,
    // true  = follow the live USDT/INR rate (fairer, the amount moves hourly)
    // false = pin every order to fxInrPerUsd above (predictable for support)
    useLiveFx: true,

    // international / on-chain processing margin applied to the INR total
    paypalMarkup: 1.20,   // +20%
    cryptoMarkup: 1.20,   // +20%

    paypalHandle: 'desitease',

    // wallets
    addr: {
      usdtTron: 'TLquccw7uU4A6fTJekDsrsQbJEvnFv1eTD',
      bsc:      '0x68cb68cfea2aacf2bec6a5f4c70cd4eb56155c15',
      btc:      '114wbEsmXGo9tExmg2HKEZqPXYsAB9S4ei'
    },

    // bundle discounts
    vaultDiscount: 0.20,
    megaDiscount:  0.30,

    // live rates (INR per coin) — fallback only, the API below wins
    fallbackRates: { tether: 91.7, bitcoin: 9200000, ethereum: 320000, binancecoin: 61000 },
    rateEndpoint: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin&vs_currencies=inr',
    rateFallbackEndpoint: 'https://api.coinbase.com/v2/exchange-rates?currency=INR',
    rateTtlMs: 10 * 60 * 1000,

    ageKey: 'dt-age-verified',
    orderKey: 'dt-order'
  };

  const COINS = [
    { key: 'usdt-trc20', mark: '₮', name: 'USDT (Tether)', net: 'TRC20 · Tron',      addr: CONFIG.addr.usdtTron, coin: 'tether',      tag: 'Best', tagClass: 'ok' },
    { key: 'usdt-bep20', mark: '₮', name: 'USDT (Tether)', net: 'BEP20 · BSC',       addr: CONFIG.addr.bsc,      coin: 'tether',      tag: 'Cheap', tagClass: 'warn' },
    { key: 'usdt-erc20', mark: '₮', name: 'USDT (Tether)', net: 'ERC20 · Ethereum',  addr: CONFIG.addr.bsc,      coin: 'tether' },
    { key: 'usdt-matic', mark: '₮', name: 'USDT (Tether)', net: 'Polygon · MATIC',   addr: CONFIG.addr.bsc,      coin: 'tether',      tag: 'Cheap', tagClass: 'warn' },
    { key: 'btc',        mark: '₿', name: 'Bitcoin',        net: 'Main network',      addr: CONFIG.addr.btc,      coin: 'bitcoin',     tag: 'Popular', tagClass: 'hot' },
    { key: 'btc-bsc',    mark: '₿', name: 'Bitcoin',        net: 'Wrapped · BSC',     addr: CONFIG.addr.bsc,      coin: 'bitcoin',     tag: 'Cheap', tagClass: 'warn' },
    { key: 'eth',        mark: 'Ξ', name: 'Ethereum',       net: 'ERC20 · Mainnet',   addr: CONFIG.addr.bsc,      coin: 'ethereum',    tag: 'Popular', tagClass: 'hot' },
    { key: 'eth-arb',    mark: 'Ξ', name: 'Ethereum',       net: 'Arbitrum · L2',     addr: CONFIG.addr.bsc,      coin: 'ethereum',    tag: 'Cheap', tagClass: 'warn' },
    { key: 'eth-bsc',    mark: 'Ξ', name: 'Ethereum',       net: 'Wrapped · BSC',     addr: CONFIG.addr.bsc,      coin: 'ethereum',    tag: 'Cheap', tagClass: 'warn' },
    { key: 'bnb',        mark: 'B', name: 'BNB',            net: 'BEP20 · BSC',       addr: CONFIG.addr.bsc,      coin: 'binancecoin', tag: 'Fast', tagClass: 'ok' }
  ];

  const COIN_PRECISION = { bitcoin: 8, ethereum: 6, tether: 2, binancecoin: 4 };

  /* ---------------------------------------------------------
     2. Small helpers
     --------------------------------------------------------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const money = n => '₹' + inr.format(Math.round(n));
  const usd = n => '$' + n.toFixed(2);

  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }
  }

  /* ---------------------------------------------------------
     3. Read the catalogue out of the DOM
     --------------------------------------------------------- */
  const VAULT_LABELS = {
    top:     'Top Picks',
    premium: 'Premium Vault',
    series:  'Signature Series'
  };

  function parseSpecs(raw) {
    if (!raw) return [];
    return raw.split(';')
      .map(s => s.trim())
      .filter(Boolean)
      .map(pair => {
        const i = pair.indexOf(':');
        return i < 0 ? { label: pair, value: '' } : { label: pair.slice(0, i).trim(), value: pair.slice(i + 1).trim() };
      });
  }

  const packs = $$('.pack').map(el => ({
    id:    el.dataset.id,
    price: Number(el.dataset.price),
    old:   Number(el.dataset.old),
    vault: el.closest('.vault').dataset.vault,
    name:  $('.pack__name', el).textContent.trim(),
    desc:  $('.pack__desc', el).textContent.trim(),
    blurb: el.dataset.blurb || '',
    specs: parseSpecs(el.dataset.specs),
    type:  $('.pack__type', el).textContent.trim(),
    el
  }));

  const packById = new Map(packs.map(p => [p.id, p]));

  const vaults = $$('.vault').map(el => {
    const key = el.dataset.vault;
    const own = packs.filter(p => p.vault === key);
    const subtotal = own.reduce((s, p) => s + p.price, 0);
    return {
      key,
      label: VAULT_LABELS[key] || key,
      packs: own,
      subtotal,
      price: Math.round(subtotal * (1 - CONFIG.vaultDiscount))
    };
  });

  const allSubtotal = packs.reduce((s, p) => s + p.price, 0);
  const mega = {
    price: Math.round(allSubtotal * (1 - CONFIG.megaDiscount)),
    was: allSubtotal,
    count: packs.length
  };

  /* ---------------------------------------------------------
     4. State
     --------------------------------------------------------- */
  const state = {
    cart: new Set(),
    rates: { ...CONFIG.fallbackRates },
    ratesLive: false,
    rateTime: null,
    // rupees per 1 USD — tracks the live USDT rate when available so the
    // PayPal amount and the crypto amounts always agree with each other
    fx: CONFIG.fxInrPerUsd,
    detailId: null
  };

  /* ---------------------------------------------------------
     5. Pricing engine (pure)
     --------------------------------------------------------- */
  function vaultBundlePrice(vault) {
    return vault.price;
  }

  /** Total INR for the current cart, applying vault + mega discounts. */
  function cartTotal(ids = state.cart) {
    if (ids.size === 0) return 0;
    if (ids.size === packs.length) return mega.price;

    let total = 0;
    for (const v of vaults) {
      const idsIn = v.packs.map(p => p.id);
      const all = idsIn.every(id => ids.has(id));
      if (all) {
        total += vaultBundlePrice(v);
      } else {
        for (const id of idsIn) if (ids.has(id)) total += packById.get(id).price;
      }
    }
    return total;
  }

  /** Break the cart down into display lines. */
  function cartLines() {
    const lines = [];
    let saved = 0;

    if (state.cart.size === packs.length) {
      saved = mega.was - mega.price;
      return { mega: true, lines: [{ name: `Full Vault — all ${mega.count} packs`, price: mega.price }], saved };
    }

    for (const v of vaults) {
      const ids = v.packs.map(p => p.id);
      const inVault = ids.filter(id => state.cart.has(id));
      if (!inVault.length) continue;

      if (inVault.length === ids.length) {
        lines.push({ name: `${v.label} bundle (${ids.length} packs)`, price: v.price, vault: v.key });
        saved += v.subtotal - v.price;
      } else {
        for (const id of inVault) {
          const p = packById.get(id);
          lines.push({ name: p.name, price: p.price, id });
        }
      }
    }
    return { mega: false, lines, saved };
  }

  /* ---------------------------------------------------------
     6. Rendering
     --------------------------------------------------------- */
  function renderBundleLabels() {
    for (const v of vaults) {
      const label = $(`[data-bundle-label="${v.key}"]`);
      if (!label) continue;
      const pct = Math.round(CONFIG.vaultDiscount * 100);
      const already = v.packs.every(p => state.cart.has(p.id));
      label.textContent = already
        ? `Remove ${v.label} · ₹${v.price}`
        : `Save ${pct}% · Bundle ${money(v.price)}`;
    }
  }

  function renderMega() {
    const now = $('[data-mega-price]');
    const was = $('[data-mega-was]');
    const save = $('[data-mega-save]');
    if (now) now.textContent = money(mega.price);
    if (was) was.textContent = money(mega.was);
    if (save) save.textContent = `You keep ${money(mega.was - mega.price)} in your pocket`;

    const list = $('[data-mega-list]');
    if (list) {
      list.innerHTML = packs.map(p => `
        <li>
          <svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>
          <span>${escapeHtml(p.name)}</span>
          <b>${money(p.price)}</b>
        </li>`).join('');
    }
  }

  function renderStats() {
    const el = $('[data-stat="packs"]');
    if (el) el.textContent = String(packs.length);
  }

  /** data-badge="New" on a card adds the corner ribbon if it isn't there yet. */
  function renderBadges() {
    packs.forEach(p => {
      const badge = p.el.dataset.badge;
      if (!badge || p.el.querySelector('.pack__flag')) return;
      const flag = document.createElement('span');
      flag.className = 'pack__flag';
      flag.setAttribute('aria-hidden', 'true');
      flag.textContent = badge;
      $('.pack__media', p.el).appendChild(flag);
    });
  }

  function renderCart() {
    const total = cartTotal();
    const n = state.cart.size;

    $$('.pack').forEach(card => {
      const on = state.cart.has(card.dataset.id);
      card.classList.toggle('is-added', on);
      const btn = $('.add', card);
      if (btn) {
        btn.innerHTML = on
          ? '<svg class="ico" aria-hidden="true"><use href="#i-check"/></svg><span>Added</span>'
          : '<svg class="ico" aria-hidden="true"><use href="#i-cart"/></svg><span>Add</span>';
        btn.setAttribute('aria-pressed', String(on));
      }
    });

    const bar = $('#cartBar');
    if (bar) bar.hidden = n === 0;
    const c = $('#cartBarCount');
    if (c) c.textContent = `${n} item${n === 1 ? '' : 's'}`;
    const t = $('#cartBarTotal');
    if (t) t.textContent = money(total);

    const badge = $('#topCartCount');
    if (badge) {
      badge.hidden = n === 0;
      badge.textContent = n ? String(n) : '';
    }

    const cartBtn = $('#topCartBtn');
    if (cartBtn) {
      cartBtn.setAttribute('aria-label',
        n ? `Open cart, ${n} item${n === 1 ? '' : 's'}, ${money(total)}` : 'Open cart');
    }

    renderBundleLabels();
    renderCheckout();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------------------------------------------------------
     7. Pack detail dialog
     --------------------------------------------------------- */
  const detailDialog = $('#detailDialog');

  function openDetail(id) {
    const p = packById.get(id);
    if (!p) return;
    state.detailId = id;

    $('#detailTitle').textContent = p.name;
    const img = $('#detailImg');
    img.src = $('img', p.el).getAttribute('src');
    img.alt = `${p.name} cover`;
    $('#detailDesc').textContent = p.blurb || p.desc;
    $('#detailWas').textContent = money(p.old);
    $('#detailNow').textContent = money(p.price);

    $('#detailSpecs').innerHTML = p.specs.map(s => `
      <div><dt>${escapeHtml(s.label)}</dt><dd>${escapeHtml(s.value)}</dd></div>`).join('');

    const btn = $('#detailAdd');
    const on = state.cart.has(id);
    btn.textContent = on ? 'Remove from cart' : 'Add to cart';
    btn.dataset.add = id;

    if (!detailDialog.open) {
      detailDialog._opener = document.activeElement;
      detailDialog.showModal();
    }
  }

  /* ---------------------------------------------------------
     8. Checkout dialog
     --------------------------------------------------------- */
  const checkoutDialog = $('#checkoutDialog');
  let activeCoin = COINS[0];

  function openCheckout() {
    if (state.cart.size === 0) { toast('Your cart is empty'); return; }
    renderCheckout();
    if (!checkoutDialog.open) {
      checkoutDialog._opener = document.activeElement;
      checkoutDialog.showModal();
    }
  }

  function renderCheckout() {
    const { mega: isMega, lines, saved } = cartLines();
    const total = cartTotal();

    $('#orderSummary').innerHTML =
      lines.map(l => `
        <div class="summary__row">
          <span>${escapeHtml(l.name)}</span>
          <span>${money(l.price)}${l.id ? `<button class="summary__rm" type="button" data-remove="${l.id}" aria-label="Remove ${escapeHtml(l.name)}">&times;</button>` : ''}</span>
        </div>`).join('') +
      (saved > 0 ? `<span class="summary__tag">You saved ${money(saved)}${isMega ? ' on the full vault' : ''}</span>` : '');

    const totalEl = $('#coTotal');
    if (totalEl) totalEl.textContent = money(total);

    $('#upiAmount').textContent = money(total);
    const intentBtn = $('#upiIntentBtn');
    if (intentBtn) {
      intentBtn.href = `upi://pay?pa=desitease@fam&pn=DesiTease&am=${total}&cu=INR&tn=Order%20${encodeURIComponent(Array.from(state.cart).join('+'))}`;
    }
    $('#paypalInr').textContent = money(total);
    $('#paypalUsd').textContent = usd(paypalUsd(total));
    const pn = $('#paypalNote');
    if (pn) {
      pn.textContent = state.ratesLive
        ? `includes ${Math.round((CONFIG.paypalMarkup - 1) * 100)}% international processing · live rate`
        : `includes ${Math.round((CONFIG.paypalMarkup - 1) * 100)}% international processing · rate is indicative`;
    }

    const items = $('#formItems');
    const amount = $('#formAmount');
    if (items) items.value = Array.from(state.cart).join(',');
    if (amount) amount.value = String(total);

    renderCrypto(total);
  }

  function paypalUsd(totalInr) {
    return (totalInr * CONFIG.paypalMarkup) / state.fx;
  }

  function cryptoAmount(totalInr, coin) {
    const rate = state.rates[coin.coin];
    if (!rate) return null;
    return (totalInr * CONFIG.cryptoMarkup) / rate;
  }

  function fmtCrypto(v, coin) {
    if (v == null) return '—';
    const p = COIN_PRECISION[coin.coin] ?? 6;
    return v.toFixed(p);
  }

  function renderCrypto(total) {
    const list = $('#cryptoList');
    if (!list) return;
    const usdEq = (total * CONFIG.cryptoMarkup) / state.fx;

    const warn = state.ratesLive ? '' :
      '<p class="crypto__warn">Live rate unavailable — the amounts below are indicative. Confirm with support before sending.</p>';

    list.innerHTML = warn + COINS.map(c => {
      const amt = cryptoAmount(total, c);
      return `
        <div class="coin" data-coin="${c.key}">
          <button class="coin__head" type="button" aria-expanded="false">
            <span class="coin__mark" aria-hidden="true">${c.mark}</span>
            <span class="coin__id">
              <span class="coin__name">${escapeHtml(c.name)}</span>
              <span class="coin__net">${escapeHtml(c.net)}${c.tag ? ` · ${c.tag}` : ''}</span>
            </span>
            <span class="coin__amt">
              <b>${fmtCrypto(amt, c)}</b>
              <span>${escapeHtml(c.mark)} · ≈ ${usd(usdEq)}</span>
            </span>
            <svg class="ico coin__chev" aria-hidden="true"><use href="#i-chevron"/></svg>
          </button>
          <div class="coin__body">
            <p class="coin__addr">${escapeHtml(c.addr)}</p>
            <div class="coin__cta">
              <button class="coin__btn" type="button" data-copy-addr="${c.key}"><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg> Copy address</button>
              <button class="coin__btn coin__btn--pay" type="button" data-copy-all="${c.key}">Copy amount + address</button>
            </div>
          </div>
        </div>`;
    }).join('');

    const note = $('.pane__foot', $('#pane-crypto'));
    if (note) {
      note.textContent = state.ratesLive
        ? `Amounts include a ${Math.round((CONFIG.cryptoMarkup - 1) * 100)}% crypto-processing margin. Rate refreshed ${state.rateTime ? state.rateTime.toLocaleTimeString() : ''}.`
        : `Amounts include a ${Math.round((CONFIG.cryptoMarkup - 1) * 100)}% crypto-processing margin.`;
    }
  }

  /* ---------------------------------------------------------
     9. Exchange rates
     --------------------------------------------------------- */
  async function refreshRates() {
    const cached = sessionStorage.getItem('dt-rates');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.at < CONFIG.rateTtlMs) {
          state.rates = { ...parsed.rates };
          state.ratesLive = true;
          state.rateTime = new Date(parsed.at);
          if (parsed.rates.tether > 0 && CONFIG.useLiveFx) state.fx = parsed.rates.tether;
          return;
        }
      } catch { /* ignore */ }
    }

    const rates = await fetchRates();
    if (!rates) {
      state.ratesLive = false;   // keep the static fallback, UI flags it as indicative
      return;
    }

    state.rates = { ...state.rates, ...rates };
    state.ratesLive = true;
    state.rateTime = new Date();
    // USDT is pegged to the dollar, so its INR price is a good live proxy
    // for the INR/USD rate — keeps PayPal and crypto conversions in step
    if (rates.tether > 0 && CONFIG.useLiveFx) state.fx = rates.tether;
    sessionStorage.setItem('dt-rates', JSON.stringify({ at: Date.now(), rates }));
  }

  /** INR price per coin, from CoinGecko with a Coinbase fallback. */
  async function fetchRates() {
    const gecko = await fetchJson(CONFIG.rateEndpoint);
    if (gecko) {
      const out = {};
      for (const c of COINS) {
        const v = gecko[c.coin]?.inr;
        if (v && v > 0) out[c.coin] = v;
      }
      if (out.tether) return out;
    }

    // Coinbase returns "1 INR = X coin", so invert it
    const cb = await fetchJson(CONFIG.rateFallbackEndpoint);
    if (cb && cb.data && cb.data.rates) {
      const out = {};
      const map = { bitcoin: 'BTC', ethereum: 'ETH', tether: 'USDT', binancecoin: 'BNB' };
      for (const c of COINS) {
        const sym = map[c.coin];
        const r = sym && Number(cb.data.rates[sym]);
        if (r && r > 0) out[c.coin] = 1 / r;
      }
      if (out.tether) return out;
    }
    return null;
  }

  async function fetchJson(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('bad status');
      return await res.json();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------------------------------------------------------
     10. Events
     --------------------------------------------------------- */
  function addToCart(id) {
    if (!packById.has(id)) return;
    state.cart.has(id) ? state.cart.delete(id) : state.cart.add(id);
    renderCart();
    if (state.cart.has(id)) toast(`${packById.get(id).name} added`);
  }

  function toggleVault(key) {
    const v = vaults.find(x => x.key === key);
    if (!v) return;
    const allIn = v.packs.every(p => state.cart.has(p.id));
    v.packs.forEach(p => allIn ? state.cart.delete(p.id) : state.cart.add(p.id));
    renderCart();
    toast(allIn ? `${v.label} removed` : `${v.label} bundle added`);
  }

  function bind() {
    // add / remove
    document.addEventListener('click', e => {
      const add = e.target.closest('[data-add]');
      if (add) { e.preventDefault(); addToCart(add.dataset.add); return; }

      const detail = e.target.closest('[data-detail]');
      if (detail) { e.preventDefault(); openDetail(detail.dataset.detail); return; }

      const bundle = e.target.closest('[data-bundle]');
      if (bundle) { e.preventDefault(); toggleVault(bundle.dataset.bundle); return; }

      const rm = e.target.closest('[data-remove]');
      if (rm) { e.preventDefault(); state.cart.delete(rm.dataset.remove); renderCart(); return; }

      const xBtn = e.target.closest('[data-close]');
      if (xBtn) { e.preventDefault(); xBtn.closest('dialog')?.close(); return; }

      const copyAddr = e.target.closest('[data-copy-addr]');
      if (copyAddr) {
        const c = COINS.find(x => x.key === copyAddr.dataset.copyAddr);
        if (c) { copy(c.addr).then(ok => toast(ok ? `${c.name} address copied` : 'Copy failed')); }
        return;
      }

      const copyAll = e.target.closest('[data-copy-all]');
      if (copyAll) {
        const c = COINS.find(x => x.key === copyAll.dataset.copyAll);
        if (c) {
          const amt = fmtCrypto(cryptoAmount(cartTotal(), c), c);
          copy(`${amt} ${c.mark}\n${c.addr}`).then(ok => toast(ok ? 'Amount and address copied' : 'Copy failed'));
        }
        return;
      }

      // coin accordion
      const head = e.target.closest('.coin__head');
      if (head) {
        const coin = head.closest('.coin');
        const open = coin.classList.toggle('is-open');
        head.setAttribute('aria-expanded', String(open));
      }
    });

    // checkout + cart actions
    $('#cartCheckout')?.addEventListener('click', openCheckout);
    $('#topCartBtn')?.addEventListener('click', openCheckout);
    $('#cartClear')?.addEventListener('click', () => { state.cart.clear(); renderCart(); toast('Cart cleared'); });

    $('#megaBtn')?.addEventListener('click', () => {
      packs.forEach(p => state.cart.add(p.id));
      renderCart();
      openCheckout();
    });

    $('#detailAdd')?.addEventListener('click', e => {
      addToCart(e.currentTarget.dataset.add);
      e.currentTarget.textContent = state.cart.has(e.currentTarget.dataset.add) ? 'Remove from cart' : 'Add to cart';
    });

    // payment tabs
    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach(t => {
          const on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', String(on));
        });
        $$('.pane').forEach(p => {
          const on = p.id === tab.getAttribute('aria-controls');
          p.classList.toggle('is-active', on);
          p.hidden = !on;
        });
      });
    });

    // paypal
    document.addEventListener('click', e => {
      const copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        const val = copyBtn.dataset.copy;
        navigator.clipboard.writeText(val).then(() => {
          toast(`Copied: ${val}`);
        }).catch(() => {
          toast('Copied to clipboard');
        });
      }
    });

    $('#paypalBtn')?.addEventListener('click', () => {
      const total = cartTotal();
      const amount = paypalUsd(total);
      const label = `DesiTease order — ${money(total)} (INR)`;
      const url = `https://paypal.me/${CONFIG.paypalHandle}/${amount.toFixed(2)}USD/${encodeURIComponent(label)}`;
      window.open(url, '_blank', 'noopener');
    });

    // close dialogs on backdrop click
    $$('dialog').forEach(dlg => {
      dlg.addEventListener('click', e => {
        if (e.target === dlg) dlg.close();
      });
    });

    // Escape closes whatever is open (native dialog cancel is not universal
    // in every embedded browser, so do it explicitly as well)
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const open = $$('dialog').find(d => d.open);
      if (open) {
        e.preventDefault();
        open.close();
      }
    });

    // return focus to whatever opened the dialog
    $$('dialog').forEach(dlg => {
      dlg.addEventListener('close', () => {
        const opener = dlg._opener;
        dlg._opener = null;
        if (opener && document.contains(opener)) opener.focus();
      });
    });

    // order form
    const form = $('.order');
    form?.addEventListener('submit', () => {
      const { lines, saved } = cartLines();
      const order = {
        total: cartTotal(),
        saved,
        items: Array.from(state.cart).map(id => {
          const p = packById.get(id);
          return { id, name: p.name, price: p.price, type: p.type };
        }),
        method: $('.tab.is-active')?.textContent.trim().replace(/\s+/g, ' ') || 'UPI',
        telegram: $('#telegramInput').value.trim(),
        at: new Date().toISOString()
      };
      try { localStorage.setItem(CONFIG.orderKey, JSON.stringify(order)); } catch { /* ignore */ }
    });
  }

  /* ---------------------------------------------------------
     11. Age gate
     --------------------------------------------------------- */
  function initAgeGate() {
    const gate = $('#ageGate');
    if (gate) gate.hidden = true;
  }

  /* ---------------------------------------------------------
     12. Boot
     --------------------------------------------------------- */
  function boot() {
    renderStats();
    renderBadges();
    renderMega();
    renderCart();
    bind();
    initAgeGate();
    refreshRates().then(renderCart);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
