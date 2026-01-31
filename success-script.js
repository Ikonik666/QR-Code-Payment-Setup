// ========================================
// DESITEASE - SUCCESS PAGE SCRIPT
// Telegram Deep Link Integration
// ========================================

// Your Telegram username (CHANGE THIS TO YOUR ACTUAL USERNAME)
const TELEGRAM_USERNAME = 'DesiTease_2';

// Item data (must match your main index.html)
const itemData = {
    'pdf': { name: 'PDF Stories Pack', price: 103 },
    'mms': { name: 'Viral MMS Pack', price: 149 },
    'audio': { name: 'Audio Erotica', price: 139 },
    'animated': { name: 'Animated Pack', price: 169 },
    'bbc': { name: 'BBC Collection', price: 189 },
    'ai': { name: 'SoulMate AI App', price: 149 },
    'spy': { name: 'Spy Cam Vault', price: 199 },
    'incest': { name: 'Incest Vault', price: 219 },
    'secret': { name: 'Secret Vault', price: 260 },
    'actress': { name: 'Actress Exclusives', price: 349 }
};

let currentOrder = null;

// Load order on page load
window.addEventListener('DOMContentLoaded', function() {
    loadOrder();
});

// Load order from localStorage
function loadOrder() {
    const storedData = localStorage.getItem('orderData');
    
    if (storedData) {
        try {
            currentOrder = JSON.parse(storedData);
            displayOrder(currentOrder);
            generateTelegramLink(currentOrder);
        } catch (e) {
            console.error('Error parsing order data:', e);
            showError();
        }
    } else {
        showError();
    }
}

// Display order items
function displayOrder(orderData) {
    const container = document.getElementById('orderItems');
    
    if (!orderData || !orderData.items || orderData.items.length === 0) {
        showError();
        return;
    }

    let html = '';
    
    // Loop through items
    orderData.items.forEach(item => {
        const data = itemData[item.id];
        if (data) {
            html += `
                <div class="order-item">
                    <span>${data.name}</span>
                    <strong>₹${data.price}</strong>
                </div>
            `;
        }
    });

    // Add total
    html += `
        <div class="order-item order-total">
            <span>Total Paid</span>
            <span>₹${orderData.total}</span>
        </div>
    `;
    
    container.innerHTML = html;
}

// Show error message
function showError() {
    const container = document.getElementById('orderItems');
    container.innerHTML = `
        <p style="text-align: center; color: #95a5a6; padding: 18px; font-size: 0.9rem;">
            No order details found. Please go back and complete your purchase.
        </p>
    `;
    
    // Disable button
    const btn = document.getElementById('sendOrderBtn');
    btn.style.opacity = '0.5';
    btn.style.pointerEvents = 'none';
}

// Generate Telegram deep link with prefilled message
function generateTelegramLink(orderData) {
    if (!orderData || !orderData.items || orderData.items.length === 0) {
        return;
    }

    // Build the message
    let message = `Hi DesiTease! 👋\n\n`;
    message += `I just paid: ₹${orderData.total}\n\n`;
    message += `📦 My Order:\n`;
    
    orderData.items.forEach(item => {
        const data = itemData[item.id];
        if (data) {
            message += `• ${data.name} - ₹${data.price}\n`;
        }
    });

    message += `\nPlease verify my payment screenshot and send access! 🚀`;

    // Encode for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create Telegram deep link
    const telegramLink = `https://t.me/${TELEGRAM_USERNAME}?text=${encodedMessage}`;
    
    // Set the button href
    const btn = document.getElementById('sendOrderBtn');
    btn.href = telegramLink;
}
