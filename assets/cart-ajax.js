window.addEventListener("load", function(){
  document.querySelectorAll('.quantity button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const plus = button.classList.contains('plus');
      const input = button.parentElement.querySelector('input');
      const value = Number(input.value);
      const key = button.closest(".cart-item").getAttribute("data-key");
      if(plus){
        input.value = value + 1;
      } else if(value > 1){
        input.value = value - 1;
      }
      changeItemQuantity(key, input.value);
    })
  });

  function changeItemQuantity(key, quantity) {
    axios.post('/cart/change.js', {
      id: key,
      quantity
    }).then((res) => {
      const format = document.querySelector('[data-money-format]').getAttribute("data-money-format");
      const totalPrice = formatMoney(res.data.total_price, format);
      const item = res.data.items.find(item => item.key===key);
      const itemPrice = formatMoney(item.final_line_price, format);
      document.querySelector(`[data-key="${key}"] .price`).textContent = itemPrice;
      resetPrices(totalPrice);
    });
  }

  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const item = button.closest(".cart-item");
      const key = item.getAttribute("data-key");
      const format = document.querySelector('[data-money-format]').getAttribute("data-money-format");

      axios.post('/cart/change.js', {
        id: key,
        quantity: 0
      }).then((res) => {
        if(res.data.items.length === 0){
          document.querySelector('#cart-table').remove();
          document.querySelector('#checkout-button').remove();
          document.querySelector('#main-title').textContent = "Your cart is empty";
          resetPrices(formatMoney(0, format));
        } else {
          const totalPrice = formatMoney(res.data.total_price, format);
          item.remove();
          resetPrices(totalPrice);
        }
      });
    })
  });

  function resetPrices(totalPrice){
    const totalElements = document.querySelectorAll('.total-price');
    for(let i=0; i<totalElements.length; i++){
      totalElements[i].textContent = totalPrice;
    }
  }

  function formatMoney(cents, format) {
    if (typeof cents == 'string') { cents = cents.replace('.',''); }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = (format || this.money_format);
  
    function defaultOption(opt, def) {
       return (typeof opt == 'undefined' ? def : opt);
    }
  
    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ',');
      decimal   = defaultOption(decimal, '.');
  
      if (isNaN(number) || number == null) { return 0; }
  
      number = (number/100.0).toFixed(precision);
  
      var parts   = number.split('.'),
          dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
          cents   = parts[1] ? (decimal + parts[1]) : '';
  
      return dollars + cents;
    }
  
    switch(formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }
  
    return formatString.replace(placeholderRegex, value);
  };

});