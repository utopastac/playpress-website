window.addEventListener('load', () => {
  const items = document.querySelectorAll('.accordion-item');
  const images = document.querySelectorAll('.accordion-image');

  if (!items.length) { return; }

  items.forEach(item => item.addEventListener('click', function () {
    const index = Array.prototype.indexOf.call(items, this);
    switchItem(index);
  }));

  function switchItem(index) {
    if (index < 0 || index >= items.length) { return; }
    items.forEach(item => item.classList.remove('active'));
    images.forEach(image => image.classList.remove('active'));
    items[index].classList.add('active');
    if (index < images.length) { images[index].classList.add('active'); }
  }

  switchItem(0);
});
