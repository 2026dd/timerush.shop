// Time Rush — Store & Storage Helpers
// Handles products/settings (localStorage) + cart.
(function(){
  const KEYS = {
    products: 'tr_products_v1',
    settings: 'tr_settings_v1',
    cart: 'tr_cart_v1',
    adminPass: 'tr_admin_pass_v1'
  };

  function lsGet(key){
  try { return localStorage.getItem(key); } catch(e){ return null; }
  }
  function lsSet(key, val){
  try { localStorage.setItem(key, val); } catch(e){}
  }
  function lsRemove(key){
  try { localStorage.removeItem(key); } catch(e){}
  }

  function safeParse(json, fallback){
    try{ return JSON.parse(json); }catch(e){ return fallback; }
  }

  function loadSettings(){
    const saved = safeParse(lsGet(KEYS.settings), null);
    if(saved && typeof saved === 'object'){
      var out = {};
      var d = window.TR_DEFAULT_SETTINGS || {};
      for(var k in d){ out[k] = d[k]; }
      for(var k2 in saved){ out[k2] = saved[k2]; }
      return out;
    }
    var out2 = {};
    var d2 = window.TR_DEFAULT_SETTINGS || {};
    for(var k3 in d2){ out2[k3] = d2[k3]; }
    return out2;
  }

  function saveSettings(settings){
    lsSet(KEYS.settings, JSON.stringify(settings));
  }

  function canonicalCat(c){
    const v = String(c||'').trim().toLowerCase();
    // allow common typos/aliases
    if(v === 'feature') return 'featured';
    if(v === 'features') return 'featured';
    return v;
  }

  function normalizeCategories(product){
    const primary = canonicalCat((product && product.category) || 'classic') || 'classic';

    let cats = [];
    if(product && Array.isArray(product.categories)) cats = product.categories;
    else cats = [primary];

    cats = cats
      .map(c => canonicalCat(c))
      .filter(Boolean);

    if(primary && !cats.includes(primary)) cats.unshift(primary);

    // de-dupe
    cats = Array.from(new Set(cats));

    return { primary, cats };
  }

  function normalizeProduct(p){
    const { primary, cats } = normalizeCategories(p);

    return {
      id: String((p && p.id) || '').trim(),
      name: String((p && p.name) || '').trim(),
      brand: String((p && p.brand) || '').trim(),
      // primary category kept for admin/simple UIs
      category: primary,
      // multi-category support (homepage sections + shop filters)
      categories: cats,
      price: Number((p && p.price) || 0),
      compareAtPrice: Number((p && p.compareAtPrice) || 0),
      badge: String((p && p.badge) || ''),
      image: String((p && p.image) || ''),
      images: (p && Array.isArray(p.images) && p.images.length) ? p.images : ((p && p.image) ? [p.image] : []),
      shortDescription: String((p && p.shortDescription) || ''),
      description: String((p && p.description) || ''),
      highlights: (p && Array.isArray(p.highlights)) ? p.highlights : [],
      specs: (p && p.specs && typeof p.specs === 'object') ? p.specs : {},
      active: !(p && p.active === false),
    };
  }

  function loadProducts(){
    const saved = safeParse(lsGet(KEYS.products), null);
    if(Array.isArray(saved) && saved.length){
      // Normalize and keep minimal defaults to avoid missing fields
      return saved.map(normalizeProduct).filter(p => p.id && p.name);
    }
    // Default
    return (window.TR_DEFAULT_PRODUCTS || []).map(function(p){
      var cp = {};
      for(var k in p){ cp[k] = p[k]; }
      if(p && p.active === false) cp.active = false; else cp.active = true;
      return normalizeProduct(cp);
    });
  }

  function saveProducts(products){
    lsSet(KEYS.products, JSON.stringify(products));
  }

  function resetProductsToDefault(){
    saveProducts(window.TR_DEFAULT_PRODUCTS || []);
    return loadProducts();
  }

  function loadCart(){
    const c = safeParse(lsGet(KEYS.cart), {});
    return c && typeof c === 'object' ? c : {};
  }

  function saveCart(cart){
    lsSet(KEYS.cart, JSON.stringify(cart));
  }

  function cartCount(cart){
    return Object.values(cart).reduce((sum, n)=> sum + (Number(n)||0), 0);
  }

  function addToCart(id, qty=1){
    const cart = loadCart();
    cart[id] = (Number(cart[id])||0) + (Number(qty)||1);
    if(cart[id] <= 0) delete cart[id];
    saveCart(cart);
    return cart;
  }

  function setQty(id, qty){
    const cart = loadCart();
    const q = Number(qty)||0;
    if(q <= 0) delete cart[id];
    else cart[id] = q;
    saveCart(cart);
    return cart;
  }

  function removeFromCart(id){
    const cart = loadCart();
    delete cart[id];
    saveCart(cart);
    return cart;
  }

  function clearCart(){
    saveCart({});
    return {};
  }

  function findProduct(products, id){
  const sid = String(id || '').trim();
  return products.find(p => String(p.id || '').trim() === sid);
  }

  function formatMoney(value, settings){
    const s = settings || loadSettings();
    const num = Number(value || 0);
    return `${s.currencySymbol}${num.toFixed(2)}`;
  }

  function discountPercent(product){
    // Returns integer discount percent when compareAtPrice > price.
    // Example: compareAtPrice=100, price=80 -> 20
    const compare = Number((product && product.compareAtPrice) || 0);
    const price = Number((product && product.price) || 0);
    if(!Number.isFinite(compare) || !Number.isFinite(price)) return 0;
    if(compare <= 0 || price <= 0) return 0;
    if(compare <= price) return 0;
    // Round to nearest whole percent.
    return Math.round((1 - (price / compare)) * 100);
  }

  function getParam(name){
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  function ensureAdminPassword(){
    // Default password for demo. User can change it inside admin.
    const current = lsGet(KEYS.adminPass);
    if(!current){
      lsSet(KEYS.adminPass, 'timerush');
    }
  }

  function getAdminPassword(){
    ensureAdminPassword();
    return lsGet(KEYS.adminPass) || 'timerush';
  }

  function setAdminPassword(newPass){
    lsSet(KEYS.adminPass, String(newPass||'').trim());
  }

  window.TR = {
    KEYS,
    loadSettings,
    saveSettings,
    loadProducts,
    saveProducts,
    resetProductsToDefault,
    loadCart,
    saveCart,
    cartCount,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    findProduct,
    formatMoney,
    discountPercent,
    getParam,
    getAdminPassword,
    setAdminPassword
  };
})();
