window.addEventListener('load', () => {
  const cartRoot = document.querySelector('div[is="cart"]');
  const cartJsUrl = cartRoot?.dataset.cartUrl ?? `${getRoutesRoot()}cart.js`;
  const cartUpdateUrl = cartRoot?.dataset.cartUpdateUrl ?? `${getRoutesRoot()}cart/update.js`;
  const cartChangeUrl = cartRoot?.dataset.cartChangeUrl ?? `${getRoutesRoot()}cart/change.js`;
  const discountRoot = cartRoot?.dataset.discountRoot ?? `${getRoutesRoot()}discount/`;
  const checkoutUrl = cartRoot?.dataset.checkoutUrl ?? `${getRoutesRoot()}checkout`;
  let appliedDiscountCode = '';

  document.querySelectorAll('.quantity button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const plus = button.classList.contains('plus');
      const input = button.parentElement?.querySelector('input');
      if (!input) { return; }
      const value = Number(input.value);
      const key = button.closest('.cart-item')?.getAttribute('data-key');
      if (!key) { return; }
      input.value = plus ? value + 1 : Math.max(1, value - 1);
      changeItemQuantity(key, input.value);
    });
  });

  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const item = button.closest('.cart-item');
      const key = item?.getAttribute('data-key');
      if (!key) { return; }
      fetch(cartChangeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity: 0 }),
      })
        .then(res => { if (!res.ok) { throw new Error('Cart update failed'); } return res.json(); })
        .then(data => {
          if (data.items.length === 0) {
            document.querySelector('#cart-table')?.remove();
            document.querySelector('#checkout-button')?.remove();
            document.querySelector('.cart-discount')?.remove();
            document.querySelector('.cart-totals')?.remove();
            const title = document.querySelector('#main-title');
            if (title) { title.textContent = 'Your cart is empty'; }
            resetPrices(formatMoney(0, getMoneyFormat()), 0);
          } else {
            item?.remove();
            updateCartSummary(data);
          }
        })
        .catch(err => console.error('Remove item failed:', err));
    });
  });

  document.querySelector('#discount-apply')?.addEventListener('click', () => {
    const input = document.querySelector('#discount-code');
    applyDiscount(input?.value ?? '');
  });

  document.querySelector('#discount-code')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyDiscount(e.currentTarget.value ?? '');
    }
  });

  document.querySelector('#discount-chip-remove')?.addEventListener('click', () => {
    removeDiscount();
  });

  document.querySelector('#checkout-button')?.addEventListener('click', () => {
    goToCheckout();
  });

  fetch(cartJsUrl, { headers: { Accept: 'application/json' } })
    .then(res => { if (!res.ok) { throw new Error('Cart fetch failed'); } return res.json(); })
    .then(cart => {
      if (cart.item_count > 0) {
        syncAppliedDiscountFromCart(cart);
        updateCartSummary(cart);
      }
    })
    .catch(err => console.error('Cart sync failed:', err));

  function changeItemQuantity(key, quantity) {
    fetch(cartChangeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity: Number(quantity) }),
    })
      .then(res => { if (!res.ok) { throw new Error('Cart update failed'); } return res.json(); })
      .then(data => { updateCartSummary(data); })
      .catch(err => console.error('Quantity update failed:', err));
  }

  async function applyDiscount(code) {
    const trimmed = code.trim();
    if (!trimmed) {
      showDiscountMessage('Enter a discount code', 'error');
      return;
    }

    showDiscountMessage('', '');
    setDiscountLoading(true);

    try {
      const beforeCart = await fetch(cartJsUrl, { headers: { Accept: 'application/json' } })
        .then(res => { if (!res.ok) { throw new Error('Cart fetch failed'); } return res.json(); });

      await bindDiscountToCheckoutSession(trimmed);

      const updateRes = await fetch(cartUpdateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ discount: trimmed }),
      });

      if (!updateRes.ok) {
        throw new Error(`Discount application failed: ${updateRes.status}`);
      }

      const cart = await updateRes.json();

      if (isDiscountApplied(cart, trimmed, beforeCart)) {
        appliedDiscountCode = trimmed;
        updateCartSummary(cart);
        updateDiscountChip(trimmed);
        showDiscountMessage('', '');
      } else {
        appliedDiscountCode = '';
        updateDiscountChip('');
        showDiscountMessage('Enter a valid discount code', 'error');
      }
    } catch (err) {
      appliedDiscountCode = '';
      updateDiscountChip('');
      showDiscountMessage('Something went wrong. Please try again.', 'error');
      console.error('Discount apply failed:', err);
    } finally {
      setDiscountLoading(false);
    }
  }

  async function removeDiscount() {
    showDiscountMessage('', '');
    setDiscountLoading(true);

    try {
      await clearCheckoutDiscountSession();

      const updateRes = await fetch(cartUpdateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ discount: '' }),
      });

      if (!updateRes.ok) {
        throw new Error(`Discount removal failed: ${updateRes.status}`);
      }

      appliedDiscountCode = '';
      const cart = await updateRes.json();
      updateCartSummary(cart);
      updateDiscountChip('');
      const input = document.querySelector('#discount-code');
      if (input) { input.value = ''; }
    } catch (err) {
      console.error('Discount remove failed:', err);
    } finally {
      setDiscountLoading(false);
    }
  }

  function goToCheckout() {
    const checkoutPath = checkoutUrl.startsWith('http')
      ? checkoutUrl.replace(window.location.origin, '')
      : checkoutUrl;

    if (appliedDiscountCode) {
      window.location.href = `${discountRoot}${encodeURIComponent(appliedDiscountCode)}?redirect=${encodeURIComponent(checkoutPath)}`;
      return;
    }

    window.location.href = checkoutPath;
  }

  function bindDiscountToCheckoutSession(code) {
    return fetch(`${discountRoot}${encodeURIComponent(code)}`, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'same-origin',
    });
  }

  function clearCheckoutDiscountSession() {
    return fetch(`${discountRoot}none`, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'same-origin',
    });
  }

  function syncAppliedDiscountFromCart(cart) {
    const codeFromCart = cart.cart_level_discount_applications?.[0]?.title
      ?? cart.items?.flatMap(item => item.discounts ?? []).find(discount => discount.title)?.title;

    if (!codeFromCart) { return; }

    appliedDiscountCode = codeFromCart;
    updateDiscountChip(codeFromCart);
    bindDiscountToCheckoutSession(codeFromCart).catch(err => {
      console.error('Discount session sync failed:', err);
    });
  }

  function isDiscountApplied(cart, code, beforeCart) {
    const normalizedCode = code.trim().toLowerCase();

    const inCartApplications = cart.cart_level_discount_applications?.some(
      (app) => app.title?.toLowerCase() === normalizedCode,
    );

    const inLineApplications = cart.items?.some(
      (item) => item.discounts?.some((discount) => discount.title?.toLowerCase() === normalizedCode),
    );

    const totalReduced = beforeCart
      && cart.total_price < beforeCart.total_price
      && cart.total_discount > beforeCart.total_discount;

    return inCartApplications || inLineApplications || totalReduced || (
      cart.total_discount > 0 && cart.total_price < cart.original_total_price
    );
  }

  function updateCartSummary(cart) {
    const format = getMoneyFormat();
    const hasDiscount = cart.total_discount > 0 || cart.cart_level_discount_applications?.length > 0;

    cart.items.forEach(item => {
      const priceEl = document.querySelector(`[data-key="${CSS.escape(item.key)}"] .price`);
      if (priceEl) { priceEl.textContent = formatMoney(item.final_line_price, format); }
    });

    const subtotalRow = document.querySelector('#cart-subtotal-row');
    const discountRow = document.querySelector('#cart-discount-row');
    const subtotalEl = document.querySelector('.subtotal-price');
    const discountEl = document.querySelector('.discount-price');

    if (hasDiscount) {
      subtotalRow?.removeAttribute('hidden');
      discountRow?.removeAttribute('hidden');
      if (subtotalEl) {
        subtotalEl.textContent = formatMoney(cart.original_total_price, format);
      }
      if (discountEl) {
        discountEl.textContent = `−${formatMoney(cart.total_discount, format)}`;
      }
      if (appliedDiscountCode) {
        updateDiscountChip(appliedDiscountCode);
      }
    } else {
      appliedDiscountCode = '';
      updateDiscountChip('');
      subtotalRow?.setAttribute('hidden', '');
      discountRow?.setAttribute('hidden', '');
    }

    resetPrices(formatMoney(cart.total_price, format), cart.item_count);
  }

  function updateDiscountChip(code) {
    const chips = document.querySelector('#discount-chips');
    const label = document.querySelector('#discount-chip-label');
    const input = document.querySelector('#discount-code');

    if (code) {
      if (label) { label.textContent = code; }
      chips?.removeAttribute('hidden');
      if (input) { input.value = ''; }
    } else {
      chips?.setAttribute('hidden', '');
      if (label) { label.textContent = ''; }
    }
  }

  function setDiscountLoading(isLoading) {
    const applyBtn = document.querySelector('#discount-apply');
    const input = document.querySelector('#discount-code');
    if (applyBtn) { applyBtn.disabled = isLoading; }
    if (input) { input.disabled = isLoading; }
  }

  function showDiscountMessage(message, type) {
    const el = document.querySelector('#discount-message');
    if (!el) { return; }

    el.textContent = message;
    el.classList.remove('cart-discount__message--error');

    if (!message) {
      el.setAttribute('hidden', '');
      return;
    }

    el.removeAttribute('hidden');
    if (type === 'error') { el.classList.add('cart-discount__message--error'); }
  }

  function getRoutesRoot() {
    return window.Shopify?.routes?.root ?? '/';
  }

  function getMoneyFormat() {
    return document.querySelector('[data-money-format]')?.getAttribute('data-money-format') ?? '';
  }

  function resetPrices(totalPrice, totalCount) {
    document.querySelectorAll('.total-price').forEach(el => { el.textContent = totalPrice; });
    const totalEl = document.querySelector('#header-cart-total');
    const countEl = document.querySelector('#header-cart-item-count');
    if (totalEl) { totalEl.textContent = totalPrice; }
    if (countEl) { countEl.textContent = totalCount; }
  }

  function formatMoney(cents, format) {
    if (typeof cents === 'string') { cents = cents.replace('.', ''); }
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    const match = (format || '').match(placeholderRegex);
    if (!match) { return format || ''; }

    function formatWithDelimiters(number, precision = 2, thousands = ',', decimal = '.') {
      if (isNaN(number) || number == null) { return '0'; }
      number = (number / 100.0).toFixed(precision);
      const [dollars, centsStr] = number.split('.');
      return dollars.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousands}`) + (centsStr ? decimal + centsStr : '');
    }

    let value = '';
    switch (match[1]) {
      case 'amount':                                  value = formatWithDelimiters(cents, 2); break;
      case 'amount_no_decimals':                      value = formatWithDelimiters(cents, 0); break;
      case 'amount_with_comma_separator':             value = formatWithDelimiters(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = formatWithDelimiters(cents, 0, '.', ','); break;
    }
    return (format || '').replace(placeholderRegex, value);
  }
});
