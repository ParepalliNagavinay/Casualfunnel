(function startStore() {
  const products = window.formFieldProducts || [];
  const grid = document.querySelector('[data-product-grid]');
  const search = document.querySelector('[data-product-search]');
  const categoryFilter = document.querySelector('[data-category-filter]');
  const catalogCount = document.querySelector('[data-catalog-count]');
  const noProducts = document.querySelector('[data-no-products]');
  const bagCount = document.querySelector('[data-bag-count]');
  const cartHeadingCount = document.querySelector('[data-cart-heading-count]');
  const cartItems = document.querySelector('[data-cart-items]');
  const cartEmpty = document.querySelector('[data-cart-empty]');
  const cartSubtotal = document.querySelector('[data-cart-subtotal]');
  const drawer = document.querySelector('#shopping-bag');
  const backdrop = document.querySelector('[data-cart-backdrop]');
  const toast = document.querySelector('[data-store-toast]');
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  let cart = readCart();
  let toastTimer;

  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem('form-field-demo-cart') || '{}');
      return Object.fromEntries(Object.entries(saved).filter(([id, quantity]) => products.some((product) => product.id === Number(id)) && Number.isInteger(quantity) && quantity > 0));
    } catch (_) { return {}; }
  }

  function saveCart() {
    try { localStorage.setItem('form-field-demo-cart', JSON.stringify(cart)); } catch (_) { /* Cart still works until this page closes. */ }
  }

  function renderCatalog() {
    const query = search.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const visible = products.filter((product) => (category === 'all' || product.category === category)
      && `${product.name} ${product.detail} ${product.category}`.toLowerCase().includes(query));

    grid.innerHTML = visible.map((product) => `
      <article class="product" data-product-id="${product.id}">
        <div class="product-image tone-${product.tone}" role="img" aria-label="${product.name}, ${product.detail}">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
          <div class="product-visual art-${product.art}" aria-hidden="true"><span></span></div>
          <small class="art-caption">FORM &amp; FIELD · OBJECTS FOR EVERYDAY</small>
        </div>
        <div class="product-details"><div><span class="product-category">${product.category}</span><h3>${product.name}</h3><p>${product.detail}</p></div><strong class="product-price">${money.format(product.price)}</strong></div>
        <button class="add" type="button" data-add-product="${product.id}">Add to bag <span aria-hidden="true">+</span></button>
      </article>`).join('');
    catalogCount.textContent = `${visible.length} ${visible.length === 1 ? 'piece' : 'pieces'} to explore`;
    noProducts.hidden = visible.length > 0;
  }

  function renderCart() {
    const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
    const subtotal = products.reduce((sum, product) => sum + product.price * (cart[product.id] || 0), 0);
    bagCount.textContent = String(count);
    bagCount.parentElement.setAttribute('aria-label', `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`);
    cartHeadingCount.textContent = `(${count})`;
    cartSubtotal.textContent = money.format(subtotal);
    cartEmpty.hidden = count > 0;
    cartItems.hidden = count === 0;
    cartItems.replaceChildren();

    products.filter((product) => cart[product.id]).forEach((product) => {
      const quantity = cart[product.id];
      const row = document.createElement('article');
      row.className = 'cart-line';
      row.innerHTML = `
        <div class="cart-thumb tone-${product.tone} art-${product.art}" aria-hidden="true"><span></span></div>
        <div class="cart-line-copy"><strong>${product.name}</strong><span>${product.detail}</span><b>${money.format(product.price)}</b>
          <div class="quantity-control" aria-label="Quantity for ${product.name}">
            <button type="button" data-cart-action="decrease" data-product-id="${product.id}" aria-label="Decrease ${product.name} quantity">−</button>
            <span>${quantity}</span>
            <button type="button" data-cart-action="increase" data-product-id="${product.id}" aria-label="Increase ${product.name} quantity">+</button>
          </div>
        </div>
        <div class="cart-line-end"><strong>${money.format(product.price * quantity)}</strong><button type="button" class="remove-item" data-cart-action="remove" data-product-id="${product.id}">Remove</button></div>`;
      cartItems.append(row);
    });
  }

  function openCart() {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    document.body.classList.add('cart-is-open');
    document.querySelector('[data-open-cart]').setAttribute('aria-expanded', 'true');
    drawer.querySelector('[data-close-cart]').focus();
  }

  function closeCart() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.hidden = true;
    document.body.classList.remove('cart-is-open');
    const openButton = document.querySelector('[data-open-cart]');
    openButton.setAttribute('aria-expanded', 'false');
    openButton.focus();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  const categories = [...new Set(products.map((product) => product.category))].sort();
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.append(option);
  });

  search.addEventListener('input', renderCatalog);
  categoryFilter.addEventListener('change', renderCatalog);
  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-product]');
    if (!button) return;
    const product = products.find((item) => item.id === Number(button.dataset.addProduct));
    if (!product) return;
    cart[product.id] = (cart[product.id] || 0) + 1;
    saveCart();
    renderCart();
    showToast(`${product.name} added to your bag`);
  });
  cartItems.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;
    const id = Number(button.dataset.productId);
    const action = button.dataset.cartAction;
    if (action === 'increase') cart[id] = (cart[id] || 0) + 1;
    if (action === 'decrease') { cart[id] -= 1; if (cart[id] <= 0) delete cart[id]; }
    if (action === 'remove') delete cart[id];
    saveCart();
    renderCart();
  });
  document.querySelector('[data-open-cart]').addEventListener('click', openCart);
  document.querySelectorAll('[data-close-cart]').forEach((button) => button.addEventListener('click', closeCart));
  backdrop.addEventListener('click', closeCart);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeCart(); });

  renderCatalog();
  renderCart();
})();
