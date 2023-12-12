window.addEventListener("load", function(){

  let timeout = null;
  let addButton = null;

  document.querySelector('#cart-modal-close').addEventListener('click', (e) => {
    hideModal();
  });

  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      addButton = button;
      const id = button.closest(".product-item").getAttribute("data-id");
      const mainProduct = button.closest(".product-item").getAttribute("data-main-product");
      let quantity = 1;
      addButton.classList.add("button-loading");
      if(mainProduct === "true"){
        const input = document.querySelector('#quantity');
        quantity = Number(input.value);
      };
      addToCart(id, quantity);
    })
  });

  function addToCart(id, quantity) {
    axios.post('/cart/add.js', {
      'items': [{
        'id': id,
        'quantity': quantity
        }]
    }).then((res) => {
      const item = res.data.items[0];
      showModal(item, quantity);
      
      axios.get('/cart.js', {}).then((res) => {
        const format = document.querySelector('[data-money-format]').getAttribute("data-money-format");
        const totalPrice = formatMoney(res.data.total_price, format);
        const totalCount = res.data.item_count;
        resetPrices(totalPrice, totalCount);
      });
      
    });
  }

  function showModal(item, quantity){
    addButton.classList.remove("button-loading");
    const format = document.querySelector('[data-money-format]').getAttribute("data-money-format");
    const cartModal = document.querySelector('#cart-modal');
    const title = quantity > 1 ? `${quantity} x ${item.product_title}` : item.product_title;
    document.querySelector('#cart-modal-image').src = '';
    document.querySelector('#cart-modal-image').src = item.image;
    document.querySelector('#cart-modal-title').textContent = title;
    document.querySelector('#cart-modal-price').textContent = formatMoney(item.final_price, format);
    gsap.to('#cart-modal', {autoAlpha: 1, duration: 0.5});
    clearTimeout(timeout);
    timeout = setTimeout(hideModal, 4500);
    cartModal.addEventListener('mouseenter', (e) => {
      clearTimeout(timeout);
    });
    cartModal.addEventListener('mouseleave', (e) => {
      timeout = setTimeout(hideModal, 2000);
    });
  }

  function hideModal(){
    gsap.to('#cart-modal', {autoAlpha: 0, duration: 0.5});
  }

  function resetPrices(totalPrice, totalCount){
    document.querySelector('#header-cart-total').textContent = totalPrice;
    document.querySelector('#header-cart-item-count').textContent = totalCount;
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