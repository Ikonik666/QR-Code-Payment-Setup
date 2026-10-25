/* =========================================================
   DesiTease — order confirmation
   Reads the order saved at checkout and builds a Telegram
   confirmation link. No third-party scripts.
   ========================================================= */
(() => {
  'use strict';

  const TELEGRAM_USERNAME = 'DesiTease_4';
  const inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const money = n => '₹' + inrFmt.format(Math.round(Number(n) || 0));

  const $ = sel => document.querySelector(sel);

  function readOrder() {
    try {
      const raw = localStorage.getItem('orderData');
      if (!raw) return null;
      const order = JSON.parse(raw);
      if (!order || !Array.isArray(order.items) || order.items.length === 0) return null;

      const items = order.items
        .filter(item => item && typeof item.name === 'string' && Number(item.price) >= 0)
        .map(item => ({
          id: String(item.id || ''),
          name: item.name,
          type: typeof item.type === 'string' ? item.type : '',
          price: Number(item.price) || 0
        }));

      if (!items.length) return null;

      const sum = items.reduce((acc, item) => acc + item.price, 0);
      const total = Number(order.total);
      return {
        items,
        total: Number.isFinite(total) && total > 0 ? total : sum,
        date: order.date ? new Date(order.date) : new Date()
      };
    } catch (e) {
      return null;
    }
  }

  function orderReference(date) {
    const stamp = Number.isFinite(date.getTime()) ? date.getTime() : Date.now();
    return 'DT-' + stamp.toString(36).toUpperCase().slice(-6);
  }

  function formatDate(date) {
    if (!Number.isFinite(date.getTime())) return 'Just now';
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

  function renderOrder(order) {
    const itemsBox = $('#orderItems');
    const totalBox = $('#orderTotal');
    const totalValue = $('#orderTotalValue');
    const meta = $('#orderMeta');
    if (!itemsBox) return;

    itemsBox.replaceChildren();

    order.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'order-item';

      const text = document.createElement('div');
      text.className = 'order-item__text';

      const name = document.createElement('span');
      name.className = 'order-item__name';
      name.textContent = item.name;

      text.appendChild(name);

      if (item.type) {
        const type = document.createElement('span');
        type.className = 'order-item__type';
        type.textContent = item.type;
        text.appendChild(type);
      }

      const price = document.createElement('span');
      price.className = 'order-item__price';
      price.textContent = money(item.price);

      row.append(text, price);
      itemsBox.appendChild(row);
    });

    if (meta) {
      meta.textContent = `${orderReference(order.date)} · ${formatDate(order.date)}`;
    }

    if (totalBox && totalValue) {
      totalBox.hidden = false;
      totalValue.textContent = money(order.total);
    }
  }

  function showEmptyState() {
    const itemsBox = $('#orderItems');
    const meta = $('#orderMeta');
    const status = $('#orderStatus');
    const sendText = $('#sendOrderText');
    const eyebrow = $('#successEyebrow');
    const title = $('#successTitle');
    const lede = $('#successLede');
    const steps = $('#nextSteps');
    const eta = $('#etaNote');

    if (itemsBox) {
      itemsBox.replaceChildren();
      const line = document.createElement('p');
      line.className = 'order__empty-line';
      line.textContent = 'No order details were found in this browser. If you have already paid, send us a message with your Telegram handle and payment screenshot and we will locate it.';
      itemsBox.appendChild(line);
    }

    if (meta) meta.textContent = 'Nothing stored in this browser';
    if (status) status.textContent = 'Need help?';
    if (sendText) sendText.textContent = 'Message us on Telegram';
    if (eyebrow) eyebrow.textContent = 'Order lookup';
    if (title) title.innerHTML = 'We couldn’t find that <em>order</em>.';
    if (lede) lede.textContent = 'The confirmation details are only stored in the browser that placed the order. If you have already paid, message us and we will find it for you.';
    if (steps) steps.hidden = true;
    if (eta) eta.hidden = true;
  }

  function buildTelegramLink(order) {
    const lines = [
      'Hi DesiTease — order confirmation',
      '',
      `Order: ${orderReference(order.date)}`,
      `Placed: ${formatDate(order.date)}`,
      '',
      'Items:',
      ...order.items.map(item => `• ${item.name} — ${money(item.price)}`),
      '',
      `Total: ${money(order.total)}`,
      '',
      'I have submitted the payment screenshot on the site. Please verify it and send my private Telegram access.'
    ];

    return `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  function init() {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    const order = readOrder();
    if (!order) {
      showEmptyState();
      return;
    }

    renderOrder(order);

    const btn = $('#sendOrderBtn');
    if (btn) {
      btn.href = buildTelegramLink(order);
      btn.setAttribute('aria-label', 'Send your order confirmation to DesiTease on Telegram');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
