window.addEventListener('load', () => {
  const delivery = document.querySelector('#delivery');
  const icon = document.querySelector('#delivery-icon');
  if (!delivery) { return; }
  delivery.addEventListener('click', () => {
    const active = delivery.classList.toggle('active');
    icon?.classList.toggle('chevron-up', active);
  });
});
