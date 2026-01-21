// ========================================
//   DESITEASE - SUCCESS PAGE SCRIPT
//   Order details + Telegram integration
// ========================================

// Item data for detailed bundle matching (must match index.html)
const itemData = {
    'pdf': { name: 'PDF Stories Pack', price: 103 },
    'mms': { name: 'Viral MMS Pack', price: 149 },
    'audio': { name: 'Audio Erotica', price: 139 },
    'animated': { name: 'Animated 3D Pack', price: 169 },
    'bbc': { name: 'BBC Pack', price: 189 },
    'ai': { name: 'AI App Pack', price: 149 },
    'spy': { name: 'Spy Cam Vault', price: 199 },
    'incest': { name: 'Incest Pack', price: 219 },
    'secret': { name: 'Secret Vault', price: 260 },
    'actress': { name: 'Actress Pack', price: 349 }
};

// Load order from localStorage or URL params
function loadOrder() {
    const storedData = localStorage.getItem('desiOrder');

    if (storedData) {
        const order = JSON.parse(storedData);
        displayOrder(order.items, order.total);
    } else {
        // Fallback to URL params
        const urlParams = new URLSearchParams(window.location.search);
        const itemsParam = urlParams.get('items');
        const amountParam = urlParams.get('amount');

        if (itemsParam && amountParam) {
            const items = itemsParam.split(',').map(id => {
                const data = itemData[id.trim()];
                return data ? { id: id.trim(), ...data } : null;
            }).filter(Boolean);
            displayOrder(items, '₹' + amountParam);
        } else {
            document.getElementById('orderItems').innerHTML = 
                '<div class="order-item"><span style="color: #ff6b6b;">Order details not found. Please try again.</span></div>';
        }
    }
}

// Display order details
function displayOrder(items, totalAmount) {
    const container = document.getElementById('orderItems');
    const itemIds = items.map(i => i.id);
    const itemCount = itemIds.length;

    // Detect bundles
    let isMegaBundle = itemCount === 10;
    let isTopPicksBundle = itemCount === 2 && itemIds.includes('pdf') && itemIds.includes('mms');
    let isTrendingBundle = itemCount === 4 && itemIds.includes('audio') && itemIds.includes('animated') && itemIds.includes('bbc') && itemIds.includes('ai');
    let isForbiddenBundle = itemCount === 4 && itemIds.includes('spy') && itemIds.includes('incest') && itemIds.includes('secret') && itemIds.includes('actress');

    let html = '';

    if (isMegaBundle) {
        html += `
            <div class="order-item">
                <span><strong>🔥 ULTIMATE WINTER BUNDLE</strong><br><small>All 10 Premium Packs</small></span>
                <span style="color: var(--gold); font-weight: 900;">₹1499</span>
            </div>`;
    } else if (isTopPicksBundle) {
        html += `
            <div class="order-item">
                <span><strong>🔥 Top Picks Bundle</strong><br><small>PDF Stories + Viral MMS</small></span>
                <span>₹202</span>
            </div>`;
    } else if (isTrendingBundle) {
        html += `
            <div class="order-item">
                <span><strong>⚡ Trending Bundle</strong><br><small>Audio + 3D + BBC + AI App</small></span>
                <span>₹517</span>
            </div>`;
    } else if (isForbiddenBundle) {
        html += `
            <div class="order-item">
                <span><strong>💀 Forbidden Vault Bundle</strong><br><small>Spy + Incest + Secret + Actress</small></span>
                <span>₹822</span>
            </div>`;
    } else {
        items.forEach(item => {
            html += `
                <div class="order-item">
                    <span>${item.name}</span>
                    <span>₹${item.price}</span>
                </div>`;
        });
    }

    html += `
        <div class="order-total">
            <span>Total Paid</span>
            <span>${totalAmount}</span>
        </div>`;

    container.innerHTML = html;
    generateTelegramLink(items, totalAmount, isMegaBundle, isTopPicksBundle, isTrendingBundle, isForbiddenBundle);
}

// Generate Telegram message link
function generateTelegramLink(items, amount, isMega, isTopPicks, isTrending, isForbidden) {
    let itemsList = '';

    if (isMega) itemsList = '• ULTIMATE WINTER BUNDLE - ₹1499 (All 10 Packs)';
    else if (isTopPicks) itemsList = '• Top Picks Bundle - ₹202 (PDF + MMS)';
    else if (isTrending) itemsList = '• Trending Bundle - ₹517 (Audio + 3D + BBC + AI)';
    else if (isForbidden) itemsList = '• Forbidden Vault Bundle - ₹822 (Spy + Incest + Secret + Actress)';
    else itemsList = items.map(i => `• ${i.name} - ₹${i.price}`).join('\n');

    const cleanAmount = amount.replace('₹', '');

    const message = `Hi DesiTease! 👋

I just paid: ₹${cleanAmount}

📦 My Order:
${itemsList}

Please verify my payment screenshot and send access! 🚀`;

    const encodedMessage = encodeURIComponent(message);
    document.getElementById('telegramBtn').href = `https://t.me/DesiTease_2?text=${encodedMessage}`;
}

// Generate Floating Particles
function createParticles() {
    const container = document.getElementById('particlesContainer');
    const particleCount = window.innerWidth < 768 ? 20 : 40;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const size = Math.random() * 8 + 3;
        const left = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 5;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;

        container.appendChild(particle);
    }
}

// Confetti Effect on Load
function triggerConfetti() {
    const colors = ['#00d2ff', '#00ff9d', '#ffd700', '#a855f7'];
    const confettiCount = window.innerWidth < 768 ? 30 : 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.opacity = '0.8';
        confetti.style.zIndex = '9999';
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';

        document.body.appendChild(confetti);

        const targetY = window.innerHeight + 50;
        const targetX = (Math.random() - 0.5) * 200;
        const rotation = Math.random() * 720;
        const duration = Math.random() * 2000 + 2000;

        confetti.animate([
            {
                transform: 'translateY(0) translateX(0) rotate(0deg)',
                opacity: 0.8
            },
            {
                transform: `translateY(${targetY}px) translateX(${targetX}px) rotate(${rotation}deg)`,
                opacity: 0
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        setTimeout(() => confetti.remove(), duration);
    }
}

// Button Ripple Effect
function addRippleEffect() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.width = '0';
            ripple.style.height = '0';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.5)';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.pointerEvents = 'none';
            ripple.style.zIndex = '1000';

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            ripple.animate([
                {
                    width: '0px',
                    height: '0px',
                    opacity: 1
                },
                {
                    width: '300px',
                    height: '300px',
                    opacity: 0
                }
            ], {
                duration: 600,
                easing: 'ease-out'
            });

            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
    loadOrder();
    createParticles();
    setTimeout(triggerConfetti, 300);
    addRippleEffect();

    console.log('🔥 DesiTease Success Page Loaded with Order Details!');
});
