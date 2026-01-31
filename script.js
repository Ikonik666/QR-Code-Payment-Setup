// ========================================
// DESITEASE - SMART PRICING SYSTEM
// ========================================

const allPacks = [
    // TOP PICKS (3 packs) - ORANGE - Total: 391, Bundle: 313 (20% OFF)
    {
        id: 'pdf',
        name: 'PDF Stories Pack',
        price: 103,
        oldPrice: 139,
        img: 'pdf-stories.webp',
        type: '📖 TEXT',
        cat: 'cat1',
        color: 'orange',
        desc: 'Best seller. Read thousands of hot stories anywhere.',
        fullDesc: 'Huge collection. 40,000+ text stories. Simple English, Hindi, Punjabi and Urdu. Read about Bhabhi, Neighbors and more.',
        specs: [
            { label: 'FILES', value: '40,000+' },
            { label: 'FORMAT', value: 'PDF/Text' },
            { label: 'LANGUAGE', value: 'Hindi/Eng' },
            { label: 'ACCESS', value: 'Lifetime' }
        ]
    },
    {
        id: 'audio',
        name: 'Audio Erotica',
        price: 139,
        oldPrice: 189,
        img: 'audio-erotica.webp',
        type: '🎧 AUDIO',
        cat: 'cat1',
        color: 'orange',
        desc: 'Sex stories in Hindi, Punjabi, English. Put on headphones.',
        fullDesc: 'Audio sex stories in Hindi, Punjabi, English, Urdu. Clear sound. Hear real Indian voices enjoying.',
        specs: [
            { label: 'HOURS', value: '3000+' },
            { label: 'AUDIO', value: 'HQ Stereo' },
            { label: 'LANGUAGE', value: 'Hindi/Puj' },
            { label: 'UPDATES', value: 'Weekly' }
        ]
    },
    {
        id: 'mms',
        name: 'Viral MMS Pack',
        price: 149,
        oldPrice: 199,
        img: 'viral-mms.webp',
        type: '📱 VIDEO',
        cat: 'cat1',
        color: 'orange',
        desc: 'Real leaked videos from colleges and hotels. Unfiltered.',
        fullDesc: 'Videos leaked from phones. Real Indian girls in hostels, hotels and colleges. Very raw.',
        specs: [
            { label: 'VIDEOS', value: '50,000+' },
            { label: 'SOURCE', value: 'Leaked' },
            { label: 'TYPE', value: 'Raw/Real' },
            { label: 'REGION', value: 'Pan India' }
        ]
    },

    // PREMIUM VAULT (4 packs) - PURPLE - Total: 856, Bundle: 685 (20% OFF)
    {
        id: 'ai',
        name: 'SoulMate AI App',
        price: 149,
        oldPrice: 223,
        img: 'ai-app.webp',
        type: '🤖 APP',
        cat: 'cat2',
        color: 'purple',
        desc: 'Unlimited roleplay characters. Create your fantasy, no filters.',
        fullDesc: 'Unlimited roleplay characters. Create your fantasy, no filters. AI powered chatbot with no restrictions.',
        specs: [
            { label: 'PLATFORM', value: 'iOS/Android' },
            { label: 'CHARS', value: 'Unlimited' },
            { label: 'MODE', value: 'Uncensored' },
            { label: 'ACCESS', value: 'Lifetime' }
        ]
    },
    {
        id: 'animated',
        name: 'Animated Pack',
        price: 169,
        oldPrice: 229,
        img: 'animated-pack.webp',
        type: '🎨 3D',
        cat: 'cat2',
        color: 'purple',
        desc: '3D Hentai and comics. Fantasy uncensored.',
        fullDesc: 'Cartoons and 3D videos. Like Savita Bhabhi but video. Full color and HD quality.',
        specs: [
            { label: 'STYLE', value: '3D/2D' },
            { label: 'QUALITY', value: '1080p HD' },
            { label: 'CENSORED', value: 'No' },
            { label: 'CONTENT', value: 'Fantasy' }
        ]
    },
    {
        id: 'bbc',
        name: 'BBC Collection',
        price: 189,
        oldPrice: 249,
        img: 'bbc-guy.webp',
        type: '🖤 NICHE',
        cat: 'cat2',
        color: 'purple',
        desc: 'Powerful dominance. Black men with Indian girls.',
        fullDesc: '1000+ exclusive full-length scenes featuring powerful BBC dominance over innocent Indian girls.',
        specs: [
            { label: 'VIDEOS', value: '1000+' },
            { label: 'THEME', value: 'Blacked' },
            { label: 'FOCUS', value: 'Hardcore' },
            { label: 'LENGTH', value: 'Full Scenes' }
        ]
    },
    {
        id: 'actress',
        name: 'Actress Exclusives',
        price: 349,
        oldPrice: 523,
        img: 'actress.webp',
        type: '🍿 PREMIUM',
        cat: 'cat2',
        color: 'purple',
        desc: 'Deepfakes, leaks & cum tributes of top Indian actresses - HD.',
        fullDesc: 'Deepfakes, leaks & cum tributes of top Indian actresses. High quality HD content featuring Bollywood stars.',
        specs: [
            { label: 'QUALITY', value: '4K HD' },
            { label: 'TYPE', value: 'Deepfake+Real' },
            { label: 'STARS', value: 'Top 650+' },
            { label: 'TRIBUTES', value: 'Included' }
        ]
    },

    // DARK VAULT (3 packs) - CRIMSON - Total: 678, Bundle: 542 (20% OFF)
    {
        id: 'spy',
        name: 'Spy Cam Vault',
        price: 199,
        oldPrice: 269,
        img: 'spy-cam.webp',
        type: '📹 HIDDEN',
        cat: 'cat3',
        color: 'crimson',
        desc: 'Hidden camera footage from changing rooms and hotels.',
        fullDesc: 'Cameras hidden in rooms. Watch girls changing clothes without them knowing. Very secret.',
        specs: [
            { label: 'TYPE', value: 'Hidden Cam' },
            { label: 'LOCATIONS', value: 'Hotels/Rooms' },
            { label: 'VIBE', value: 'Voyeur' },
            { label: 'RARITY', value: 'High' }
        ]
    },
    {
        id: 'incest',
        name: 'Incest Vault',
        price: 219,
        oldPrice: 289,
        img: 'incest-vault.webp',
        type: '⚡ TABOO',
        cat: 'cat3',
        color: 'crimson',
        desc: 'Forbidden family secrets. Taboo videos and stories.',
        fullDesc: 'Family secret videos. Brothers, sisters, moms. The things you cannot tell anyone.',
        specs: [
            { label: 'THEME', value: 'Family' },
            { label: 'TABOO', value: 'Extreme' },
            { label: 'MEDIA', value: 'Video/Text' },
            { label: 'DEMAND', value: 'High' }
        ]
    },
    {
        id: 'secret',
        name: 'Secret Vault',
        price: 260,
        oldPrice: 349,
        img: 'secret-vault.webp',
        type: '🔐 VIP',
        cat: 'cat3',
        color: 'crimson',
        desc: 'Extreme content. Not for everyone.',
        fullDesc: 'The most dangerous collection. Content that is too hot. Only for people who want everything.',
        specs: [
            { label: 'STATUS', value: 'VIP' },
            { label: 'CONTENT', value: 'Unlisted' },
            { label: 'RISK', value: 'High' },
            { label: 'ACCESS', value: 'Restricted' }
        ]
    }
];

// Calculate bundle prices dynamically
function calculateBundlePrices() {
    const bundles = {};
    ['cat1', 'cat2', 'cat3'].forEach(cat => {
        const catPacks = allPacks.filter(p => p.cat === cat);
        const totalPrice = catPacks.reduce((sum, p) => sum + p.price, 0);
        const discountPercent = 0.20;
        const discountedPrice = Math.round(totalPrice * (1 - discountPercent));
        
        bundles[cat] = {
            price: discountedPrice,
            originalPrice: totalPrice,
            discount: discountPercent,
            count: catPacks.length
        };
    });
    return bundles;
}

const categoryBundles = calculateBundlePrices();
const megaBundle = {
    price: 1348,
    originalPrice: 1925,
    discount: 0.30
};

let cart = [];

// SMART PRICING CALCULATION
function calculateSmartPrice() {
    if (cart.length === 0) return 0;
    
    // Check if all 10 packs are in cart (AUTO MEGA BUNDLE)
    if (cart.length === 10) {
        const allPackIds = allPacks.map(p => p.id).sort();
        const cartPackIds = cart.map(p => p.id).sort();
        const hasAllPacks = JSON.stringify(allPackIds) === JSON.stringify(cartPackIds);
        
        if (hasAllPacks) {
            return megaBundle.price;
        }
    }
    
    // Calculate price by category bundles and individual packs
    let total = 0;
    const processedPacks = new Set();
    
    // Check each category for bundle
    ['cat1', 'cat2', 'cat3'].forEach(cat => {
        const catPacks = allPacks.filter(p => p.cat === cat);
        const catPacksInCart = cart.filter(p => p.cat === cat);
        const catBundledPacks = catPacksInCart.filter(p => p.bundledIn === cat);
        
        // If all packs from this category are in cart AND marked as bundled
        if (catBundledPacks.length === catPacks.length) {
            total += categoryBundles[cat].price;
            catPacksInCart.forEach(p => processedPacks.add(p.id));
        } else {
            catPacksInCart.forEach(p => {
                if (!processedPacks.has(p.id)) {
                    total += p.price;
                    processedPacks.add(p.id);
                }
            });
        }
    });
    
    return total;
}

// Update bundle button text
function updateBundleButtons() {
    const cat1Discount = Math.round(categoryBundles.cat1.discount * 100);
    const cat2Discount = Math.round(categoryBundles.cat2.discount * 100);
    const cat3Discount = Math.round(categoryBundles.cat3.discount * 100);

    document.getElementById('cat1BundleText').textContent = 
        `SAVE ${cat1Discount}% · Bundle: ₹${categoryBundles.cat1.price}`;
    document.getElementById('cat2BundleText').textContent = 
        `SAVE ${cat2Discount}% · Bundle: ₹${categoryBundles.cat2.price}`;
    document.getElementById('cat3BundleText').textContent = 
        `SAVE ${cat3Discount}% · Bundle: ₹${categoryBundles.cat3.price}`;
}

// RENDER PACKS
function renderPacks() {
    ['cat1', 'cat2', 'cat3'].forEach(cat => {
        const container = document.getElementById(cat);
        const packs = allPacks.filter(p => p.cat === cat);

        container.innerHTML = packs.map(p => {
            const inCart = cart.find(c => c.id === p.id);
            const colorClass = `cat-${p.color}`;

            return `
                <div class="card ${colorClass}" data-id="${p.id}">
                    <div class="card-img-wrap" onclick="showDetail('${p.id}')">
                        <img src="${p.img}" class="card-img" alt="${p.name}">
                        <span class="type-badge">${p.type}</span>
                        <span class="card-info-icon">INFO</span>
                    </div>
                    <div class="card-body" onclick="showDetail('${p.id}')">
                        <div class="card-name">${p.name}</div>
                        <div class="card-text">${p.desc}</div>
                        <div class="card-price-row">
                            <div class="price-block">
                                <div class="old-price">₹${p.oldPrice}</div>
                                <div class="price">₹${p.price}</div>
                            </div>
                            <button class="btn-add ${inCart ? 'active' : ''}" 
                                    onclick="event.stopPropagation(); toggleCart('${p.id}')">
                                <i class="fas ${inCart ? 'fa-check' : 'fa-shopping-cart'}"></i>
                                <span>${inCart ? 'ADDED' : 'ADD'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });
}

// TOGGLE CART - Individual add (NO bundle)
function toggleCart(id) {
    const pack = allPacks.find(p => p.id === id);
    const inCart = cart.find(c => c.id === id);

    if (inCart) {
        cart = cart.filter(c => c.id !== id);
    } else {
        cart.push({ ...pack, bundledIn: null });
    }

    updateCart();
    renderPacks();
}

// UPDATE CART
function updateCart() {
    const stickyCart = document.getElementById('stickyCart');
    const cartItemsText = document.getElementById('cartItemsText');
    const cartTotalText = document.getElementById('cartTotalText');

    if (cart.length === 0) {
        stickyCart.style.display = 'none';
        return;
    }

    stickyCart.style.display = 'flex';
    const total = calculateSmartPrice();
    
    cartItemsText.textContent = `${cart.length} item${cart.length > 1 ? 's' : ''}`;
    cartTotalText.textContent = `Total: ₹${total}`;
}

// SHOW DETAIL MODAL
function showDetail(id) {
    const pack = allPacks.find(p => p.id === id);
    const modal = document.getElementById('detailModal');
    const detailBox = modal.querySelector('.detail-box');
    
    detailBox.setAttribute('data-pack-id', pack.id);
    
    document.getElementById('detailImg').src = pack.img;
    document.getElementById('detailName').textContent = pack.name;
    document.getElementById('detailDesc').textContent = pack.fullDesc;

    const specsHTML = pack.specs.map(s => `
        <div class="spec-item">
            <div class="spec-label">${s.label}</div>
            <div class="spec-val">${s.value}</div>
        </div>
    `).join('');
    document.getElementById('detailSpecs').innerHTML = specsHTML;

    modal.style.display = 'flex';
}

// ADD CATEGORY BUNDLE - Marks as bundled
document.querySelectorAll('.cat-bundle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        const catPacks = allPacks.filter(p => p.cat === cat);

        cart = cart.filter(p => p.cat !== cat);

        catPacks.forEach(pack => {
            cart.push({ ...pack, bundledIn: cat });
        });

        updateCart();
        renderPacks();
    });
});

// MEGA BUNDLE - Add all with mega flag
// MEGA BUNDLE - Add all with mega flag AND open checkout
document.getElementById('megaBundleCard').addEventListener('click', () => {
    cart = allPacks.map(p => ({ ...p, bundledIn: 'mega' }));
    updateCart();
    renderPacks();
    
    // Open checkout modal automatically
    setTimeout(() => {
        document.getElementById('checkoutBtn').click();
    }, 300);
});

document.getElementById('megaCTABtn').addEventListener('click', (e) => {
    e.stopPropagation();
    cart = allPacks.map(p => ({ ...p, bundledIn: 'mega' }));
    updateCart();
    renderPacks();
    
    // Open checkout modal automatically
    setTimeout(() => {
        document.getElementById('checkoutBtn').click();
    }, 300);
});


// ✅ CHECKOUT MODAL (WITH LOCALSTORAGE SAVE)
document.getElementById('checkoutBtn').addEventListener('click', () => {
    const orderSummary = document.getElementById('orderSummary');
    const coCartTotal = document.getElementById('coCartTotal');

    if (cart.length === 0) {
        orderSummary.innerHTML = '<p style="text-align: center; padding: 20px;">Your cart is empty</p>';
        coCartTotal.textContent = 'Payable Amount: ₹0';
        return;
    }

    const total = calculateSmartPrice();
    
    // ✅ SAVE ORDER DATA TO LOCALSTORAGE (THIS IS THE KEY!)
    const orderData = {
        items: cart.map(item => ({ 
            id: item.id, 
            name: item.name, 
            price: item.price 
        })),
        total: total,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('orderData', JSON.stringify(orderData));
    
    // Check if it's a mega bundle (all 10 packs)
    if (cart.length === 10) {
        const allPackIds = allPacks.map(p => p.id).sort();
        const cartPackIds = cart.map(p => p.id).sort();
        const hasAllPacks = JSON.stringify(allPackIds) === JSON.stringify(cartPackIds);
        
        if (hasAllPacks) {
            orderSummary.innerHTML = `
                <div class="summary-item">
                    <span>MEGA BUNDLE (All 10 Packs)</span>
                    <span>₹${megaBundle.price}</span>
                </div>
                <div class="bundle-tag">🎉 You saved ₹${megaBundle.originalPrice - megaBundle.price}!</div>
            `;
            coCartTotal.textContent = `Payable Amount: ₹${megaBundle.price}`;
            document.getElementById('checkoutModal').style.display = 'flex';
            return;
        }
    }
    
    // Build detailed breakdown
    let summaryHTML = '';
    const processedPacks = new Set();
    let totalSavings = 0;
    
    ['cat1', 'cat2', 'cat3'].forEach(cat => {
        const catPacks = allPacks.filter(p => p.cat === cat);
        const catPacksInCart = cart.filter(p => p.cat === cat);
        const catBundledPacks = catPacksInCart.filter(p => p.bundledIn === cat);
        
        if (catBundledPacks.length === catPacks.length) {
            const bundleData = categoryBundles[cat];
            const catName = cat === 'cat1' ? 'Top Picks' : cat === 'cat2' ? 'Premium Vault' : 'Dark Vault';
            summaryHTML += `
                <div class="summary-item">
                    <span>${catName} Bundle (${catPacks.length} packs)</span>
                    <span>₹${bundleData.price}</span>
                </div>
            `;
            totalSavings += bundleData.originalPrice - bundleData.price;
            catPacksInCart.forEach(p => processedPacks.add(p.id));
        } else {
            catPacksInCart.forEach(p => {
                if (!processedPacks.has(p.id)) {
                    summaryHTML += `
                        <div class="summary-item">
                            <span>${p.name}</span>
                            <span>₹${p.price}
                                <span class="summary-remove" onclick="removeFromCheckout('${p.id}')">×</span>
                            </span>
                        </div>
                    `;
                    processedPacks.add(p.id);
                }
            });
        }
    });
    
    if (totalSavings > 0) {
        summaryHTML += `<div class="bundle-tag">🎉 You saved ₹${totalSavings}!</div>`;
    }
    
    orderSummary.innerHTML = summaryHTML;
    coCartTotal.textContent = `Payable Amount: ₹${total}`;
    document.getElementById('checkoutModal').style.display = 'flex';
});

// REMOVE FROM CHECKOUT
function removeFromCheckout(id) {
    cart = cart.filter(c => c.id !== id);
    updateCart();
    renderPacks();
    if (cart.length === 0) {
        document.getElementById('checkoutModal').style.display = 'none';
    } else {
        document.getElementById('checkoutBtn').click();
    }
}

// CLEAR CART
document.getElementById('cartClearBtnInside').addEventListener('click', (e) => {
    e.stopPropagation();
    cart = [];
    updateCart();
    renderPacks();
});

// CLOSE MODALS
document.getElementById('detailCloseBtn').addEventListener('click', () => {
    document.getElementById('detailModal').style.display = 'none';
});

document.getElementById('checkoutCloseX').addEventListener('click', () => {
    document.getElementById('checkoutModal').style.display = 'none';
});

// CHECKOUT TABS
document.querySelectorAll('.co-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.co-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.co-section').forEach(s => s.classList.remove('active'));
        
        tab.classList.add('active');
        const section = tab.getAttribute('data-tab') + 'Section';
        document.getElementById(section).classList.add('active');
    });
});

// COPY CRYPTO ADDRESS
function copyAddress() {
    const address = 'TLquccw7uU4A6fTJekDsrsQbJEvnFv1eTD';
    navigator.clipboard.writeText(address);
    alert('Address copied!');
}

// ✅ REDIRECT TO SUCCESS PAGE (FOR TESTING OR AFTER PAYMENT)
function redirectToSuccess() {
    // Make sure order data is saved
    if (cart.length > 0) {
        const total = calculateSmartPrice();
        const orderData = {
            items: cart.map(item => ({ 
                id: item.id, 
                name: item.name, 
                price: item.price 
            })),
            total: total,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('orderData', JSON.stringify(orderData));
    }
    
    // Redirect to success page
    window.location.href = 'success.html';
}

// INIT
updateBundleButtons();
renderPacks();

// Crypto Accordion Toggle
document.querySelectorAll('.crypto-main').forEach(crypto => {
    crypto.addEventListener('click', function(e) {
        // Don't toggle if clicking on a network button
        if (e.target.closest('.network-btn')) return;
        
        this.classList.toggle('expanded');
    });
});

// Copy Crypto Address Function
function copyCrypto(cryptoName, address) {
    navigator.clipboard.writeText(address).then(() => {
        const notif = document.getElementById('copyNotif');
        const text = document.getElementById('copyText');
        text.innerText = cryptoName;
        notif.classList.add('show');
        
        setTimeout(() => {
            notif.classList.remove('show');
        }, 2500);
    }).catch(err => {
        alert('Failed to copy. Address: ' + address);
    });
}
