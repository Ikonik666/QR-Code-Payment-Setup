/* =========================================================
   DesiTease — storefront
   Catalogue, bag, bundles, checkout and small delights.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     1. Configuration
     --------------------------------------------------------- */
  const CONFIG = {
    fxInrPerUsd: 91.68,
    useLiveFx: true,
    paypalMarkup: 1.20,
    paypalHandle: 'desitease',
    upiId: 'desitease@fam',
    vaultDiscount: 0.20,
    megaDiscount: 0.30,
    ageKey: 'desitease.age.v1',
    cartKey: 'desitease.cart.v1'
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const money = n => '₹' + inrFmt.format(Math.round(n));
  const usdMoney = n => '$' + n.toFixed(2);

  const CATALOGUE = [];
  const VAULTS = {};
  const cart = new Set();

  /* ---------------------------------------------------------
     2. Small utilities
     --------------------------------------------------------- */
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('is-on'), 2400);
  }

  function showCopyPill(label) {
    const pill = $('#copyNotif');
    const text = $('#copyNotifText');
    if (!pill) return;
    if (text) text.textContent = label;
    pill.classList.add('show');
    clearTimeout(showCopyPill._t);
    showCopyPill._t = setTimeout(() => pill.classList.remove('show'), 2300);
  }

  function fallbackCopy(text, label) {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    } catch (e) {
      /* no-op — the address is still visible in the UI */
    }
    showCopyPill(label);
  }

  function copyToClipboard(text, label = 'Link') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showCopyPill(label))
        .catch(() => fallbackCopy(text, label));
    } else {
      fallbackCopy(text, label);
    }
  }

  function parseSpecs(str) {
    if (!str) return [];
    return str.split(';').map(part => {
      const idx = part.indexOf(':');
      if (idx === -1) return { k: part.trim(), v: '' };
      return { k: part.slice(0, idx).trim(), v: part.slice(idx + 1).trim() };
    }).filter(s => s.k);
  }

  /* ---------------------------------------------------------
     3. Catalogue ingestion
     --------------------------------------------------------- */
  function initCatalogue() {
    $$('article.pack').forEach(article => {
      const id = article.dataset.id;
      if (!id) return;

      const price = parseInt(article.dataset.price, 10) || 0;
      const oldPrice = parseInt(article.dataset.old, 10) || Math.round(price * 1.35);
      const name = $('.pack__name', article)?.textContent.trim() || id;
      const blurb = article.dataset.blurb || $('.pack__desc', article)?.textContent.trim() || '';
      const specs = parseSpecs(article.dataset.specs);
      const imgEl = $('img', article);
      const type = $('.pack__tag', article)?.textContent.trim() || 'Collection';
      const vaultEl = article.closest('[data-vault]');
      const vaultKey = vaultEl?.dataset.vault || 'other';

      const item = {
        id,
        price,
        oldPrice,
        name,
        blurb,
        specs,
        img: imgEl?.getAttribute('src') || '',
        type,
        vaultKey,
        el: article
      };
      CATALOGUE.push(item);

      if (!VAULTS[vaultKey]) {
        VAULTS[vaultKey] = {
          key: vaultKey,
          items: [],
          el: vaultEl,
          labelEl: $(`[data-bundle-label="${vaultKey}"]`),
          btn: $(`.bundle[data-bundle="${vaultKey}"]`)
        };
      }
      VAULTS[vaultKey].items.push(item);
    });

    // Hydrate a persisted bag, ignoring packs that no longer exist.
    try {
      const stored = JSON.parse(localStorage.getItem(CONFIG.cartKey) || '[]');
      if (Array.isArray(stored)) {
        stored.forEach(id => {
          if (CATALOGUE.some(item => item.id === id)) cart.add(id);
        });
      }
    } catch (e) {
      /* ignore malformed storage */
    }

    // Vault bundle maths
    Object.values(VAULTS).forEach(vault => {
      const sum = vault.items.reduce((acc, item) => acc + item.price, 0);
      vault.sum = sum;
      vault.bundlePrice = Math.round(sum * (1 - CONFIG.vaultDiscount));
      vault.labelText = `Save 20% · Bundle ${money(vault.bundlePrice)}`;
      if (vault.labelEl) vault.labelEl.textContent = vault.labelText;
    });

    // Complete vault maths
    const total = CATALOGUE.reduce((acc, item) => acc + item.price, 0);
    const megaPrice = Math.round(total * (1 - CONFIG.megaDiscount));
    const savings = total - megaPrice;
    const nowEl = $('[data-mega-price]');
    const wasEl = $('[data-mega-was]');
    const saveEl = $('[data-mega-save]');
    if (nowEl) nowEl.textContent = money(megaPrice);
    if (wasEl) wasEl.textContent = money(total);
    if (saveEl) saveEl.textContent = `Save ${money(savings)}`;
    VAULTS.__mega = { price: megaPrice, total, savings };

    // What's inside the complete vault
    const list = $('[data-mega-list]');
    if (list) {
      list.innerHTML = CATALOGUE.map(item => `
        <li><svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>${item.name}</li>
      `).join('');
    }
  }

  /* ---------------------------------------------------------
     4. Bag maths
     --------------------------------------------------------- */
  function saveCart() {
    try {
      localStorage.setItem(CONFIG.cartKey, JSON.stringify([...cart]));
    } catch (e) {
      /* storage can fail in private mode */
    }
  }

  function getCartSummary() {
    const items = CATALOGUE.filter(item => cart.has(item.id));
    if (items.length === 0) {
      return {
        items: [],
        total: 0,
        rawTotal: 0,
        discount: 0,
        isMega: false,
        bundleVaults: []
      };
    }

    const rawTotal = items.reduce((acc, item) => acc + item.price, 0);

    // Complete-vault discount wins when every pack is selected.
    if (items.length === CATALOGUE.length) {
      const total = Math.round(rawTotal * (1 - CONFIG.megaDiscount));
      return {
        items,
        total,
        rawTotal,
        discount: rawTotal - total,
        isMega: true,
        bundleVaults: Object.keys(VAULTS).filter(key => key !== '__mega')
      };
    }

    let total = 0;
    const bundleVaults = [];
    const counted = new Set();

    Object.values(VAULTS).forEach(vault => {
      if (vault === VAULTS.__mega || !vault.items.length) return;
      const complete = vault.items.every(item => cart.has(item.id));
      if (complete) {
        total += vault.bundlePrice;
        bundleVaults.push(vault.key);
        vault.items.forEach(item => counted.add(item.id));
      }
    });

    items.forEach(item => {
      if (!counted.has(item.id)) total += item.price;
    });

    return {
      items,
      total,
      rawTotal,
      discount: rawTotal - total,
      isMega: false,
      bundleVaults
    };
  }

  function updateDetailButton() {
    const btn = $('#detailAddBtn');
    if (!btn || !btn.dataset.currentId) return;
    const inCart = cart.has(btn.dataset.currentId);
    btn.textContent = inCart ? 'Remove from bag' : 'Add to bag';
    btn.classList.toggle('is-in-cart', inCart);
  }

  function updateCartUI() {
    const summary = getCartSummary();
    const count = cart.size;

    const topCount = $('#topCartCount');
    if (topCount) {
      topCount.hidden = count === 0;
      topCount.textContent = count;
    }

    const cartBar = $('#cartBar');
    if (cartBar) {
      cartBar.hidden = count === 0;
      document.body.classList.toggle('has-cart', count > 0);
    }

    const cartCount = $('#cartBarCount');
    const cartTotal = $('#cartBarTotal');
    const cartNote = $('#cartBarNote');
    if (cartCount) cartCount.textContent = `${count} item${count === 1 ? '' : 's'}`;
    if (cartTotal) cartTotal.textContent = money(summary.total);
    if (cartNote) {
      cartNote.textContent = summary.discount > 0
        ? `You save ${money(summary.discount)}`
        : 'One payment · lifetime access';
    }

    $$('.add[data-add]').forEach(btn => {
      const id = btn.dataset.add;
      const inCart = cart.has(id);
      btn.classList.toggle('is-in-cart', inCart);
      btn.textContent = inCart ? 'Added ✓' : 'Add to bag';
      btn.setAttribute('aria-pressed', String(inCart));
    });

    Object.values(VAULTS).forEach(vault => {
      if (vault === VAULTS.__mega) return;
      const active = vault.items.length > 0 && vault.items.every(item => cart.has(item.id));
      if (vault.btn) {
        vault.btn.classList.toggle('is-active', active);
        vault.btn.setAttribute('aria-pressed', String(active));
      }
      if (vault.labelEl) {
        vault.labelEl.textContent = active ? 'Bundle in bag ✓' : vault.labelText;
      }
    });

    const megaBtn = $('#megaBtn');
    if (megaBtn) {
      const allIn = CATALOGUE.length > 0 && CATALOGUE.every(item => cart.has(item.id));
      megaBtn.firstChild.textContent = allIn ? 'Full vault in your bag ' : 'Unlock the vault ';
      megaBtn.setAttribute('aria-pressed', String(allIn));
    }

    updateDetailButton();
    saveCart();

    if ($('#checkoutModal') && !$('#checkoutModal').hidden) renderCheckout();
  }

  function toggleItem(id) {
    if (!CATALOGUE.some(item => item.id === id)) return;
    if (cart.has(id)) {
      cart.delete(id);
      toast('Removed from your bag');
    } else {
      cart.add(id);
      toast('Added to your bag');
    }
    updateCartUI();
  }

  function toggleVault(key) {
    const vault = VAULTS[key];
    if (!vault || vault === VAULTS.__mega) return;
    const allIn = vault.items.every(item => cart.has(item.id));
    if (allIn) {
      vault.items.forEach(item => cart.delete(item.id));
      toast('Bundle removed');
    } else {
      vault.items.forEach(item => cart.add(item.id));
      toast('Bundle added — 20% off');
    }
    updateCartUI();
  }

  function toggleMega() {
    const allIn = CATALOGUE.length > 0 && CATALOGUE.every(item => cart.has(item.id));
    if (allIn) {
      cart.clear();
      toast('Bag cleared');
    } else {
      CATALOGUE.forEach(item => cart.add(item.id));
      toast('Complete vault added — 30% off');
    }
    updateCartUI();
  }

  function clearCart() {
    cart.clear();
    updateCartUI();
    closeModal($('#checkoutModal'));
    toast('Bag cleared');
  }

  /* ---------------------------------------------------------
     5. Modals
     --------------------------------------------------------- */
  let lastFocused = null;

  function focusableIn(modal) {
    return $$('button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])', modal)
      .filter(el => !el.disabled && el.offsetParent !== null);
  }

  function openModal(modal) {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    const target = $('.modal__close', modal) || modal;
    requestAnimationFrame(() => target.focus({ preventScroll: true }));
  }

  function closeModal(modal) {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (!$('.modal:not([hidden])')) document.body.classList.remove('modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
  }

  function openDetail(id) {
    const item = CATALOGUE.find(entry => entry.id === id);
    const modal = $('#detailModal');
    if (!item || !modal) return;

    const title = $('#detailTitle');
    const desc = $('#detailDesc');
    const image = $('#detailImg');
    const type = $('#detailTypeBadge');
    const was = $('#detailWas');
    const now = $('#detailNow');
    const specs = $('#detailSpecs');

    if (title) title.textContent = item.name;
    if (desc) desc.textContent = item.blurb;
    if (image) {
      image.src = item.img;
      image.alt = `${item.name} cover`;
    }
    if (type) type.textContent = item.type;
    if (was) was.textContent = money(item.oldPrice);
    if (now) now.textContent = money(item.price);
    if (specs) {
      specs.innerHTML = item.specs.map(spec => `
        <div class="spec">
          <span class="spec__k">${spec.k}</span>
          <span class="spec__v">${spec.v}</span>
        </div>
      `).join('');
    }

    const addBtn = $('#detailAddBtn');
    if (addBtn) addBtn.dataset.currentId = item.id;
    updateDetailButton();
    openModal(modal);
  }

  function renderCheckout() {
    const summary = getCartSummary();
    const box = $('#orderSummary');
    const badge = $('#summaryBadge');

    if (box) {
      box.innerHTML = summary.items.map(item => `
        <div class="summary-item">
          <div class="summary-item__text">
            <strong>${item.name}</strong>
            <span>${money(item.price)}</span>
          </div>
          <button class="summary-item__remove" type="button" data-del="${item.id}" aria-label="Remove ${item.name}">&times;</button>
        </div>
      `).join('');
    }

    const totalEl = $('#coCartTotal');
    if (totalEl) totalEl.textContent = money(summary.total);

    const upiIntentBtn = $('#upiIntentBtn');
    if (upiIntentBtn) {
      upiIntentBtn.href = `upi://pay?pa=${CONFIG.upiId}&pn=DesiTease&am=${summary.total}&cu=INR&tn=DesiTease_Order`;
    }

    const mobileTotal = $('#coMobileTotal');
    const mobileNote = $('#coMobileNote');
    if (mobileTotal) mobileTotal.textContent = money(summary.total);
    if (mobileNote) {
      const count = summary.items.length;
      mobileNote.textContent = `${count} item${count === 1 ? '' : 's'}${summary.discount > 0 ? ` · save ${money(summary.discount)}` : ''}`;
    }

    if (badge) {
      if (summary.discount > 0) {
        badge.hidden = false;
        badge.innerHTML = `<span>${summary.isMega ? 'Complete vault saving' : 'Bundle saving applied'}</span><b>− ${money(summary.discount)}</b>`;
      } else {
        badge.hidden = true;
        badge.innerHTML = '';
      }
    }

    const formItems = $('#formItems');
    const formAmount = $('#formAmount');
    if (formItems) formItems.value = summary.items.map(item => item.name).join(', ');
    if (formAmount) formAmount.value = summary.total ? money(summary.total) : '';

    updatePaypal(summary);
  }

  function openCheckout() {
    if (cart.size === 0) {
      toast('Your bag is empty — add a collection first');
      return;
    }
    const modal = $('#checkoutModal');
    if (!modal) return;
    renderCheckout();
    openModal(modal);
  }

  function updatePaypal(summary = getCartSummary()) {
    const text = $('#paypalBtnText');
    const btn = $('#paypalBtn');
    if (!text || !btn) return;
    const usd = (summary.total * CONFIG.paypalMarkup) / CONFIG.fxInrPerUsd;
    text.textContent = `Pay with PayPal — ${usdMoney(usd)}`;
    btn.dataset.usd = usd.toFixed(2);
  }

  async function refreshRate() {
    if (!CONFIG.useLiveFx || !('fetch' in window)) return;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD', {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timer);
      if (!res.ok) return;
      const data = await res.json();
      const inr = Number(data?.data?.rates?.INR);
      if (inr > 40 && inr < 200) {
        CONFIG.fxInrPerUsd = inr;
        updatePaypal();
      }
    } catch (e) {
      /* fall back to the configured rate */
    }
  }

  /* ---------------------------------------------------------
     6. Checkout interactions
     --------------------------------------------------------- */
  function selectTab(name) {
    $$('.pay-tab').forEach(tab => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    const panels = { upi: 'panelUpi', paypal: 'panelPaypal', crypto: 'panelCrypto' };
    $$('.pay-panel').forEach(panel => {
      panel.hidden = panel.id !== panels[name];
    });
  }

  function saveOrderData() {
    const summary = getCartSummary();
    try {
      localStorage.setItem('orderData', JSON.stringify({
        items: summary.items.map(item => ({ id: item.id, name: item.name, type: item.type, price: item.price })),
        total: summary.total,
        date: new Date().toISOString()
      }));
    } catch (e) {
      /* the success page will fall back to its empty state */
    }
  }

  /* ---------------------------------------------------------
     7. Age gate
     --------------------------------------------------------- */
  function initAgeGate() {
    const gate = $('#ageGate');
    const enter = $('#gateEnter');
    if (!gate) return;

    if (document.documentElement.dataset.gate === 'accepted') {
      gate.setAttribute('aria-hidden', 'true');
      return;
    }

    // Keep the page behind the gate out of the tab order and screen readers.
    const behind = $$('body > *').filter(el => el !== gate && el.tagName !== 'SCRIPT');
    const setBehindInert = state => {
      behind.forEach(el => {
        try { el.inert = state; } catch (e) { /* older browsers rely on the focus trap */ }
      });
    };
    setBehindInert(true);

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
      } catch (e) {
        /* still allow this session */
      }
      document.documentElement.dataset.gate = 'accepted';
      gate.setAttribute('aria-hidden', 'true');
      setBehindInert(false);
      toast('Welcome to the archive');
    });
  }

  /* ---------------------------------------------------------
     8. Reveal on scroll
     --------------------------------------------------------- */
  function initReveal() {
    const blocks = $$('.reveal');
    if (!blocks.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      blocks.forEach(block => block.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    blocks.forEach(block => observer.observe(block));
  }

  /* ---------------------------------------------------------
     9. Event bindings
     --------------------------------------------------------- */
  function bindEvents() {
    $$('[data-detail]').forEach(el => {
      el.addEventListener('click', () => openDetail(el.dataset.detail));
    });

    $$('.add[data-add]').forEach(btn => {
      btn.addEventListener('click', event => {
        event.stopPropagation();
        toggleItem(btn.dataset.add);
      });
    });

    $$('.bundle[data-bundle]').forEach(btn => {
      btn.addEventListener('click', () => toggleVault(btn.dataset.bundle));
    });

    $('#megaBtn')?.addEventListener('click', toggleMega);
    $('#topCartBtn')?.addEventListener('click', openCheckout);
    $('#cartCheckout')?.addEventListener('click', openCheckout);
    $('#cartClearBtn')?.addEventListener('click', clearCart);

    $$('[data-close]').forEach(el => {
      el.addEventListener('click', () => closeModal($(`#${el.dataset.close}`)));
    });

    const detailAdd = $('#detailAddBtn');
    detailAdd?.addEventListener('click', () => {
      if (detailAdd.dataset.currentId) toggleItem(detailAdd.dataset.currentId);
    });

    $('#orderSummary')?.addEventListener('click', event => {
      const remove = event.target.closest('.summary-item__remove');
      if (!remove) return;
      cart.delete(remove.dataset.del);
      updateCartUI();
      if (cart.size === 0) {
        closeModal($('#checkoutModal'));
        toast('Your bag is empty');
      } else {
        renderCheckout();
      }
    });

    const tabs = $$('.pay-tab');
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(tab.dataset.tab));
      tab.addEventListener('keydown', event => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const next = tabs[(index + direction + tabs.length) % tabs.length];
        selectTab(next.dataset.tab);
        next.focus();
      });
    });

    $('#copyUpiBtn')?.addEventListener('click', () => copyToClipboard(CONFIG.upiId, 'UPI ID'));

    $('#paypalBtn')?.addEventListener('click', () => {
      const btn = $('#paypalBtn');
      const usd = btn?.dataset.usd;
      if (!CONFIG.paypalHandle || !usd) {
        toast('PayPal is unavailable right now');
        return;
      }
      window.open(`https://www.paypal.me/${CONFIG.paypalHandle}/${usd}`, '_blank', 'noopener');
    });

    $$('.crypto-group__head').forEach(head => {
      head.addEventListener('click', () => {
        const group = head.closest('.crypto-group');
        if (!group) return;
        const open = group.classList.toggle('is-open');
        head.setAttribute('aria-expanded', String(open));
      });
    });

    $$('.network').forEach(button => {
      button.addEventListener('click', () => {
        const address = button.dataset.copy;
        const coin = button.dataset.coin || 'Crypto';
        if (address) copyToClipboard(address, `${coin} address`);
      });
    });

    $('#desiOrderForm')?.addEventListener('submit', event => {
      if (cart.size === 0) {
        event.preventDefault();
        toast('Your bag is empty');
        return;
      }
      saveOrderData();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeModal($('#detailModal'));
        closeModal($('#checkoutModal'));
      }

      if (event.key !== 'Tab') return;
      const open = $$('.modal').find(modal => !modal.hidden);
      if (!open) return;
      const items = focusableIn(open);
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

    const head = $('#siteHead');
    const onScroll = () => head?.classList.toggle('is-scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------
     10. Boot
     --------------------------------------------------------- */
  function boot() {
    initCatalogue();
    bindEvents();
    updateCartUI();
    initAgeGate();
    initReveal();
    refreshRate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
