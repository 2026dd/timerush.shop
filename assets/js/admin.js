// Time Rush — Admin Dashboard (static)
// Products & settings are stored in localStorage.

(function(){
  const $ = (q, el=document)=> el.querySelector(q);
  const $$ = (q, el=document)=> Array.from(el.querySelectorAll(q));

  const SESSION_KEY = 'tr_admin_authed_v1';

  function renderHeader(){
    const s = TR.loadSettings();
    document.querySelectorAll('[data-bind="storeName"]').forEach(el=>{ el.textContent = s.storeName; });
    document.querySelectorAll('[data-bind="tagline"]').forEach(el=>{ el.textContent = s.tagline; });
    const year = document.getElementById('year');
    if(year) year.textContent = String(new Date().getFullYear());
  }

  function toast(msg){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=> t.classList.add('show'), 20);
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),250); }, 2200);
  }

  function isAuthed(){
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function setAuthed(v){
    sessionStorage.setItem(SESSION_KEY, v ? '1' : '0');
  }

  function show(viewId){
    $$('[data-view]').forEach(v=> v.classList.add('hidden'));
    const view = document.getElementById(viewId);
    if(view && view.classList) view.classList.remove('hidden');
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


  function normalizeId(v){
    return String(v||'')
      .trim()
      .toLowerCase()
      .replace(/\s+/g,'-')
      .replace(/[^a-z0-9\-]/g,'')
      .replace(/\-+/g,'-');
  }

  // ---------- Products table ----------

  function row(p){
    const sale = p.compareAtPrice && p.compareAtPrice > p.price;
    const badge = p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : (sale ? '<span class="badge">Sale</span>' : '');

    return `
      <tr data-id="${escapeHtml(p.id)}">
        <td class="cell-img"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}"/></td>
        <td>
          <div class="row-title">${escapeHtml(p.name)}</div>
          <div class="row-meta">${escapeHtml(p.brand || '')}</div>
        </td>
        <td>${escapeHtml((Array.isArray(p.categories) && p.categories.length ? p.categories.join(', ') : (p.category||'')))}</td>
        <td><strong>${TR.formatMoney(p.price)}</strong>${sale ? ` <span class="muted">(${TR.formatMoney(p.compareAtPrice)})</span>` : ''}</td>
        <td>${badge}</td>
        <td>
          <button class="btn btn-ghost" data-action="edit">Edit</button>
          <button class="btn btn-danger" data-action="delete">Delete</button>
        </td>
      </tr>
    `;
  }

  function renderTable(){
    const tbody = $('#productsBody');
    if(!tbody) return;
    const products = TR.loadProducts();

    var as = $('#adminSearch'); const q = ((as && as.value) || '').trim().toLowerCase();
    var ac = $('#adminCategory'); const cat = (ac && ac.value) ? ac.value : 'all';

    let list = products.slice();
    if(cat !== 'all') list = list.filter(p=>hasCat(p, cat));
    if(q) list = list.filter(p=> (p.name||'').toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q) || (p.id||'').toLowerCase().includes(q));

    tbody.innerHTML = list.map(row).join('') || '<tr><td colspan="6" class="empty">No products</td></tr>';
    $('#productCount').textContent = String(list.length);
  }

  function openProductModal(mode, product){
    const modal = $('#productEditor');
    if(!modal) return;
    modal.setAttribute('aria-hidden','false');
    $('#editorTitle').textContent = mode === 'edit' ? 'Edit product' : 'Add product';

    // Fill
    $('#pId').value = (product && product.id) ? product.id : '';
    $('#pName').value = (product && product.name) ? product.name : '';
    $('#pBrand').value = (product && product.brand) ? product.brand : '';
    $('#pCategory').value = (product && product.category) ? product.category : 'classic';
    $('#pPrice').value = (product && product.price !== undefined && product.price !== null) ? product.price : '';
    $('#pCompare').value = (product && product.compareAtPrice !== undefined && product.compareAtPrice !== null) ? product.compareAtPrice : '';
    $('#pBadge').value = (product && product.badge) ? product.badge : '';
    $('#pImage').value = (product && product.image) ? product.image : '';
    $('#pShort').value = (product && product.shortDescription) ? product.shortDescription : '';
    $('#pDesc').value = (product && product.description) ? product.description : '';
    $('#pHighlights').value = (product && Array.isArray(product.highlights)) ? product.highlights.join(', ') : '';

    // specs as lines
    const specs = (product && product.specs && typeof product.specs === 'object') ? product.specs : {};
    $('#pSpecs').value = Object.entries(specs).map(([k,v])=> `${k}: ${v}`).join('\n');

    $('#pActive').checked = !(product && product.active === false);

    // Preview
    $('#pPreview').src = (product && product.image) ? product.image : 'assets/images/logo-mark.png';
    $('#pPreview').alt = (product && product.name) ? product.name : 'preview';

    $('#saveProductBtn').dataset.mode = mode;
    $('#saveProductBtn').dataset.originalId = (product && product.id) ? product.id : '';
  }

  function closeProductModal(){
    var pe = $('#productEditor'); if(pe) pe.setAttribute('aria-hidden','true');
  }

  function parseSpecs(lines){
    const out = {};
    String(lines||'')
      .split(/\r?\n/)
      .map(s=>s.trim())
      .filter(Boolean)
      .forEach(line=>{
        const idx = line.indexOf(':');
        if(idx === -1) return;
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx+1).trim();
        if(k) out[k] = v;
      });
    return out;
  }

  function saveFromModal(){
    const mode = $('#saveProductBtn').dataset.mode;
    const originalId = $('#saveProductBtn').dataset.originalId;

    const idRaw = $('#pId').value.trim() || $('#pName').value.trim();
    const id = normalizeId(idRaw);

    const product = {
      id,
      name: $('#pName').value.trim(),
      brand: $('#pBrand').value.trim(),
      category: $('#pCategory').value,
      price: Number($('#pPrice').value || 0),
      compareAtPrice: Number($('#pCompare').value || 0),
      badge: $('#pBadge').value.trim(),
      image: $('#pImage').value.trim(),
      images: [$('#pImage').value.trim()].filter(Boolean),
      shortDescription: $('#pShort').value.trim(),
      description: $('#pDesc').value.trim(),
      highlights: $('#pHighlights').value.split(',').map(s=>s.trim()).filter(Boolean),
      specs: parseSpecs($('#pSpecs').value),
      active: $('#pActive').checked
    };

    if(!product.id || !product.name){
      toast('ID and Name are required');
      return;
    }

    const products = TR.loadProducts();

    if(mode === 'edit'){
      const idx = products.findIndex(p=>p.id===originalId);
      if(idx === -1){
        toast('Product not found');
        return;
      }
      // prevent duplicate id
      const duplicate = products.find(p=>p.id===product.id && p.id!==originalId);
      if(duplicate){
        toast('This ID already exists');
        return;
      }
      products[idx] = { ...products[idx], ...product };
    } else {
      const exists = products.some(p=>p.id===product.id);
      if(exists){
        toast('This ID already exists');
        return;
      }
      products.unshift(product);
    }

    TR.saveProducts(products);
    closeProductModal();
    renderTable();
    toast('Saved');
  }

  // ---------- Settings ----------

  function loadSettingsForm(){
    const s = TR.loadSettings();
    $('#sName').value = s.storeName || '';
    $('#sTagline').value = s.tagline || '';
    $('#sCurrency').value = s.currencySymbol || '$';
    $('#sEmail').value = s.contactEmail || '';
  }

  function saveSettingsForm(){
    const s = TR.loadSettings();
    const next = {
      ...s,
      storeName: $('#sName').value.trim() || s.storeName,
      tagline: $('#sTagline').value.trim() || s.tagline,
      currencySymbol: $('#sCurrency').value.trim() || s.currencySymbol,
      contactEmail: $('#sEmail').value.trim() || s.contactEmail,
    };
    TR.saveSettings(next);
    toast('Settings saved');
  }

  function exportProducts(){
    const data = {
      settings: TR.loadSettings(),
      products: TR.loadProducts(),
      exportedAt: new Date().toISOString(),
      app: 'TimeRush'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'timerush-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function importProducts(file){
    const text = await file.text();
    let parsed;
    try{ parsed = JSON.parse(text); }
    catch(e){ toast('Invalid JSON'); return; }

    if(parsed && Array.isArray(parsed.products)){
      TR.saveProducts(parsed.products);
    }
    if(parsed && parsed.settings && typeof parsed.settings === 'object'){
      TR.saveSettings(parsed.settings);
      loadSettingsForm();
    }

    toast('Imported');
    renderTable();
  }

  function resetToDefault(){
    TR.resetProductsToDefault();
    toast('Reset to default');
    renderTable();
  }

  function bind(){
    // Mobile nav
    document.addEventListener('click', (e)=>{
      const t = e.target;
      if(t.matches('[data-action="nav-open"]')){
        var mm = document.getElementById('mobileMenu'); if(mm) mm.setAttribute('aria-hidden','false');
      }
      if(t.matches('[data-action="nav-close"]') || t.id === 'mobileMenu'){
        var mm2 = document.getElementById('mobileMenu'); if(mm2) mm2.setAttribute('aria-hidden','true');
      }
    });

    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape'){
        var mm2 = document.getElementById('mobileMenu'); if(mm2) mm2.setAttribute('aria-hidden','true');
        closeProductModal();
      }
    });

    // Login
    var lf = $('#loginForm'); if(lf) lf.addEventListener('submit', (e)=>{
      e.preventDefault();
      const pass = $('#loginPass').value;
      if(pass === TR.getAdminPassword()){
        setAuthed(true);
        bootAuthed();
        toast('Welcome');
      } else {
        toast('Wrong password');
      }
    });

    var lo = $('#logoutBtn'); if(lo) lo.addEventListener('click', ()=>{
      setAuthed(false);
      show('viewLogin');
    });

    // Search / filter
    var as2 = $('#adminSearch'); if(as2) as2.addEventListener('input', renderTable);
    var ac2 = $('#adminCategory'); if(ac2) ac2.addEventListener('change', renderTable);

    // Table actions
    var pb = $('#productsBody'); if(pb) pb.addEventListener('click', (e)=>{
      const t = e.target;
      const tr = t.closest('tr');
      const id = (tr && tr.dataset) ? tr.dataset.id : undefined;
      if(!id) return;

      const products = TR.loadProducts();
      const p = products.find(x=>x.id===id);

      if(t.matches('[data-action="edit"]')) openProductModal('edit', p);
      if(t.matches('[data-action="delete"]')){
        if(confirm('Delete this product?')){
          TR.saveProducts(products.filter(x=>x.id!==id));
          renderTable();
          toast('Deleted');
        }
      }
    });

    // Add product
    var apb = $('#addProductBtn'); if(apb) apb.addEventListener('click', ()=> openProductModal('add', null));

    // Modal close
    var pe2 = $('#productEditor'); if(pe2) pe2.addEventListener('click', (e)=>{
      if(e.target.id === 'productEditor') closeProductModal();
    });
    var ce = $('[data-action="close-editor"]'); if(ce) ce.addEventListener('click', closeProductModal);

    // Preview image live
    var pi = $('#pImage'); if(pi) pi.addEventListener('input', ()=>{
      const src = $('#pImage').value.trim();
      $('#pPreview').src = src || 'assets/images/logo-mark.png';
    });

    // Save product
    var spb = $('#saveProductBtn'); if(spb) spb.addEventListener('click', saveFromModal);

    // Settings
    var sf = $('#settingsForm'); if(sf) sf.addEventListener('submit', (e)=>{ e.preventDefault(); saveSettingsForm(); });

    // Change admin password
    var pf = $('#passForm'); if(pf) pf.addEventListener('submit', (e)=>{
      e.preventDefault();
      const oldP = $('#oldPass').value;
      const newP = $('#newPass').value.trim();
      if(oldP !== TR.getAdminPassword()) return toast('Old password is wrong');
      if(newP.length < 4) return toast('Password must be at least 4 characters');
      TR.setAdminPassword(newP);
      $('#oldPass').value = '';
      $('#newPass').value = '';
      toast('Password updated');
    });

    // Export / import
    var eb = $('#exportBtn'); if(eb) eb.addEventListener('click', exportProducts);
    var imf = $('#importFile'); if(imf) imf.addEventListener('change', (e)=>{
      const f = (e.target && e.target.files) ? e.target.files[0] : undefined;
      if(f) importProducts(f);
      e.target.value = '';
    });

    var rb = $('#resetBtn'); if(rb) rb.addEventListener('click', ()=>{
      if(confirm('Reset all products to default?')) resetToDefault();
    });
  }

  function bootAuthed(){
    show('viewAdmin');
    loadSettingsForm();
    renderTable();
  }

  function boot(){
    renderHeader();
    bind();
    if(isAuthed()) bootAuthed();
    else show('viewLogin');
  }

  window.addEventListener('DOMContentLoaded', boot);
})();
