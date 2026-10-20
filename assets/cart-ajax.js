window.addEventListener('load', () => {
  const cartRoot = document.querySelector('div[is="cart"]');
  const cartJsUrl = cartRoot?.dataset.cartUrl ?? `${getRoutesRoot()}cart.js`;
  const cartAddUrl = cartRoot?.dataset.cartAddUrl ?? `${getRoutesRoot()}cart/add.js`;
  const cartUpdateUrl = cartRoot?.dataset.cartUpdateUrl ?? `${getRoutesRoot()}cart/update.js`;
  const cartChangeUrl = cartRoot?.dataset.cartChangeUrl ?? `${getRoutesRoot()}cart/change.js`;
  const discountRoot = cartRoot?.dataset.discountRoot ?? `${getRoutesRoot()}discount/`;
  const checkoutUrl = cartRoot?.dataset.checkoutUrl ?? `${getRoutesRoot()}checkout`;
  const postageThresholdCents = Number(cartRoot?.dataset.postageThreshold) || 1000;
  const ukShippingCents = Number(cartRoot?.dataset.ukShippingCents) || 0;
  const ukShippingLabel = cartRoot?.dataset.ukShippingLabel || 'Charged at checkout';
  let appliedDiscountCode = '';

  // Capture phase so cart page adds skip the global cart-modal handler
  cartRoot?.addEventListener('click', (e) => {
    const suggestBtn = e.target.closest('#cart-suggest .add-to-cart');
    if (suggestBtn) {
      e.preventDefault();
      e.stopPropagation();
      const suggest = suggestBtn.closest('#cart-suggest');
      const variantId = suggest?.getAttribute('data-variant-id') || suggestBtn.getAttribute('data-id');
      if (!variantId) { return; }
      addEasyAddItem(variantId, suggestBtn, suggest);
      return;
    }

    const easyAddBtn = e.target.closest('.cart-easy-add .add-to-cart');
    if (!easyAddBtn) { return; }

    e.preventDefault();
    e.stopPropagation();

    const productItem = easyAddBtn.closest('.product-item');
    const variantId = productItem?.getAttribute('data-id');
    if (!variantId) { return; }

    addEasyAddItem(variantId, easyAddBtn, productItem);
  }, true);

  cartRoot?.addEventListener('click', (e) => {
    const quantityBtn = e.target.closest('.quantity button');
    if (quantityBtn) {
      e.preventDefault();
      const plus = quantityBtn.classList.contains('plus');
      const input = quantityBtn.parentElement?.querySelector('input');
      if (!input) { return; }
      const value = Number(input.value);
      const item = quantityBtn.closest('.cart-item');
      const key = item?.getAttribute('data-key');
      if (!key) { return; }
      if (!plus && value <= 1) {
        removeCartItem(item, key);
        return;
      }
      input.value = plus ? value + 1 : value - 1;
      changeItemQuantity(key, input.value);
      return;
    }

    const removeBtn = e.target.closest('.remove-item');
    if (removeBtn) {
      e.preventDefault();
      const item = removeBtn.closest('.cart-item');
      const key = item?.getAttribute('data-key');
      if (!key) { return; }
      removeCartItem(item, key);
    }
  });

  document.querySelector('#discount-toggle')?.addEventListener('click', () => {
    toggleDiscountForm();
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

  async function addEasyAddItem(variantId, button, productItem) {
    button.classList.add('button-loading');
    button.disabled = true;

    try {
      const addRes = await fetch(cartAddUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(variantId), quantity: 1 }] }),
      });
      if (!addRes.ok) { throw new Error('Add to cart failed'); }

      const cartRes = await fetch(cartJsUrl, { headers: { Accept: 'application/json' } });
      if (!cartRes.ok) { throw new Error('Cart fetch failed'); }
      const cart = await cartRes.json();

      syncCartItems(cart);
      updateCartSummary(cart);

      const removedVariantId = productItem?.getAttribute('data-variant-id')
        || productItem?.getAttribute('data-id')
        || variantId;
      productItem?.remove();

      if (removedVariantId) {
        document.querySelector(
          `.cart-easy-add .product-item[data-id="${CSS.escape(String(removedVariantId))}"]`,
        )?.remove();
      }

      const grid = document.querySelector('.cart-easy-add [is="product-promos"] > div');
      if (!grid?.querySelector('.product-item')) {
        document.querySelector('.cart-easy-add')?.setAttribute('hidden', '');
      }
    } catch (err) {
      console.error('Easy add failed:', err);
      button.classList.remove('button-loading');
      button.disabled = false;
    }
  }

  function syncCartItems(cart) {
    const list = document.querySelector('#cart-table ul');
    if (!list) { return; }

    const format = getMoneyFormat();
    const existingKeys = new Set();

    cart.items.forEach(item => {
      existingKeys.add(item.key);
      let el = list.querySelector(`[data-key="${CSS.escape(item.key)}"]`);

      if (!el) {
        el = list.querySelector(`[data-variant-id="${CSS.escape(String(item.variant_id))}"]`);
      }

      if (el) {
        el.setAttribute('data-key', item.key);
        el.setAttribute('data-variant-id', String(item.variant_id));
        el.setAttribute('data-product-id', String(item.product_id));
        const input = el.querySelector('.quantity input');
        if (input) {
          input.value = item.quantity;
          input.id = `updates_${item.id}`;
        }
        const priceEl = el.querySelector('.price');
        if (priceEl) { priceEl.textContent = formatMoney(item.final_line_price, format); }
        return;
      }

      const created = createCartItemElement(item, format);
      if (created) { list.appendChild(created); }
    });

    list.querySelectorAll('.cart-item').forEach(el => {
      const key = el.getAttribute('data-key');
      if (key && !existingKeys.has(key)) { el.remove(); }
    });
  }

  function createCartItemElement(item, format) {
    const template = document.querySelector('#cart-item-template');
    if (!template) { return null; }

    const el = template.content.firstElementChild.cloneNode(true);
    el.setAttribute('data-key', item.key);
    el.setAttribute('data-variant-id', String(item.variant_id));
    el.setAttribute('data-product-id', String(item.product_id));

    const imageLink = el.querySelector('.image a');
    const image = el.querySelector('.image img');
    const titleLink = el.querySelector('.title a');
    const input = el.querySelector('.quantity input');
    const priceEl = el.querySelector('.price');

    if (imageLink) { imageLink.href = item.url; }
    if (image) {
      image.src = item.image ?? '';
      image.alt = item.product_title ?? '';
    }
    if (titleLink) {
      titleLink.href = item.url;
      titleLink.textContent = item.product_title ?? '';
    }
    if (input) {
      input.value = item.quantity;
      input.id = `updates_${item.id}`;
    }
    if (priceEl) { priceEl.textContent = formatMoney(item.final_line_price, format); }

    return el;
  }

  function clearCartUi() {
    document.querySelector('#cart-table')?.remove();
    document.querySelector('.cart-easy-add')?.remove();
    document.querySelector('#checkout-button')?.remove();
    document.querySelector('.cart-discount')?.remove();
    document.querySelector('.cart-totals')?.remove();
    document.querySelector('div[is="checkout"]')?.remove();
    const title = document.querySelector('#main-title');
    if (title) { title.textContent = 'Your cart is empty'; }
    resetPrices(formatMoney(0, getMoneyFormat()), 0);
  }

  function removeCartItem(item, key) {
    fetch(cartChangeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity: 0 }),
    })
      .then(res => { if (!res.ok) { throw new Error('Cart update failed'); } return res.json(); })
      .then(data => {
        if (data.items.length === 0) {
          clearCartUi();
        } else {
          item?.remove();
          updateCartSummary(data);
        }
      })
      .catch(err => console.error('Remove item failed:', err));
  }

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
    const met = cart.total_price >= postageThresholdCents;
    const shippingCents = met ? 0 : ukShippingCents;
    const totalWithShipping = cart.total_price + shippingCents;

    cart.items.forEach(item => {
      const priceEl = document.querySelector(`[data-key="${CSS.escape(item.key)}"] .price`);
      if (priceEl) { priceEl.textContent = formatMoney(item.final_line_price, format); }
      const input = document.querySelector(`[data-key="${CSS.escape(item.key)}"] .quantity input`);
      if (input) { input.value = item.quantity; }
    });

    const discountRow = document.querySelector('#cart-discount-row');
    const subtotalEl = document.querySelector('.subtotal-price');
    const discountEl = document.querySelector('.discount-price');
    const shippingEl = document.querySelector('.shipping-price');

    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(
        hasDiscount ? cart.original_total_price : cart.total_price,
        format,
      );
    }

    if (hasDiscount) {
      discountRow?.removeAttribute('hidden');
      if (discountEl) {
        discountEl.textContent = `−${formatMoney(cart.total_discount, format)}`;
      }
      if (appliedDiscountCode) {
        updateDiscountChip(appliedDiscountCode);
      }
    } else {
      appliedDiscountCode = '';
      updateDiscountChip('');
      discountRow?.setAttribute('hidden', '');
    }

    if (shippingEl) {
      shippingEl.textContent = met
        ? 'Free'
        : (ukShippingCents > 0 ? formatMoney(ukShippingCents, format) : ukShippingLabel);
    }

    resetPrices(formatMoney(totalWithShipping, format), cart.item_count);
    updatePostageUi(cart.total_price, format);
  }

  function updatePostageUi(totalCents, format) {
    const met = totalCents >= postageThresholdCents;
    const remaining = Math.max(0, postageThresholdCents - totalCents);
    const progress = met
      ? 100
      : Math.min(100, Math.round((totalCents / postageThresholdCents) * 100));

    const postage = document.querySelector('#cart-postage');
    const message = document.querySelector('#cart-postage-message');
    const bar = document.querySelector('#cart-postage-bar');
    const barFill = document.querySelector('#cart-postage-bar-fill');
    const delivery = document.querySelector('#delivery');

    postage?.classList.toggle('cart-postage--met', met);
    postage?.classList.toggle('cart-postage--under', !met);

    if (message) {
      message.textContent = met
        ? "You've unlocked free UK delivery"
        : `Add ${formatMoney(remaining, format)} more for free UK delivery`;
    }

    if (bar) { bar.setAttribute('aria-valuenow', String(progress)); }
    if (barFill) { barFill.style.width = `${progress}%`; }

    const suggest = document.querySelector('#cart-suggest');
    if (suggest) {
      const suggestProductId = suggest.getAttribute('data-product-id');
      const suggestInCart = suggestProductId
        && document.querySelector(
          `#cart-table .cart-item[data-product-id="${CSS.escape(suggestProductId)}"]`,
        );
      if (met || suggestInCart) {
        suggest.setAttribute('hidden', '');
      } else {
        suggest.removeAttribute('hidden');
      }
    }

    if (!delivery) { return; }

    delivery.classList.toggle('postage-met', met);
    delivery.classList.toggle('postage-under', !met);

    const charge = delivery.querySelector('[data-postage-uk-charge]');
    const chargeLabel = delivery.dataset.postageCharge || ukShippingLabel;

    if (charge) {
      charge.textContent = met ? 'Free' : chargeLabel;
    }
  }

  function toggleDiscountForm(forceOpen) {
    const root = document.querySelector('#cart-discount');
    const toggle = document.querySelector('#discount-toggle');
    const form = document.querySelector('#discount-form');
    if (!toggle || !form) { return; }

    const open = forceOpen === true
      ? true
      : forceOpen === false
        ? false
        : form.hasAttribute('hidden');

    if (open) {
      form.removeAttribute('hidden');
      root?.classList.add('cart-discount--open');
      toggle.setAttribute('aria-expanded', 'true');
      document.querySelector('#discount-code')?.focus();
    } else {
      form.setAttribute('hidden', '');
      root?.classList.remove('cart-discount--open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function updateDiscountChip(code) {
    const chips = document.querySelector('#discount-chips');
    const label = document.querySelector('#discount-chip-label');
    const input = document.querySelector('#discount-code');

    if (code) {
      if (label) { label.textContent = code; }
      chips?.removeAttribute('hidden');
      if (input) { input.value = ''; }
      toggleDiscountForm(false);
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
