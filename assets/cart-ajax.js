window.addEventListener('load', () => {
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
      const format = getMoneyFormat();
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity: 0 }),
      })
        .then(res => { if (!res.ok) { throw new Error('Cart update failed'); } return res.json(); })
        .then(data => {
          if (data.items.length === 0) {
            document.querySelector('#cart-table')?.remove();
            document.querySelector('#checkout-button')?.remove();
            const title = document.querySelector('#main-title');
            if (title) { title.textContent = 'Your cart is empty'; }
            resetPrices(formatMoney(0, format), 0);
          } else {
            item?.remove();
            resetPrices(formatMoney(data.total_price, format), data.item_count);
          }
        })
        .catch(err => console.error('Remove item failed:', err));
    });
  });

  function changeItemQuantity(key, quantity) {
    const format = getMoneyFormat();
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity: Number(quantity) }),
    })
      .then(res => { if (!res.ok) { throw new Error('Cart update failed'); } return res.json(); })
      .then(data => {
        const item = data.items.find(line => line.key === key);
        if (item) {
          const priceEl = document.querySelector(`[data-key="${key}"] .price`);
          if (priceEl) { priceEl.textContent = formatMoney(item.final_line_price, format); }
        }
        resetPrices(formatMoney(data.total_price, format), data.item_count);
      })
      .catch(err => console.error('Quantity update failed:', err));
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
