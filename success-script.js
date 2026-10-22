/* =========================================================
   DesiTease — order confirmation script
   Reads the order that script.js stored before the form POST
   and turns it into a Telegram deep link for the customer.
   ========================================================= */
(() => {
  'use strict';

  const TELEGRAM_USERNAME = 'DesiTease_4';
  const ORDER_KEY = 'dt-order';

  const $ = (sel, root = document) => root.querySelector(sel);
  const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const money = n => '₹' + inr.format(Math.round(Number(n) || 0));

  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function readOrder() {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function render(order) {
    const box = $('#orderItems');
    const btn = $('#sendOrder');

    if (!order || !Array.isArray(order.items) || !order.items.length) {
      box.innerHTML = '<p class="muted">We could not find your order details. If you just paid, send us the screenshot on Telegram and we will sort it out.</p>';
      btn.setAttribute('aria-disabled', 'true');
      btn.removeAttribute('href');
      return;
    }

    const rows = order.items.map(it => `
      <div class="row">
        <span>${escapeHtml(it.name)}${it.type ? ` <span class="muted">${escapeHtml(it.type)}</span>` : ''}</span>
        <b>${money(it.price)}</b>
      </div>`).join('');

    box.innerHTML = rows + `
      <div class="row row--total"><span>Total paid</span><b>${money(order.total)}</b></div>` +
      (order.saved > 0 ? `<div class="row row--save">You saved ${money(order.saved)} with your bundle</div>` : '');

    const method = order.method ? `\nPayment method: ${order.method}` : '';
    const handle = order.telegram ? `\nMy contact: ${order.telegram}` : '';
    const message =
      `Hi DesiTease! 👋\n\n` +
      `I just paid ${money(order.total)}.` + method + handle + `\n\n` +
      `📦 My order:\n` +
      order.items.map(it => `• ${it.name} — ${money(it.price)}`).join('\n') +
      `\n\nI have attached my payment screenshot. Please verify and send access. 🚀`;

    btn.href = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`;
  }

  function boot() {
    render(readOrder());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
