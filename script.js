// ========================================
//   DESITEASE - FINAL VERSION V2
//   Collapsible How It Works restored
// ========================================

const allPacks = [
    // TOP PICS (3 packs) - Total ₹391, Bundle ₹312 (20% OFF)
    { id: 'mms', name: 'Viral MMS Pack', price: 149, oldPrice: 223, img: 'viral-mms.webp', type: '📱 VIDEO', cat: 'cat1', desc: 'The most explosive leaked content. Real clips of actresses, influencers, college girls, hotel scandals, and private moments.', size: '2,500+ Videos', quality: '4K HD', duration: 'Weekly Updates' },
    { id: 'audio', name: 'Audio Erotica', price: 139, oldPrice: 208, img: 'audio-erotica.webp', type: '🎧 AUDIO', cat: 'cat1', desc: 'Seductive audio stories and ASMR that will ignite your senses. Perfect for late-night fantasies.', size: '1,200+ Audios', quality: 'HD Audio', duration: 'Monthly Updates' },
    { id: 'pdf', name: 'PDF Stories Pack', price: 103, oldPrice: 154, img: 'pdf-stories.webp', type: '📖 TEXT', cat: 'cat1', desc: 'Massive collection of 15,000 explicit text stories across Hindi, English, Punjabi, and Urdu. Every fantasy you\'ve ever imagined.', size: '15,000+ Stories', quality: 'Multi-Language', duration: 'Lifetime Access' },

    // PREMIUM VAULT (4 packs) - Total ₹856, Bundle ₹684 (20% OFF)
    { id: 'actress', name: 'Actress Exclusives', price: 349, oldPrice: 523, img: 'actress.webp', type: '🍿 PREMIUM', cat: 'cat2', electric: 'purple', desc: 'Ultimate celebrity fantasy pack. Deepfakes of top Bollywood actresses, leaked content, cum tributes in 4K HD.', size: '3,500+ Videos', quality: '4K Ultra HD', duration: 'Daily Updates' },
    { id: 'bbc', name: 'BBC Collection', price: 189, oldPrice: 283, img: 'bbc-guy.webp', type: '🖤 NICHE', cat: 'cat2', desc: 'Exclusive interracial content featuring the most intense BBC action. Premium quality guaranteed.', size: '1,500+ Videos', quality: '4K UHD', duration: 'Weekly Updates' },
    { id: 'animated', name: 'Animated Pack', price: 169, oldPrice: 253, img: 'animated-pack.webp', type: '🎨 3D', cat: 'cat2', desc: 'Premium animated adult content featuring top-tier 3D animations and exclusive artwork.', size: '800+ Videos', quality: '4K 60fps', duration: 'Bi-weekly Updates' },
    { id: 'ai', name: 'SoulMate AI App', price: 149, oldPrice: 223, img: 'ai-app.webp', type: '🤖 APP', cat: 'cat2', desc: 'Your personal AI companion for intimate conversations, roleplay, and unlimited fantasy exploration.', size: 'Unlimited Chats', quality: 'AI Powered', duration: '1 Year Premium' },

    // DARK VAULT (3 packs) - Total ₹678, Bundle ₹542 (20% OFF)
    { id: 'secret', name: 'Secret Vault', price: 260, oldPrice: 390, img: 'secret-vault.webp', type: '🔐 VIP', cat: 'cat3', electric: 'crimson', desc: 'Our most heavily guarded collection. Extreme scenes, banned content, darkest fantasies. VIP access required.', size: '5,000+ Videos', quality: '4K UHD', duration: 'Daily Updates' },
    { id: 'incest', name: 'Incest Vault', price: 219, oldPrice: 328, img: 'incest-vault.webp', type: '⚡ TABOO', cat: 'cat3', desc: 'Taboo family fantasies brought to life. The forbidden content you\'ve been searching for.', size: '1,800+ Videos', quality: '4K HD', duration: 'Weekly Updates' },
    { id: 'spy', name: 'Spy Cam Vault', price: 199, oldPrice: 298, img: 'spy-cam.webp', type: '📹 HIDDEN', cat: 'cat3', desc: 'Hidden camera footage from changing rooms, hotels, and private locations. Real authentic moments.', size: '2,000+ Videos', quality: 'HD Quality', duration: 'Daily Updates' }
];

const categoryBundles = {
    cat1: { name: 'Top Pics Bundle', price: 312, discount: 0.20 },
    cat2: { name: 'Premium Vault Bundle', price: 684, discount: 0.20 },
    cat3: { name: 'Dark Vault Bundle', price: 542, discount: 0.20 }
};

const megaBundle = { price: 1499, discount: 0.22 };

let cart = [];

// GSAP MARQUEE - OPTIMIZED
function initMarquee() {
    const track = document.getElementById('marqueeTrack');
    const marqueeData = [...allPacks, ...allPacks, ...allPacks];

    track.innerHTML = marqueeData.map(p => `
        <div class="marquee-card" onclick="showDetail('${p.id}')">
            <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/280x360/1a1a24/00d2ff?text=${p.name}'">
            <div class="marquee-overlay">
                <h3>${p.name}</h3>
                <div class="price">₹${p.price}</div>
            </div>
        </div>
    `).join('');

    const cardWidth = window.innerWidth < 768 ? 195 : 300;
    const totalWidth = cardWidth * allPacks.length;

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'none' } });
    tl.to(track, { x: -totalWidth, duration: 40, ease: 'none' });

    track.addEventListener('mouseenter', () => tl.pause());
    track.addEventListener('mouseleave', () => tl.play());

    let isDragging = false, startX = 0, scrollLeft = 0;

    track.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - track.offsetLeft;
        scrollLeft = gsap.getProperty(track, 'x');
        tl.pause();
    });

    track.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 1.5;
        gsap.set(track, { x: scrollLeft + walk });
    });

    track.addEventListener('mouseup', () => { isDragging = false; tl.play(); });
    track.addEventListener('mouseleave', () => { if (isDragging) { isDragging = false; tl.play(); } });
}

function renderGrids() {
    ['cat1', 'cat2', 'cat3'].forEach(cat => {
        const packs = allPacks.filter(p => p.cat === cat);
        const grid = document.getElementById(`grid${cat.charAt(0).toUpperCase() + cat.slice(1)}`);

        grid.innerHTML = packs.map(p => {
            const electricClass = p.electric ? `electric-${p.electric}` : '';
            return `
                <div class="card ${electricClass}">
                    <div class="card-img-wrap" onclick="event.stopPropagation(); showDetail('${p.id}')">
                        <img src="${p.img}" class="card-img" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300/1a1a24/00d2ff?text=${p.name}'">
                        <div class="type-badge">${p.type}</div>
                        <div class="card-info-icon">
                            <i class="fas fa-info"></i>
                        </div>
                    </div>
                    <div class="card-body" onclick="toggleCart('${p.id}')">
                        <div class="card-name">${p.name}</div>
                        <div class="card-text">${p.desc}</div>
                        <div class="card-price-row">
                            <div class="price-block">
                                <div class="old-price">₹${p.oldPrice}</div>
                                <div class="price">₹${p.price}</div>
                            </div>
                            <button class="btn-add" onclick="event.stopPropagation(); toggleCart('${p.id}')" id="btn-${p.id}">
                                <i class="fas fa-shopping-cart"></i> <span>BUY</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });
}

function toggleCart(id) {
    const pack = allPacks.find(p => p.id === id);
    const idx = cart.findIndex(c => c.id === id);
    idx > -1 ? cart.splice(idx, 1) : cart.push(pack);
    updateUI();
}

function addCategoryBundle(cat) {
    const packs = allPacks.filter(p => p.cat === cat);
    const allInCart = packs.every(p => cart.some(c => c.id === p.id));

    if (allInCart) {
        packs.forEach(p => {
            const idx = cart.findIndex(c => c.id === p.id);
            if (idx > -1) cart.splice(idx, 1);
        });
    } else {
        packs.forEach(p => {
            if (!cart.some(c => c.id === p.id)) {
                cart.push(p);
            }
        });
    }
    updateUI();
}

function addMegaBundleAndCheckout() {
    cart = [...allPacks];
    updateUI();
    openCheckout();
}

function calculateTotal() {
    if (cart.length === 0) return 0;

    if (cart.length === 10) {
        return megaBundle.price;
    }

    let total = 0;
    let processedIds = [];

    ['cat1', 'cat2', 'cat3'].forEach(cat => {
        const catPacks = allPacks.filter(p => p.cat === cat);
        const catPackIds = catPacks.map(p => p.id);
        const allCatInCart = catPackIds.every(id => cart.some(c => c.id === id));

        if (allCatInCart) {
            total += categoryBundles[cat].price;
            processedIds.push(...catPackIds);
        }
    });

    cart.forEach(item => {
        if (!processedIds.includes(item.id)) {
            total += item.price;
        }
    });

    return total;
}

function updateUI() {
    allPacks.forEach(p => {
        const btn = document.getElementById(`btn-${p.id}`);
        if (btn) {
            if (cart.some(c => c.id === p.id)) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-check"></i> <span>ADDED</span>';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fas fa-shopping-cart"></i> <span>BUY</span>';
            }
        }
    });

    ['cat1', 'cat2', 'cat3'].forEach(cat => {
        const btn = document.getElementById(`${cat}-btn`);
        const packs = allPacks.filter(p => p.cat === cat);
        const allInCart = packs.every(p => cart.some(c => c.id === p.id));

        if (btn) {
            if (allInCart) {
                btn.classList.add('added');
                btn.innerHTML = '<i class="fas fa-check"></i> <span>ADDED</span>';
            } else {
                btn.classList.remove('added');
                const bundlePrice = categoryBundles[cat].price;
                btn.innerHTML = `<span class="discount-badge">20% OFF</span> <span>Buy All ₹${bundlePrice}</span>`;
            }
        }
    });

    const stickyCart = document.getElementById('stickyCart');
    const stickyTotal = document.getElementById('stickyTotal');
    const headerCartCount = document.getElementById('headerCartCount');

    if (cart.length > 0) {
        const total = calculateTotal();
        stickyCart.style.display = 'flex';
        stickyTotal.textContent = `₹${total}`;
        headerCartCount.textContent = cart.length;
    } else {
        stickyCart.style.display = 'none';
        headerCartCount.textContent = '0';
    }
}

function clearCart() {
    cart = [];
    updateUI();
}

function showDetail(id) {
    const pack = allPacks.find(p => p.id === id);
    if (!pack) return;

    document.getElementById('dImg').src = pack.img;
    document.getElementById('dTitle').textContent = pack.name;
    document.getElementById('dDesc').textContent = pack.desc;
    document.getElementById('dSpecs').innerHTML = `
        <div class="spec-item"><div class="spec-label">SIZE</div><div class="spec-val">${pack.size}</div></div>
        <div class="spec-item"><div class="spec-label">QUALITY</div><div class="spec-val">${pack.quality}</div></div>
        <div class="spec-item"><div class="spec-label">UPDATES</div><div class="spec-val">${pack.duration}</div></div>
        <div class="spec-item"><div class="spec-label">PRICE</div><div class="spec-val">₹${pack.price}</div></div>
    `;
    document.getElementById('detailModal').style.display = 'flex';
}

function closeDetail() {
    document.getElementById('detailModal').style.display = 'none';
}

function openCheckout() {
    if (cart.length === 0) { alert('Your cart is empty! Add some packs first.'); return; }

    const total = calculateTotal();
    document.getElementById('checkoutTotal').textContent = total;
    document.getElementById('orderList').innerHTML = cart.map(p => `
        <div class="summary-item"><span>${p.name}</span><span>₹${p.price}</span></div>
    `).join('');

    if (cart.length === 10) {
        document.getElementById('orderList').innerHTML += `
            <div class="summary-item" style="color: #00ff9d; font-weight: 900;">
                <span>🔥 MEGA BUNDLE DISCOUNT</span><span>-₹426</span>
            </div>
        `;
    }

    document.getElementById('checkoutModal').style.display = 'flex';
}

function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function setPay(method) {
    document.querySelectorAll('.co-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.co-section').forEach(s => s.classList.remove('active'));
    event.target.closest('.co-tab').classList.add('active');
    document.getElementById(`pay-${method}`).classList.add('active');
}

function copyAddress() {
    navigator.clipboard.writeText('TLquccw7uU4A6fTJekDsrsQbJEvnFv1eTD').then(() => alert('USDT address copied!'));
}

function saveOrderData() {
    document.getElementById('formItems').value = cart.map(p => p.name).join(', ');
    document.getElementById('formAmount').value = calculateTotal();
}

// TOGGLE HOW IT WORKS COLLAPSIBLE
function toggleHowItWorks() {
    const content = document.getElementById('collapseContent');
    const header = document.querySelector('.how-collapse-header');
    content.classList.toggle('active');
    header.classList.toggle('active');
}

window.addEventListener('scroll', () => {
    const header = document.getElementById('mainHeader');
    header.classList.toggle('scrolled', window.scrollY > 100);
});

document.addEventListener('DOMContentLoaded', () => {
    initMarquee();
    renderGrids();
    updateUI();
});