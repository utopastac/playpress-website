
window.addEventListener("load", function(){
  const delivery = document.querySelector('#delivery');
  var deliveryActive = false;
  delivery.addEventListener('click', toggleDelivery);

  function toggleDelivery(){
    deliveryActive = !deliveryActive;
    deliveryActive ? delivery.classList.add("active") : delivery.classList.remove("active");
  }
});
