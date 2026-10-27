/* =========================================================
   DesiTease — order confirmation
   Reads the order saved at checkout and builds a Telegram
   confirmation link. No third-party scripts.
   ========================================================= */
(() => {
  'use strict';

  const TELEGRAM_USERNAME = 'DesiTease_4';
  const ORDER_KEY = 'orderData';
  const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const money = n => '₹' + inr.format(Math.round(Number(n) || 0));

  const $ = (sel, root = document) => root.querySelector(sel);

  function readOrder() {
    try {
      const raw = localStorage.getItem('orderData') || localStorage.getItem('dt-last-order');
      if (!raw) return null;
      const order = JSON.parse(raw);
      if (!order || !Array.isArray(order.items) || order.items.length === 0) return null;

      const items = order.items
        .filter(item => item && typeof item.name === 'string' && Number(item.price) >= 0)
        .map(item => ({
          name: item.name,
          type: typeof item.type === 'string' ? item.type : '',
          price: Number(item.price) || 0
        }));

      if (!items.length) return null;

      const sum = items.reduce((total, item) => total + item.price, 0);
      const statedTotal = Number(order.total);
      const date = order.date ? new Date(order.date) : new Date();

      return {
        items,
        total: Number.isFinite(statedTotal) && statedTotal > 0 ? statedTotal : sum,
        saved: Number(order.saved) > 0 ? Number(order.saved) : 0,
        method: typeof order.method === 'string' ? order.method : '',
        telegram: typeof order.telegram === 'string' ? order.telegram : '',
        date: Number.isFinite(date.getTime()) ? date : new Date()
      };
    } catch (e) {
      return null;
    }
  }

  function orderReference(date) {
    return 'DT-' + date.getTime().toString(36).toUpperCase().slice(-6);
  }

  function formatDate(date) {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return date.toDateString();
    }
  }

  function row(text, value, className = '') {
    const line = document.createElement('div');
    line.className = 'row' + (className ? ' ' + className : '');
    const label = document.createElement('span');
    label.textContent = text;
    const amount = document.createElement('b');
    amount.textContent = value;
    line.append(label, amount);
    return line;
  }

  function renderOrder(order) {
    const box = $('#orderItems');
    if (!box) return;
    box.replaceChildren();

    order.items.forEach(item => {
      const label = item.type ? `${item.name} · ${item.type}` : item.name;
      box.appendChild(row(label, money(item.price)));
    });
    box.appendChild(row('Total', money(order.total), 'row--total'));
    if (order.saved > 0) {
      const saved = document.createElement('p');
      saved.className = 'row row--save';
      saved.textContent = `You saved ${money(order.saved)} with your bundle`;
      box.appendChild(saved);
    }

    const meta = $('#orderMeta');
    if (meta) {
      meta.textContent = `${orderReference(order.date)} · ${formatDate(order.date)}`;
      meta.hidden = false;
    }

    const button = $('#sendOrder');
    if (button) {
      const lines = [
        'Hi DesiTease — order confirmation',
        '',
        `Order: ${orderReference(order.date)}`,
        `Placed: ${formatDate(order.date)}`,
        ...(order.method ? [`Payment method: ${order.method}`] : []),
        ...(order.telegram ? [`My Telegram: ${order.telegram}`] : []),
        '',
        'Items:',
        ...order.items.map(item => `• ${item.name} — ${money(item.price)}`),
        '',
        ...(order.saved > 0 ? [`Bundle saving: − ${money(order.saved)}`] : []),
        `Total: ${money(order.total)}`,
        '',
        'I have submitted the payment screenshot on the site. Please verify it and send my private Telegram access.'
      ];
      button.href = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(lines.join('\n'))}`;
      button.setAttribute('aria-label', 'Send your order confirmation to DesiTease on Telegram');
    }
  }

  function showEmptyState() {
    const tick = $('.tick');
    if (tick) {
      tick.classList.add('tick--muted');
      tick.querySelector('use')?.setAttribute('href', '#i-receipt');
    }

    const box = $('#orderItems');
    if (box) {
      box.replaceChildren();
      const message = document.createElement('p');
      message.className = 'muted';
      message.textContent = 'We could not find an order in this browser. If you have already paid, send us your Telegram handle and payment screenshot and we will locate it.';
      box.appendChild(message);
    }

    const title = $('#successTitle');
    const lede = $('#successLede');
    if (title) title.textContent = 'Order lookup';
    if (lede) lede.textContent = 'The confirmation details are only stored in the browser that placed the order. If you have already paid, message us and we will find it for you.';

    const meta = $('#orderMeta');
    if (meta) meta.hidden = true;

    const next = $('#nextBox');
    if (next) next.hidden = true;
    const eta = $('#eta');
    if (eta) eta.hidden = true;

    const button = $('#sendOrder');
    if (button) {
      button.href = `https://t.me/${TELEGRAM_USERNAME}`;
      button.setAttribute('aria-label', 'Message DesiTease on Telegram');
    }
  }

  function init() {
    const order = readOrder();
    if (!order) {
      showEmptyState();
      return;
    }
    renderOrder(order);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
