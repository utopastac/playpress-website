window.addEventListener("load", function(){
  const items = document.querySelectorAll('.accordian-item');
  const images = document.querySelectorAll('.accordian-image');
  switchItem(0);

  items.forEach((item) => {
    item.addEventListener('click', itemClicked);
  });

  function itemClicked(e){
    const index = Array.prototype.indexOf.call(items, this);
    switchItem(index)
  }

  function switchItem(index){
    items.forEach((item) => {
      item.classList.remove("active");
    });
    images.forEach((image) => {
      image.classList.remove("active");
    });
    items[index].classList.add("active");
    images[index].classList.add("active");
  }
});
