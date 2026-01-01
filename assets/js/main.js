// Time Rush — UI + Pages

(function(){
  const $ = (q, el=document)=> el.querySelector(q);
  const $$ = (q, el=document)=> Array.from(el.querySelectorAll(q));

  // polyfill: matches/closest (older mobile browsers)
  if(!Element.prototype.matches){
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector || function(s){
      var m = (this.document || this.ownerDocument).querySelectorAll(s), i = m.length;
      while(--i >= 0 && m.item(i) !== this) {}
      return i > -1;
    };
  }
  if(!Element.prototype.closest){
    Element.prototype.closest = function(s){
      var el = this;
      while(el && el.nodeType === 1){
        if(el.matches(s)) return el;
        el = el.parentElement || el.parentNode;
      }
      return null;
    };
  }

  const IMG_FALLBACK = 'assets/images/logo-mark.png';
  function applyImgFallback(img){
    if(!img) return;
    img.addEventListener('error', ()=>{
      if(img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = '1';
      img.src = IMG_FALLBACK;
    });
  }


  function setText(id, value){
    const el = document.getElementById(id);
    if(el) el.textContent = value;
  }

  function escapeHtml(str){
    // Broad compatibility (avoids String.prototype.replaceAll)
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/\"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  // Category helper (supports single category or categories array)
  function hasCat(p, cat){
    const c = String(cat||'').trim().toLowerCase();
    if(!c) return false;
    if(p && Array.isArray(p.categories)) return p.categories.map(x=>String(x||'').trim().toLowerCase()).includes(c);
    return String((p && p.category) || '').trim().toLowerCase() === c;
  }

  function renderHeader(){
    const s = TR.loadSettings();
    $$('[data-bind="storeName"]').forEach(el=>{ el.textContent = s.storeName; });
    $$('[data-bind="tagline"]').forEach(el=>{ el.textContent = s.tagline; });
    // Contact email
    $$('[data-bind="contactEmail"]').forEach(el=>{ el.textContent = s.contactEmail; el.href = `mailto:${s.contactEmail}`; });
  }

  function toast(msg){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=> t.classList.add('show'), 20);
    setTimeout(()=>{
      t.classList.remove('show');
      setTimeout(()=>t.remove(), 250);
    }, 2200);
  }

  function setBadge(id, value){
    const el = document.getElementById(id);
    if(!el) return;
    el.textContent = value;
    el.style.display = value === '0' ? 'none' : 'inline-flex';
  }

  function updateCartCount(){
    const cart = TR.loadCart();
    const count = String(TR.cartCount(cart));
    setBadge('cartCount', count);
    setBadge('cartCountDock', count);
  }

  function syncScrollLock(){
    var cd = $('#cartDrawer');
    var qv = $('#qvModal');
    var mm = $('#mobileMenu');
    const anyOpen =
      (cd && cd.getAttribute('aria-hidden') === 'false') ||
      (qv && qv.getAttribute('aria-hidden') === 'false') ||
      (mm && mm.getAttribute('aria-hidden') === 'false');
    document.body.classList.toggle('no-scroll', anyOpen);
  }

  function renderMobileDock(){
    const page = document.body.getAttribute('data-page');
    if(!page) return;

    const dock = document.createElement('nav');
    dock.className = 'mobile-dock';
    dock.setAttribute('aria-label','Mobile navigation');
    dock.innerHTML = `
      <a class="dock-item" data-dock="home" href="index.html">
        <svg class="ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
        <span>Home</span>
      </a>
      <a class="dock-item" data-dock="shop" href="shop.html">
        <svg class="ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 7h12l-1 14H7L6 7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M9 7a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Shop</span>
      </a>
      <button class="dock-item" data-dock="cart" type="button" data-action="cart-open" aria-label="Open cart">
        <svg class="ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
          <path d="M6 6 4 3H2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
          <circle cx="9" cy="20" r="1.35" fill="currentColor"/>
          <circle cx="18" cy="20" r="1.35" fill="currentColor"/>
        </svg>
        <span>Cart</span>
        <span class="dock-badge" id="cartCountDock">0</span>
      </button>
      <button class="dock-item" data-dock="menu" type="button" data-action="nav-open" aria-label="Open menu">
        <svg class="ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Menu</span>
      </button>
    `;

    document.body.appendChild(dock);
    document.body.classList.add('has-dock');

    const map = { home:'home', shop:'shop', product:'shop', cart:'cart', checkout:'cart' };
    const active = map[page] || 'home';
    var _a = dock.querySelector(`[data-dock="${active}"]`); if(_a) _a.classList.add('is-active');
  }

  function productCard(p){
    const sale = p.compareAtPrice && p.compareAtPrice > p.price;
    const pct = sale ? TR.discountPercent(p) : 0;

    const badge = p.badge
      ? `<span class="badge">${escapeHtml(p.badge)}</span>`
      : (sale ? `<span class="badge">Sale</span>` : '');

    const salePill = pct > 0
      ? `<span class="badge badge-right badge-sale">-${pct}%</span>`
      : '';
    const price = `<span class="price">${TR.formatMoney(p.price)}</span>`;
    const compare = sale ? `<span class="compare">${TR.formatMoney(p.compareAtPrice)}</span>` : '';
    const save = pct > 0 ? `<span class="save">Save ${pct}%</span>` : '';

    return `
      <article class="product-card" data-id="${escapeHtml(p.id)}">
        <div class="product-media">
          <img loading="lazy" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src=\'assets/images/logo-mark.png\';" />
          ${badge}
          ${salePill}
        </div>
        <div class="product-body">
          <h3>${escapeHtml(p.name)}</h3>
          <p class="meta">${escapeHtml(p.shortDescription || '')}</p>
          <div class="price-row">${price}${compare}${save}</div>
        </div>
        <div class="product-actions">
          <button class="btn btn-ghost" data-action="quick">Quick view</button>
          <button class="btn btn-primary" data-action="add">Add to cart</button>
        </div>
      </article>
    `;
  }

  function renderCarousel(trackId, products){
    const track = document.getElementById(trackId);
    if(!track) return;
    track.innerHTML = products.map(productCard).join('');
  }

  function scrollCarousel(trackId, dir){
    const track = document.getElementById(trackId);
    if(!track) return;
    const card = track.querySelector('.product-card');
    // Read the actual CSS gap so scrolling stays aligned across breakpoints
    const styles = window.getComputedStyle(track);
    const gapStr = styles.columnGap || styles.gap || '0px';
    const gap = parseFloat(gapStr) || 0;
    const step = card ? (card.getBoundingClientRect().width + gap) : 320;

    // On phones, scroll one card at a time (centered snap). On desktop, move faster.
    const mult = window.matchMedia('(max-width: 720px)').matches ? 1 : 2;
    track.scrollBy({ left: dir * step * mult, behavior: 'smooth' });
  }

  function openQuickView(product){
    const modal = $('#qvModal');
    if(!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    syncScrollLock();

    const sale = product.compareAtPrice && product.compareAtPrice > product.price;
    const pct = sale ? TR.discountPercent(product) : 0;

    $('#qvTitle').textContent = product.name;
    $('#qvDesc').textContent = product.description || product.shortDescription || '';
    $('#qvPrice').textContent = TR.formatMoney(product.price);
    $('#qvCompare').textContent = sale ? TR.formatMoney(product.compareAtPrice) : '';
    $('#qvCompare').style.display = sale ? 'inline' : 'none';

    const qvDisc = $('#qvDiscount');
    if(qvDisc){
      qvDisc.textContent = pct > 0 ? `-${pct}%` : '';
      qvDisc.style.display = pct > 0 ? 'inline-flex' : 'none';
    }

    const img = $('#qvImg');
    img.src = product.image;
    img.alt = product.name;
    applyImgFallback(img);

    const hi = $('#qvHighlights');
    hi.innerHTML = (product.highlights || []).map(h=> `<li>${escapeHtml(h)}</li>`).join('') || '<li>—</li>';

    const specs = $('#qvSpecs');
    const entries = product.specs && typeof product.specs === 'object' ? Object.entries(product.specs) : [];
    specs.innerHTML = entries.length ? entries.map(([k,v])=> `<div class="spec"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`).join('') : '<div class="spec"><span>Specs</span><span>—</span></div>';

    const addBtn = $('#qvAdd');
    addBtn.dataset.id = product.id;

    const viewBtn = $('#qvView');
    viewBtn.href = `product.html?id=${encodeURIComponent(product.id)}`;
  }

  function closeQuickView(){
    const modal = $('#qvModal');
    if(!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    syncScrollLock();
  }

  function openCartDrawer(){
    var cd = $('#cartDrawer'); if(cd) cd.setAttribute('aria-hidden','false');
    renderCartDrawer();
    syncScrollLock();
  }

  function closeCartDrawer(){
    var cd2 = $('#cartDrawer'); if(cd2) cd2.setAttribute('aria-hidden','true');
    syncScrollLock();
  }

  function cartLineItem(p, qty){
    const price = TR.formatMoney(p.price);
    const total = TR.formatMoney(p.price * qty);
    return `
      <div class="cart-item" data-id="${escapeHtml(p.id)}">
        <img class="cart-thumb" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src=\'assets/images/logo-mark.png\';" />
        <div class="cart-info">
          <div class="cart-name">${escapeHtml(p.name)}</div>
          <div class="cart-meta">${price} <span class="muted">×</span> ${qty} <span class="muted">=</span> <strong>${total}</strong></div>
          <div class="cart-qty">
            <button class="qty-btn" data-action="qty" data-delta="-1" aria-label="Decrease">−</button>
            <span class="qty-value">${qty}</span>
            <button class="qty-btn" data-action="qty" data-delta="1" aria-label="Increase">+</button>
            <button class="link-danger" data-action="remove">Remove</button>
          </div>
        </div>
      </div>
    `;
  }

  function calcSubtotal(products, cart){
    let total = 0;
    for(const [id, qty] of Object.entries(cart)){
      const p = TR.findProduct(products, id);
      if(p) total += p.price * (Number(qty)||0);
    }
    return total;
  }

  function renderCartDrawer(){
    const wrap = $('#cartItems');
    if(!wrap) return;
    const products = TR.loadProducts().filter(p=>p.active !== false);
    const cart = TR.loadCart();
    const ids = Object.keys(cart);

    if(!ids.length){
      wrap.innerHTML = '<div class="empty">Your cart is empty.</div>';
      $('#cartSubtotal').textContent = TR.formatMoney(0);
      return;
    }

    wrap.innerHTML = ids.map(id=>{
      const p = TR.findProduct(products, id);
      if(!p) return '';
      return cartLineItem(p, Number(cart[id])||0);
    }).join('');

    $('#cartSubtotal').textContent = TR.formatMoney(calcSubtotal(products, cart));
  }

  function bindGlobalEvents(){
    document.addEventListener('click', (e)=>{
      const t = e.target;

      // Mobile nav
      if(t.matches('[data-action="nav-open"]')){
        var mm = $('#mobileMenu'); if(mm) mm.setAttribute('aria-hidden','false');
        syncScrollLock();
      }
      if(t.matches('[data-action="nav-close"]') || t.id === 'mobileMenu'){
        var mm2 = $('#mobileMenu'); if(mm2) mm2.setAttribute('aria-hidden','true');
        syncScrollLock();
      }

      // Carousel arrows
      if(t.matches('[data-carousel]')){
        const id = t.getAttribute('data-carousel');
        const dir = Number(t.getAttribute('data-dir')||'1');
        scrollCarousel(id, dir);
      }

      // Product card buttons
      if(t.matches('[data-action="quick"]')){
        const card = t.closest('.product-card');
        const id = card && card.dataset ? card.dataset.id : undefined;
        const products = TR.loadProducts().filter(p=>p.active !== false);
        const p = products.find(x=>x.id===id);
        if(p) openQuickView(p);
      }

      if(t.matches('[data-action="add"]')){
        const card = t.closest('.product-card');
        const id = card && card.dataset ? card.dataset.id : undefined;
        if(id){
          TR.addToCart(id, 1);
          updateCartCount();
          toast('Added to cart');
          renderCartDrawer();
        }
      }

      // Quick view modal
      if(t.matches('[data-action="qv-close"]') || t.id === 'qvModal'){
        closeQuickView();
      }
      if(t.id === 'qvAdd'){
        const id = t.dataset.id;
        if(id){
          TR.addToCart(id, 1);
          updateCartCount();
          toast('Added to cart');
          renderCartDrawer();
          closeQuickView();
        }
      }

      // Cart drawer
      if(t.id === 'cartBtn' || t.matches('[data-action="cart-open"]')){
        openCartDrawer();
      }
      if(t.matches('[data-action="cart-close"]') || t.id === 'cartDrawer'){
        closeCartDrawer();
      }
      if(t.matches('.qty-btn')){
        const item = t.closest('.cart-item');
        const id = item && item.dataset ? item.dataset.id : undefined;
        const delta = Number(t.dataset.delta||0);
        if(id){
          const cart = TR.loadCart();
          const next = (Number(cart[id])||0) + delta;
          TR.setQty(id, next);
          updateCartCount();
          renderCartDrawer();
        }
      }
      if(t.matches('[data-action="remove"]')){
        const item = t.closest('.cart-item');
        const id = item && item.dataset ? item.dataset.id : undefined;
        if(id){
          TR.removeFromCart(id);
          updateCartCount();
          renderCartDrawer();
        }
      }

      if(t.matches('[data-action="clear-cart"]')){
        TR.clearCart();
        updateCartCount();
        renderCartDrawer();
      }

      // Checkout from drawer
      if(t.matches('[data-action="go-checkout"]')){
        window.location.href = 'checkout.html';
      }

      // Newsletter (demo)
      if(t.matches('[data-action="newsletter"]')){
        e.preventDefault();
        var ne = $('#newsletterEmail'); const email = ne && ne.value ? ne.value.trim() : '';
        if(!email) return toast('Please enter your email');
        toast('Thanks for subscribing!');
        $('#newsletterEmail').value = '';
      }
    });

    // Newsletter submit (supports Enter key)
    document.addEventListener('submit', (e)=>{
      const form = e.target;
      if(form && form.matches && form.matches('.newsletter-form')){
        e.preventDefault();
        var ne = $('#newsletterEmail'); const email = ne && ne.value ? ne.value.trim() : '';
        if(!email) return toast('Please enter your email');
        toast('Thanks for subscribing!');
        if($('#newsletterEmail')) $('#newsletterEmail').value = '';
      }
    });

    // Escape closes modals
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape'){
        closeQuickView();
        closeCartDrawer();
        var mm2 = $('#mobileMenu'); if(mm2) mm2.setAttribute('aria-hidden','true');
        syncScrollLock();
      }
    });
  }

  // ---------- Page renderers ----------

  function renderHome(){
    const products = TR.loadProducts().filter(p=>p.active !== false);
    const featured = products.filter(p=>hasCat(p,'featured')); 
    const classic = products.filter(p=>hasCat(p,'classic')); 
    const sport = products.filter(p=>hasCat(p,'sport')); 

    renderCarousel('featuredTrack', featured);
    renderCarousel('classicTrack', classic);
    renderCarousel('sportTrack', sport);
  }

  function renderShop(){
    const products = TR.loadProducts().filter(p=>p.active !== false);
    const grid = $('#shopGrid');
    if(!grid) return;

    const search = $('#searchInput');
    const cat = $('#categoryFilter');
    const sort = $('#sortFilter');

    function apply(){
      const q = ((search && search.value) || '').trim().toLowerCase();
      const c = (cat && cat.value) ? cat.value : 'all';
      const s = (sort && sort.value) ? sort.value : 'featured';

      let list = products.slice();
      if(c !== 'all') list = list.filter(p=>hasCat(p, c));
      if(q) list = list.filter(p=> (p.name||'').toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q));

      if(s === 'price-asc') list.sort((a,b)=>a.price-b.price);
      if(s === 'price-desc') list.sort((a,b)=>b.price-a.price);
      if(s === 'name-asc') list.sort((a,b)=>(a.name||'').localeCompare(b.name||''));

      grid.innerHTML = list.map(productCard).join('') || '<div class="empty">No products found.</div>';
      setText('shopCount', String(list.length));
    }

    // prefill category from URL
    const urlCat = TR.getParam('category');
    if(urlCat && cat){ cat.value = urlCat; }

    if(search) search.addEventListener('input', apply);
    if(cat) cat.addEventListener('change', apply);
    if(sort) sort.addEventListener('change', apply);

    apply();
  }

  function renderProductPage(){
    const id = TR.getParam('id');
    if(!id) return;
    const products = TR.loadProducts().filter(p=>p.active !== false);
    const p = products.find(x=>x.id===id);
    if(!p) return;

    setText('pName', p.name);
    setText('pBrand', p.brand || '');
    setText('pDesc', p.description || p.shortDescription || '');

    const sale = p.compareAtPrice && p.compareAtPrice > p.price;
    const pct = sale ? TR.discountPercent(p) : 0;
    $('#pPrice').textContent = TR.formatMoney(p.price);
    const cmp = $('#pCompare');
    if(cmp){
      cmp.textContent = sale ? TR.formatMoney(p.compareAtPrice) : '';
      cmp.style.display = sale ? 'inline' : 'none';
    }

    const pDisc = $('#pDiscount');
    if(pDisc){
      pDisc.textContent = pct > 0 ? `Save ${pct}%` : '';
      pDisc.style.display = pct > 0 ? 'inline-flex' : 'none';
    }

    const mainImg = $('#pMainImg');
    mainImg.src = p.image;
    mainImg.alt = p.name;
    applyImgFallback(mainImg);

    // gallery
    const thumbs = $('#pThumbs');
    const imgs = Array.isArray(p.images) && p.images.length ? p.images : [p.image];
    thumbs.innerHTML = imgs.map((src, idx)=>`<button class="thumb" data-src="${escapeHtml(src)}" aria-label="Image ${idx+1}"><img src="${escapeHtml(src)}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src=\'assets/images/logo-mark.png\';"/></button>`).join('');

    thumbs.addEventListener('click', (e)=>{
      const btn = e.target.closest('.thumb');
      const src = (btn && btn.dataset) ? btn.dataset.src : undefined;
      if(src){
        mainImg.src = src;
      }
    });

    const hi = $('#pHighlights');
    hi.innerHTML = (p.highlights||[]).map(h=>`<li>${escapeHtml(h)}</li>`).join('') || '<li>—</li>';

    const specs = $('#pSpecs');
    const entries = p.specs && typeof p.specs === 'object' ? Object.entries(p.specs) : [];
    specs.innerHTML = entries.length ? entries.map(([k,v])=> `<div class="spec"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`).join('') : '<div class="spec"><span>Specs</span><span>—</span></div>';

    var pAdd = $('#pAdd'); if(pAdd) pAdd.addEventListener('click', ()=>{
      TR.addToCart(p.id, 1);
      updateCartCount();
      toast('Added to cart');
    });
  }

  function renderCartPage(){
    const table = $('#cartTable');
    if(!table) return;

    const products = TR.loadProducts().filter(p=>p.active !== false);
    const cart = TR.loadCart();
    const ids = Object.keys(cart);

    if(!ids.length){
      table.innerHTML = '<div class="empty">Your cart is empty.</div>';
      setText('cartTotal', TR.formatMoney(0));
      return;
    }

    table.innerHTML = ids.map(id=>{
      const p = TR.findProduct(products, id);
      const qty = Number(cart[id])||0;
      if(!p || qty<=0) return '';
      const total = TR.formatMoney(p.price * qty);
      return `
        <div class="cart-row" data-id="${escapeHtml(id)}">
          <div class="cart-row-left">
            <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src=\'assets/images/logo-mark.png\';"/>
            <div>
              <div class="cart-row-name">${escapeHtml(p.name)}</div>
              <div class="muted">${TR.formatMoney(p.price)}</div>
            </div>
          </div>
          <div class="cart-row-right">
            <div class="qty">
              <button class="qty-btn" data-action="qty" data-delta="-1">−</button>
              <span class="qty-value">${qty}</span>
              <button class="qty-btn" data-action="qty" data-delta="1">+</button>
            </div>
            <div class="cart-row-total">${total}</div>
            <button class="link-danger" data-action="remove">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    setText('cartTotal', TR.formatMoney(calcSubtotal(products, cart)));

    table.addEventListener('click', (e)=>{
      const t = e.target;
      const row = t.closest('.cart-row');
      const id = (row && row.dataset) ? row.dataset.id : undefined;
      if(!id) return;

      if(t.matches('.qty-btn')){
        const delta = Number(t.dataset.delta||0);
        const current = Number(TR.loadCart()[id])||0;
        TR.setQty(id, current + delta);
        updateCartCount();
        renderCartPage();
      }
      if(t.matches('[data-action="remove"]')){
        TR.removeFromCart(id);
        updateCartCount();
        renderCartPage();
      }
    });
  }

  function renderCheckout(){
    const sum = $('#checkoutSummary');
    if(!sum) return;

    const products = TR.loadProducts().filter(p=>p.active !== false);
    const cart = TR.loadCart();
    const ids = Object.keys(cart);

    sum.innerHTML = ids.length ? ids.map(id=>{
      const p = TR.findProduct(products, id);
      const qty = Number(cart[id])||0;
      if(!p || qty<=0) return '';
      return `<div class="line"><span>${escapeHtml(p.name)} <span class="muted">×${qty}</span></span><strong>${TR.formatMoney(p.price*qty)}</strong></div>`;
    }).join('') : '<div class="empty">Your cart is empty.</div>';

    setText('checkoutTotal', TR.formatMoney(calcSubtotal(products, cart)));

    var co = $('#checkoutForm'); if(co) co.addEventListener('submit', (e)=>{
      e.preventDefault();
      toast('Order placed');
      TR.clearCart();
      updateCartCount();
      setTimeout(()=>{ window.location.href = 'index.html'; }, 700);
    });
  }

  function boot(){
    renderHeader();
    renderMobileDock();
    updateCartCount();
    setText('year', String(new Date().getFullYear()));

    bindGlobalEvents();
    syncScrollLock();

    const page = document.body.getAttribute('data-page');
    if(page === 'home') renderHome();
    if(page === 'shop') renderShop();
    if(page === 'product') renderProductPage();
    if(page === 'cart') renderCartPage();
    if(page === 'checkout') renderCheckout();
  }

  function buildIGOrderMessage(details, products, cart){
  const ids = Object.keys(cart || {});
  if(!ids.length) return 'Hello Time Rush 👋\nMy cart is empty.';

  const lines = [];
  lines.push('Hello Time Rush 👋');
  lines.push('I want to order:');
  lines.push('');

  ids.forEach(id=>{
    const p = TR.findProduct(products, id);
    const qty = Number(cart[id]) || 0;
    if(!p || qty <= 0) return;
    lines.push(`- ${p.name} x${qty} — ${TR.formatMoney(p.price * qty)}`);
  });

  lines.push('');
  lines.push(`Total: ${TR.formatMoney(calcSubtotal(products, cart))}`);
  lines.push('');
  lines.push('Delivery details:');
  lines.push(`Name: ${details?.name || ''}`);
  lines.push(`Phone: ${details?.phone || ''}`);
  lines.push(`City: ${details?.city || ''}`);
  lines.push(`Address: ${details?.address || ''}`);
  lines.push(`Notes: ${details?.notes || ''}`);

  return lines.join('\n');
}

function copyToClipboard(text){
  if(navigator.clipboard && navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject)=>{
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly','');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      ok ? resolve() : reject(new Error('copy failed'));
    }catch(err){ reject(err); }
  });
}

function openInstagramDM(){
  window.location.href = 'https://ig.me/m/timerush.leb';
}

  window.addEventListener('DOMContentLoaded', boot);
})();
