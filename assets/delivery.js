
window.addEventListener("load", function(){
  const delivery = document.querySelector('#delivery');
  const deliveryIcon = document.querySelector('#delivery-icon');
  var deliveryActive = false;
  delivery.addEventListener('click', toggleDelivery);

  function toggleDelivery(){
    deliveryActive = !deliveryActive;
    deliveryActive ? delivery.classList.add("active") : delivery.classList.remove("active");
    deliveryActive ? deliveryIcon.classList.add("minus") : deliveryIcon.classList.remove("minus");
  }
});
