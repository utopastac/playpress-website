window.addEventListener('load', () => {
  let hideTimeout = null;
  let addButton = null;

  const cartModal = document.querySelector('#cart-modal');
  const cartModalClose = document.querySelector('#cart-modal-close');

  if (cartModalClose) {
    cartModalClose.addEventListener('click', hideModal);
  }

  if (cartModal) {
    cartModal.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    cartModal.addEventListener('mouseleave', () => { hideTimeout = setTimeout(hideModal, 2000); });
  }

  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      addButton = button;
      const productItem = button.closest('.product-item');
      if (!productItem) { return; }
      const id = productItem.getAttribute('data-id');
      const isMainProduct = productItem.getAttribute('data-main-product') === 'true';
      let quantity = 1;
      if (isMainProduct) {
        const input = document.querySelector('#quantity');
        if (input) { quantity = Number(input.value) || 1; }
      }
      button.classList.add('button-loading');
      addToCart(id, quantity);
    });
  });

  async function addToCart(id, quantity) {
    try {
      const addRes = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id, quantity }] }),
      });
      if (!addRes.ok) { throw new Error('Add to cart failed'); }
      const data = await addRes.json();
      showModal(data.items[0], quantity);

      const cartRes = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
      if (!cartRes.ok) { throw new Error('Cart fetch failed'); }
      const cart = await cartRes.json();
      updateHeaderPrices(cart);
    } catch (err) {
      console.error(err);
      if (addButton) { addButton.classList.remove('button-loading'); }
    }
  }

  function showModal(item, quantity) {
    if (!cartModal || !item) { return; }
    addButton?.classList.remove('button-loading');

    const format = document.querySelector('[data-money-format]')?.getAttribute('data-money-format') ?? '';
    const title = quantity > 1 ? `${quantity} x ${item.product_title}` : item.product_title;

    const img = document.querySelector('#cart-modal-image');
    const titleEl = document.querySelector('#cart-modal-title');
    const priceEl = document.querySelector('#cart-modal-price');
    if (img) { img.src = item.image ?? ''; }
    if (titleEl) { titleEl.textContent = title; }
    if (priceEl) { priceEl.textContent = window.formatMoney(item.price, format); }

    cartModal.classList.add('is-visible');
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(hideModal, 5000);
  }

  function hideModal() {
    cartModal?.classList.remove('is-visible');
  }

  function updateHeaderPrices(cart) {
    const format = document.querySelector('[data-money-format]')?.getAttribute('data-money-format') ?? '';
    const totalEl = document.querySelector('#header-cart-total');
    const countEl = document.querySelector('#header-cart-item-count');
    if (totalEl) { totalEl.textContent = window.formatMoney(cart.total_price, format); }
    if (countEl) { countEl.textContent = cart.item_count; }
  }
});
