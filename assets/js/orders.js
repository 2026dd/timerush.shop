/* Time Rush online order submission. Supabase credentials are public anon values only. */
(function () {
  const configured = () => window.supabase && window.TR_SUPABASE_URL &&
    window.TR_SUPABASE_ANON_KEY && !window.TR_SUPABASE_URL.includes('YOUR-PROJECT') &&
    !window.TR_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');

  function client() {
    if (!configured()) throw new Error('The online order system has not been connected yet.');
    return window.supabase.createClient(window.TR_SUPABASE_URL, window.TR_SUPABASE_ANON_KEY);
  }

  async function submitOrder(details, products, cart) {
    const items = Object.entries(cart).map(([id, quantity]) => {
      const product = products.find(p => String(p.id) === String(id));
      const qty = Math.max(0, Math.floor(Number(quantity) || 0));
      if (!product || !product.active || qty < 1) return null;
      return { product_id: String(product.id), product_name: String(product.name),
        image: String(product.image || ''), quantity: qty, unit_price: Number(product.price) || 0 };
    }).filter(Boolean);
    if (!items.length) throw new Error('Your cart is empty or contains unavailable products.');

    const { data, error } = await client().rpc('tr_place_order', {
      p_customer_name: details.name,
      p_customer_phone: details.phone,
      p_customer_city: details.city,
      p_customer_address: details.address,
      p_customer_notes: details.notes || '',
      p_items: items
    });
    if (error) throw error;
    const order = Array.isArray(data) ? data[0] : data;
    if (!order || !order.order_id) throw new Error('The order could not be confirmed. Please try again.');

    // Orders are stored in Supabase and viewed privately in the Admin Dashboard.
    return order;
  }
  window.TROrders = { submitOrder };
})();
