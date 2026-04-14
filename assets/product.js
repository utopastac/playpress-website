
window.addEventListener("load", function(){
  const images = document.querySelectorAll('.page-image');
  const galleryLightbox = document.querySelector('#gallery-lightbox');
  if (!galleryLightbox) {
    return;
  }

  galleryLightbox.addEventListener('click', closeGallery);

  images.forEach((image) => {
    image.addEventListener('click', openGallery);
  });

  function openGallery(event){
    const index = event.target.getAttribute("data-index");
    const imageTarget = galleryLightbox.querySelector(`[data-index="${index}"]`);
    if (!imageTarget) {
      return;
    }

    document.body.style.top = `-${window.scrollY}px`;
    document.body.classList.add("fixed");

    galleryLightbox.classList.add("is-visible");

    const rect = imageTarget.getBoundingClientRect();
    galleryLightbox.scrollTo(0, 0);
    galleryLightbox.scrollTo(0, rect.top - 40);
  }

  function closeGallery(){
    document.body.classList.remove("fixed");
    const scrollY = document.body.style.top;
    galleryLightbox.classList.remove("is-visible");
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }
});
