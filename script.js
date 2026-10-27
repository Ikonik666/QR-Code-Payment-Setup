/* =========================================================
   DesiTease — store front
   The catalogue markup in index.html is the single source of
   truth. Prices, specs and bundles are read from the DOM.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     1. Configuration — tune the business numbers here
     --------------------------------------------------------- */
  const CONFIG = {
    // rupees per 1 US dollar (used until the live USDT rate arrives)
    fxInrPerUsd: 91.68,
    useLiveFx: true,

    // international / on-chain processing margin applied to the INR total
    paypalMarkup: 1.20,
    cryptoMarkup: 1.20,

    paypalHandle: 'desitease',
    upiId: 'desigurshermax@fam',

    // wallets
    addr: {
      usdtTron: 'TLquccw7uU4A6fTJekDsrsQbJEvnFv1eTD',
      bsc: '0x68cb68cfea2aacf2bec6a5f4c70cd4eb56155c15',
      btc: '114wbEsmXGo9tExmg2HKEZqPXYsAB9S4ei'
    },

    // bundle discounts
    vaultDiscount: 0.20,
    megaDiscount: 0.30,

    // live INR rates — fallback values are only used if the API fails
    fallbackRates: { tether: 91.7, bitcoin: 9200000, ethereum: 320000, binancecoin: 61000 },
    rateEndpoint: 'https://api.coinbase.com/v2/exchange-rates?currency=INR',
    rateTtlMs: 10 * 60 * 1000,

    ageKey: 'desitease.age.v1',
    ageLegacyKey: 'dt-age-verified',
    cartKey: 'desitease.cart.v1',
    orderKey: 'orderData'
  };

  const COINS = [
    { key: 'usdt-trc20', mark: '₮', name: 'USDT (Tether)', net: 'TRC20 · Tron', addr: CONFIG.addr.usdtTron, coin: 'tether', tag: 'Best' },
    { key: 'usdt-bep20', mark: '₮', name: 'USDT (Tether)', net: 'BEP20 · BSC', addr: CONFIG.addr.bsc, coin: 'tether', tag: 'Cheap' },
    { key: 'usdt-erc20', mark: '₮', name: 'USDT (Tether)', net: 'ERC20 · Ethereum', addr: CONFIG.addr.bsc, coin: 'tether' },
    { key: 'usdt-matic', mark: '₮', name: 'USDT (Tether)', net: 'Polygon · MATIC', addr: CONFIG.addr.bsc, coin: 'tether', tag: 'Cheap' },
    { key: 'btc', mark: '₿', name: 'Bitcoin', net: 'Main network', addr: CONFIG.addr.btc, coin: 'bitcoin', tag: 'Popular' },
    { key: 'btc-bsc', mark: '₿', name: 'Bitcoin', net: 'Wrapped · BSC', addr: CONFIG.addr.bsc, coin: 'bitcoin', tag: 'Cheap' },
    { key: 'eth', mark: 'Ξ', name: 'Ethereum', net: 'ERC20 · Mainnet', addr: CONFIG.addr.bsc, coin: 'ethereum', tag: 'Popular' },
    { key: 'eth-arb', mark: 'Ξ', name: 'Ethereum', net: 'Arbitrum · L2', addr: CONFIG.addr.bsc, coin: 'ethereum', tag: 'Cheap' },
    { key: 'eth-bsc', mark: 'Ξ', name: 'Ethereum', net: 'Wrapped · BSC', addr: CONFIG.addr.bsc, coin: 'ethereum', tag: 'Cheap' },
    { key: 'bnb', mark: 'B', name: 'BNB', net: 'BEP20 · BSC', addr: CONFIG.addr.bsc, coin: 'binancecoin', tag: 'Fast' }
  ];

  const COIN_PRECISION = { bitcoin: 8, ethereum: 6, tether: 2, binancecoin: 4 };

  /* ---------------------------------------------------------
     2. Small helpers
     --------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const money = n => '₹' + inr.format(Math.round(Number(n) || 0));
  const usd = n => '$' + Number(n || 0).toFixed(2);

  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    // A native modal dialog lives in the top layer, above ordinary page
    // content. Move the toast inside it so feedback stays visible there.
    const openDialog = $$('dialog').find(dialog => dialog.open);
    const host = openDialog || document.body;
    if (el.parentElement !== host) host.appendChild(el);
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      area.remove();
      return ok;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function parseSpecs(raw) {
    if (!raw) return [];
    return raw.split(';')
      .map(part => {
        const i = part.indexOf(':');
        return i < 0
          ? { label: part.trim(), value: '' }
          : { label: part.slice(0, i).trim(), value: part.slice(i + 1).trim() };
      })
      .filter(spec => spec.label);
  }

  /* ---------------------------------------------------------
     3. Read the catalogue out of the DOM
     --------------------------------------------------------- */
  const VAULT_LABELS = {
    top: 'Top Picks',
    premium: 'Premium Vault',
    series: 'Dark Vault',
    library: 'Top Picks',
    studio: 'Premium Vault',
    atelier: 'Dark Vault'
  };

  const packs = $$('.pack').map(el => ({
    id: el.dataset.id,
    price: Number(el.dataset.price),
    old: Number(el.dataset.old),
    vault: el.closest('[data-vault]')?.dataset.vault || 'other',
    name: $('.pack__name', el).textContent.trim(),
    desc: $('.pack__desc', el).textContent.trim(),
    blurb: el.dataset.blurb || '',
    specs: parseSpecs(el.dataset.specs),
    type: $('.pack__type', el)?.textContent.trim() || 'Collection',
    img: $('img', el)?.getAttribute('src') || '',
    el
  }));

  const packById = new Map(packs.map(pack => [pack.id, pack]));

  const vaults = $$('.vault[data-vault]').map(el => {
    const key = el.dataset.vault;
    const own = packs.filter(pack => pack.vault === key);
    const subtotal = own.reduce((sum, pack) => sum + pack.price, 0);
    return {
      key,
      label: VAULT_LABELS[key] || key,
      packs: own,
      subtotal,
      price: Math.round(subtotal * (1 - CONFIG.vaultDiscount))
    };
  });

  const allSubtotal = packs.reduce((sum, pack) => sum + pack.price, 0);
  const mega = {
    price: Math.round(allSubtotal * (1 - CONFIG.megaDiscount)),
    was: allSubtotal,
    count: packs.length
  };

  /* ---------------------------------------------------------
     4. State
     --------------------------------------------------------- */
  function readStoredCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CONFIG.cartKey) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter(id => packById.has(id));
    } catch (e) {
      return [];
    }
  }

  const state = {
    cart: new Set(readStoredCart()),
    rates: { ...CONFIG.fallbackRates },
    ratesLive: false,
    rateTime: null,
    fx: CONFIG.fxInrPerUsd,
    detailId: null
  };

  /* ---------------------------------------------------------
     5. Pricing engine (pure)
     --------------------------------------------------------- */
  function cartTotal(ids = state.cart) {
    if (ids.size === 0) return 0;
    if (packs.length > 0 && packs.every(pack => ids.has(pack.id))) return mega.price;

    let total = 0;
    for (const vault of vaults) {
      const idsInVault = vault.packs.map(pack => pack.id);
      const complete = idsInVault.every(id => ids.has(id));
      if (complete) {
        total += vault.price;
      } else {
        for (const id of idsInVault) {
          if (ids.has(id)) total += packById.get(id).price;
        }
      }
    }
    return total;
  }

  function cartLines() {
    const lines = [];
    let saved = 0;

    if (packs.length > 0 && packs.every(pack => state.cart.has(pack.id))) {
      saved = mega.was - mega.price;
      return {
        mega: true,
        lines: [{ name: `Full Vault — all ${mega.count} packs`, price: mega.price, isMega: true, vault: 'mega' }],
        saved
      };
    }

    for (const vault of vaults) {
      const ids = vault.packs.map(pack => pack.id);
      const inVault = ids.filter(id => state.cart.has(id));
      if (!inVault.length) continue;

      if (inVault.length === ids.length) {
        lines.push({ name: `${vault.label} bundle (${ids.length} packs)`, price: vault.price, vault: vault.key });
        saved += vault.subtotal - vault.price;
      } else {
        for (const id of inVault) {
          const pack = packById.get(id);
          lines.push({ name: pack.name, price: pack.price, id });
        }
      }
    }

    return { mega: false, lines, saved };
  }

  function persistCart() {
    try {
      localStorage.setItem(CONFIG.cartKey, JSON.stringify([...state.cart]));
    } catch (e) {
      /* private browsing can refuse storage */
    }
  }

  /* ---------------------------------------------------------
     6. Rendering
     --------------------------------------------------------- */
  function renderBundleLabels() {
    for (const vault of vaults) {
      const label = $(`[data-bundle-label="${vault.key}"]`);
      const button = $(`.bundle[data-bundle="${vault.key}"]`);
      const complete = vault.packs.length > 0 && vault.packs.every(pack => state.cart.has(pack.id));
      if (label) {
        label.textContent = complete
          ? `${vault.label} bundle added ✓`
          : `Save ${Math.round(CONFIG.vaultDiscount * 100)}% · Bundle ${money(vault.price)}`;
      }
      if (button) button.setAttribute('aria-pressed', String(complete));
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
      list.innerHTML = packs.map(pack => `
        <li>
          <svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>
          <span>${escapeHtml(pack.name)}</span>
          <b>${money(pack.price)}</b>
        </li>`).join('');
    }
  }

  function renderStats() {
    const el = $('[data-stat="packs"]');
    if (el) el.textContent = String(packs.length);
  }

  function renderBadges() {
    packs.forEach(pack => {
      const badge = pack.el.dataset.badge;
      if (!badge || pack.el.querySelector('.pack__flag')) return;
      const flag = document.createElement('span');
      flag.className = 'pack__flag';
      flag.setAttribute('aria-hidden', 'true');
      flag.textContent = badge;
      $('.pack__media', pack.el)?.appendChild(flag);
    });
  }

  function updateDetailButton() {
    if (!state.detailId) return;
    const button = $('#detailAdd');
    if (!button) return;
    const inCart = state.cart.has(state.detailId);
    button.textContent = inCart ? 'Remove from cart' : 'Add to cart';
    button.dataset.add = state.detailId;
  }

  function renderCart() {
    const total = cartTotal();
    const count = state.cart.size;

    $$('.pack').forEach(card => {
      const on = state.cart.has(card.dataset.id);
      card.classList.toggle('is-added', on);
      const button = $('.add', card);
      if (button) {
        button.innerHTML = on
          ? '<svg class="ico" aria-hidden="true"><use href="#i-check"/></svg><span>Added</span>'
          : '<svg class="ico" aria-hidden="true"><use href="#i-cart"/></svg><span>Add</span>';
        button.setAttribute('aria-pressed', String(on));
      }
    });

    const bar = $('#cartBar');
    if (bar) bar.hidden = count === 0;
    const countEl = $('#cartBarCount');
    if (countEl) countEl.textContent = `${count} item${count === 1 ? '' : 's'}`;
    const totalEl = $('#cartBarTotal');
    if (totalEl) totalEl.textContent = money(total);

    const badge = $('#topCartCount');
    if (badge) {
      badge.hidden = count === 0;
      badge.textContent = count ? String(count) : '';
    }

    const topCart = $('#topCartBtn');
    if (topCart) {
      topCart.setAttribute('aria-label',
        count ? `Open cart, ${count} item${count === 1 ? '' : 's'}, ${money(total)}` : 'Open cart');
    }

    renderBundleLabels();
    updateDetailButton();
    persistCart();
    if (checkoutDialog?.open) renderCheckout();
  }

  /* ---------------------------------------------------------
     7. Pack detail dialog
     --------------------------------------------------------- */
  const detailDialog = $('#detailDialog');
  const checkoutDialog = $('#checkoutDialog');

  function openDetail(id) {
    const pack = packById.get(id);
    if (!pack || !detailDialog) return;
    state.detailId = id;

    $('#detailTitle').textContent = pack.name;
    const image = $('#detailImg');
    if (image) {
      image.src = pack.img;
      image.alt = `${pack.name} cover`;
    }
    $('#detailDesc').textContent = pack.blurb || pack.desc;
    $('#detailWas').textContent = money(pack.old);
    $('#detailNow').textContent = money(pack.price);

    $('#detailSpecs').innerHTML = pack.specs.map(spec => `
      <div><dt>${escapeHtml(spec.label)}</dt><dd>${escapeHtml(spec.value)}</dd></div>`).join('');

    updateDetailButton();

    if (!detailDialog.open) {
      detailDialog._opener = document.activeElement;
      detailDialog.showModal();
    }
  }

  /* ---------------------------------------------------------
     8. Checkout
     --------------------------------------------------------- */
  let activeCoin = COINS[0];

  function openCheckout() {
    if (state.cart.size === 0) {
      toast('Your cart is empty');
      return;
    }
    if (!checkoutDialog) return;
    $('#toast')?.classList.remove('is-on');
    renderCheckout();
    if (!checkoutDialog.open) {
      checkoutDialog._opener = document.activeElement;
      checkoutDialog.showModal();
    }
  }

  function upiLink(total) {
    const params = new URLSearchParams({
      pa: CONFIG.upiId,
      pn: 'DesiTease',
      am: String(Math.round(total)),
      cu: 'INR',
      tn: 'DesiTease order'
    });
    return `upi://pay?${params.toString()}`;
  }

  function renderCheckout() {
    const { mega: isMega, lines, saved } = cartLines();
    const total = cartTotal();
    const summary = getCartSummary();

    const summaryBox = $('#orderSummary');
    if (summaryBox) {
      summaryBox.innerHTML =
        lines.map(line => `
          <div class="summary__row">
            <span>${escapeHtml(line.name)}</span>
            <span>${money(line.price)}<button class="summary__rm" type="button" ${line.id ? `data-remove="${line.id}"` : `data-remove-vault="${line.vault}"`} aria-label="Remove ${escapeHtml(line.name)}">&times;</button></span>
          </div>`).join('');

      if (isMega) {
        summaryBox.innerHTML += `
          <div class="bundle-tag summary__tag">
            🔥 30% FULL VAULT DISCOUNT APPLIED (-${money(saved)})
          </div>
        `;
      } else if (saved > 0) {
        summaryBox.innerHTML += `
          <div class="bundle-tag summary__tag">
            🎉 20% VAULT BUNDLE DISCOUNT APPLIED (-${money(saved)})
          </div>
        `;
      }
    }

    // Update Total
    const payableStr = money(total);
    if ($('#coTotal')) $('#coTotal').textContent = payableStr;
    if ($('#coCartTotal')) $('#coCartTotal').textContent = `Payable Amount: ${payableStr}`;
    const upiAmount = $('#upiAmount');
    if (upiAmount) upiAmount.textContent = payableStr;

    // Update 1-Tap Mobile UPI Intent Link with exact total
    const intent = $('#upiIntentBtn');
    if (intent) intent.href = upiLink(total);

    // Update PayPal values
    const usdAmount = paypalUsd(total);
    if ($('#paypalInr')) $('#paypalInr').textContent = payableStr;
    if ($('#paypalUsd')) $('#paypalUsd').textContent = usd(usdAmount);
    const paypalBtnText = $('#paypalBtnText');
    if (paypalBtnText) {
      paypalBtnText.textContent = `Pay with PayPal (${usd(usdAmount)} USD)`;
    }
    const note = $('#paypalNote');
    if (note) {
      note.textContent = state.ratesLive
        ? `includes ${Math.round((CONFIG.paypalMarkup - 1) * 100)}% international processing · live rate`
        : `includes ${Math.round((CONFIG.paypalMarkup - 1) * 100)}% international processing · rate is indicative`;
    }

    // Fill Netlify hidden inputs
    const items = $('#formItems');
    const amount = $('#formAmount');
    if (items) items.value = summary.items.map(item => item.name).join(', ');
    if (amount) amount.value = payableStr;

    renderCrypto(total);
  }

  function getCartSummary() {
    return {
      items: packs.filter(pack => state.cart.has(pack.id)),
      total: cartTotal(),
      discount: cartLines().saved
    };
  }

  function paypalUsd(totalInr) {
    return (totalInr * CONFIG.paypalMarkup) / state.fx;
  }

  function cryptoAmount(totalInr, coin) {
    const rate = state.rates[coin.coin];
    if (!rate) return null;
    return (totalInr * CONFIG.cryptoMarkup) / rate;
  }

  function fmtCrypto(value, coin) {
    if (value == null) return '—';
    const precision = COIN_PRECISION[coin.coin] ?? 6;
    return value.toFixed(precision);
  }

  function renderCrypto(total) {
    const list = $('#cryptoList');
    if (!list) return;
    const usdEq = (total * CONFIG.cryptoMarkup) / state.fx;

    const warning = state.ratesLive ? '' :
      '<p class="crypto__warn">Live rate unavailable — the amounts below are indicative. Confirm with support before sending.</p>';

    list.innerHTML = warning + COINS.map(coin => {
      const amount = cryptoAmount(total, coin);
      const open = activeCoin.key === coin.key ? ' is-open' : '';
      return `
        <div class="coin${open}" data-coin="${coin.key}">
          <button class="coin__head" type="button" aria-expanded="${activeCoin.key === coin.key}">
            <span class="coin__mark" aria-hidden="true">${coin.mark}</span>
            <span class="coin__id">
              <span class="coin__name">${escapeHtml(coin.name)}</span>
              <span class="coin__net">${escapeHtml(coin.net)}${coin.tag ? ` · ${escapeHtml(coin.tag)}` : ''}</span>
            </span>
            <span class="coin__amt">
              <b>${fmtCrypto(amount, coin)}</b>
              <span>${escapeHtml(coin.mark)} · ≈ ${usd(usdEq)}</span>
            </span>
            <svg class="ico coin__chev" aria-hidden="true"><use href="#i-chevron"/></svg>
          </button>
          <div class="coin__body">
            <p class="coin__addr">${escapeHtml(coin.addr)}</p>
            <div class="coin__cta">
              <button class="coin__btn" type="button" data-copy-addr="${coin.key}"><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg> Copy address</button>
              <button class="coin__btn coin__btn--pay" type="button" data-copy-all="${coin.key}">Copy amount + address</button>
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
    try {
      const cached = JSON.parse(sessionStorage.getItem('dt-rates-v2') || 'null');
      if (cached && Date.now() - cached.at < CONFIG.rateTtlMs) {
        applyRates(cached.rates, new Date(cached.at));
        return;
      }
    } catch (e) {
      /* ignore malformed cache */
    }

    const rates = await fetchRates();
    if (!rates) {
      state.ratesLive = false; // keep the static fallback; UI flags it as indicative
      return;
    }

    applyRates(rates, new Date());
    try {
      sessionStorage.setItem('dt-rates-v2', JSON.stringify({ at: Date.now(), rates }));
    } catch (e) {
      /* ignore */
    }
  }

  function applyRates(rates, date) {
    state.rates = { ...state.rates, ...rates };
    state.ratesLive = true;
    state.rateTime = date;
    if (rates.tether > 0 && CONFIG.useLiveFx) state.fx = rates.tether;
  }

  /** INR price per coin, from Coinbase (1 INR = X coin, so invert). */
  async function fetchRates() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(CONFIG.rateEndpoint, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) return null;
      const data = await response.json();
      const table = data?.data?.rates;
      if (!table) return null;

      const symbols = { bitcoin: 'BTC', ethereum: 'ETH', tether: 'USDT', binancecoin: 'BNB' };
      const out = {};
      for (const coin of COINS) {
        const value = Number(table[symbols[coin.coin]]);
        if (value > 0) out[coin.coin] = 1 / value;
      }
      return out.tether ? out : null;
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------------------------------------------------------
     10. Cart actions
     --------------------------------------------------------- */
  function addToCart(id) {
    if (!packById.has(id)) return;
    if (state.cart.has(id)) {
      state.cart.delete(id);
      toast('Removed from cart');
    } else {
      state.cart.add(id);
      toast(`${packById.get(id).name} added`);
    }
    renderCart();
  }

  function toggleVault(key) {
    const vault = vaults.find(entry => entry.key === key);
    if (!vault) return;
    const complete = vault.packs.every(pack => state.cart.has(pack.id));
    vault.packs.forEach(pack => complete ? state.cart.delete(pack.id) : state.cart.add(pack.id));
    renderCart();
    toast(complete ? `${vault.label} removed` : `${vault.label} bundle added`);
  }

  function selectTab(tab) {
    if (!tab) return;
    $$('.tab').forEach(button => {
      const active = button === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $$('.pane').forEach(pane => {
      const active = pane.id === tab.getAttribute('aria-controls');
      pane.classList.toggle('is-active', active);
      pane.hidden = !active;
    });
  }

  /* ---------------------------------------------------------
     11. Events
     --------------------------------------------------------- */
  function bind() {
    document.addEventListener('click', event => {
      const add = event.target.closest('[data-add]');
      if (add) {
        event.preventDefault();
        addToCart(add.dataset.add);
        return;
      }

      const detail = event.target.closest('[data-detail]');
      if (detail) {
        event.preventDefault();
        openDetail(detail.dataset.detail);
        return;
      }

      const bundle = event.target.closest('[data-bundle]');
      if (bundle) {
        event.preventDefault();
        toggleVault(bundle.dataset.bundle);
        return;
      }

      const remove = event.target.closest('[data-remove]');
      if (remove) {
        event.preventDefault();
        state.cart.delete(remove.dataset.remove);
        renderCart();
        if (state.cart.size === 0 && checkoutDialog?.open) {
          checkoutDialog.close();
          toast('Your cart is empty');
        }
        return;
      }

      const removeVault = event.target.closest('[data-remove-vault]');
      if (removeVault) {
        event.preventDefault();
        const vKey = removeVault.dataset.removeVault;
        if (vKey === 'mega') {
          state.cart.clear();
        } else {
          const v = vaultByKey.get(vKey);
          if (v) v.packs.forEach(p => state.cart.delete(p.id));
        }
        renderCart();
        if (state.cart.size === 0 && checkoutDialog?.open) {
          checkoutDialog.close();
          toast('Your cart is empty');
        }
        return;
      }

      const close = event.target.closest('[data-close]');
      if (close) {
        event.preventDefault();
        close.closest('dialog')?.close();
        return;
      }

      const copyAddr = event.target.closest('[data-copy-addr]');
      if (copyAddr) {
        const coin = COINS.find(entry => entry.key === copyAddr.dataset.copyAddr);
        if (coin) {
          copy(coin.addr).then(ok => {
            if (ok) {
              toast(`${coin.name} address copied`);
              const orig = copyAddr.innerHTML;
              copyAddr.innerHTML = '<svg class="ico" aria-hidden="true" style="color:#2fbf71"><use href="#i-check"/></svg> <span style="color:#2fbf71">Copied!</span>';
              setTimeout(() => { copyAddr.innerHTML = orig; }, 2000);
            } else {
              toast('Copy failed');
            }
          });
        }
        return;
      }

      const copyAll = event.target.closest('[data-copy-all]');
      if (copyAll) {
        const coin = COINS.find(entry => entry.key === copyAll.dataset.copyAll);
        if (coin) {
          const amount = fmtCrypto(cryptoAmount(cartTotal(), coin), coin);
          copy(`${amount} ${coin.mark}\n${coin.addr}`).then(ok => {
            if (ok) {
              toast('Amount and address copied');
              const orig = copyAll.innerHTML;
              copyAll.innerHTML = '<svg class="ico" aria-hidden="true" style="color:#2fbf71"><use href="#i-check"/></svg> <span style="color:#2fbf71">Copied!</span>';
              setTimeout(() => { copyAll.innerHTML = orig; }, 2000);
            } else {
              toast('Copy failed');
            }
          });
        }
        return;
      }

      const coinHead = event.target.closest('.coin__head');
      if (coinHead) {
        const coinEl = coinHead.closest('.coin');
        const coin = COINS.find(entry => entry.key === coinEl?.dataset.coin);
        if (coin) activeCoin = coin;
        const open = coinEl.classList.toggle('is-open');
        coinHead.setAttribute('aria-expanded', String(open));
      }
    });

    $('#cartCheckout')?.addEventListener('click', openCheckout);
    $('#topCartBtn')?.addEventListener('click', openCheckout);
    $('#cartClear')?.addEventListener('click', () => {
      state.cart.clear();
      renderCart();
      toast('Cart cleared');
    });

    $('#megaBtn')?.addEventListener('click', () => {
      packs.forEach(pack => state.cart.add(pack.id));
      renderCart();
      openCheckout();
    });

    /* #detailAdd is handled by the delegated [data-add] listener above;
       giving it its own listener would toggle the item twice. */

    $$('.tab').forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', event => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const next = $$('.tab')[(index + direction + $$('.tab').length) % $$('.tab').length];
        selectTab(next);
        next.focus();
      });
    });
    selectTab($('#tab-upi'));

    $('#copyUpiBtn')?.addEventListener('click', () => {
      const btn = $('#copyUpiBtn');
      copy(CONFIG.upiId).then(ok => {
        if (ok) {
          toast('UPI ID copied to clipboard');
          if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = '<svg class="ico" aria-hidden="true" style="color:#2fbf71"><use href="#i-check"/></svg> <span style="color:#2fbf71">Copied!</span>';
            setTimeout(() => { btn.innerHTML = orig; }, 2000);
          }
        } else {
          toast('Copy failed');
        }
      });
    });

    const screenshotInput = $('#screenshotInput');
    screenshotInput?.addEventListener('change', () => {
      const file = screenshotInput.files?.[0];
      let info = $('#screenshotFeedback');
      if (!info) {
        info = document.createElement('div');
        info.id = 'screenshotFeedback';
        info.style.cssText = 'font-size:0.75rem; color:#2fbf71; font-weight:600; margin-top:6px; display:flex; align-items:center; gap:6px;';
        screenshotInput.parentNode.appendChild(info);
      }
      if (file) {
        info.innerHTML = '✓ ' + escapeHtml(file.name) + ' selected (' + (file.size / 1024).toFixed(0) + ' KB)';
      } else {
        info.textContent = '';
      }
    });

    $('#paypalBtn')?.addEventListener('click', () => {
      const total = cartTotal();
      const amount = paypalUsd(total);
      const label = `DesiTease order — ${money(total)} (INR)`;
      const url = `https://paypal.me/${CONFIG.paypalHandle}/${amount.toFixed(2)}USD`;
      window.open(url, '_blank', 'noopener');
    });

    $$('dialog').forEach(dialog => {
      dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener('close', () => {
        const opener = dialog._opener;
        dialog._opener = null;
        if (opener && document.contains(opener)) opener.focus();
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const open = $$('dialog').find(dialog => dialog.open);
      if (open) {
        event.preventDefault();
        open.close();
      }
    });

    const form = $('.order');
    form?.addEventListener('submit', event => {
      if (state.cart.size === 0) {
        event.preventDefault();
        toast('Your cart is empty');
        return;
      }
      const { items, total, discount } = getCartSummary();
      const activeTab = $('.tab.is-active');
      const methods = { 'tab-upi': 'UPI', 'tab-paypal': 'PayPal', 'tab-crypto': 'Crypto' };
      const method = methods[activeTab?.id] || 'UPI';
      const methodField = $('#formMethod');
      if (methodField) methodField.value = method;
      const order = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          price: item.price
        })),
        total,
        saved: discount,
        method,
        telegram: $('#telegramInput')?.value.trim() || '',
        date: new Date().toISOString()
      };
      try {
        localStorage.setItem('orderData', JSON.stringify(order));
        localStorage.setItem(CONFIG.orderKey, JSON.stringify(order));
      } catch (e) {
        /* the confirmation page has an empty state */
      }
    });
  }

  /* ---------------------------------------------------------
     12. Age gate
     --------------------------------------------------------- */
  function focusableIn(root) {
    return $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', root)
      .filter(el => !el.disabled && el.offsetParent !== null);
  }

  function initAgeGate() {
    const gate = $('#ageGate');
    if (!gate) return;

    let accepted = true;
    document.documentElement.dataset.gate = 'accepted';
    gate.hidden = true;
    gate.setAttribute('aria-hidden', 'true');
    return;

    gate.hidden = false;
    document.body.classList.add('is-gated');
    const enter = $('#gateEnter');
    const behind = $$('body > *').filter(el => el !== gate && el.tagName !== 'SCRIPT');
    behind.forEach(el => {
      try { el.inert = true; } catch (e) { /* focus trap is the fallback */ }
    });

    setTimeout(() => enter?.focus({ preventScroll: true }), 60);

    gate.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const items = focusableIn(gate);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    enter?.addEventListener('click', () => {
      try {
        localStorage.setItem(CONFIG.ageKey, '1');
        localStorage.removeItem(CONFIG.ageLegacyKey);
      } catch (e) {
        /* entry is still allowed for this view */
      }
      document.documentElement.dataset.gate = 'accepted';
      gate.hidden = true;
      gate.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-gated');
      behind.forEach(el => {
        try { el.inert = false; } catch (e) { /* ignore */ }
      });
      $('.brand')?.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------
     13. Boot
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
  window.saveOrderData = function() {
    const { items, total, discount } = getCartSummary();
    const activeTab = $('.tab.is-active');
    const methods = { 'tab-upi': 'UPI', 'tab-paypal': 'PayPal', 'tab-crypto': 'Crypto' };
    const method = methods[activeTab?.id] || 'UPI';
    const order = {
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        price: item.price
      })),
      total,
      saved: discount,
      method,
      telegram: $('#telegramInput')?.value.trim() || '',
      date: new Date().toISOString()
    };
    try {
      localStorage.setItem('orderData', JSON.stringify(order));
      localStorage.setItem(CONFIG.orderKey, JSON.stringify(order));
    } catch (e) {}
    return order;
  };

})();
