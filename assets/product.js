
window.addEventListener("load", function(){
  const images = document.querySelectorAll('.image');
  const galleryLightbox = document.querySelector('#gallery-lightbox');
  galleryLightbox.addEventListener('click', closeGallery);

  images.forEach((image) => {
    image.addEventListener('click', openGallery);
    
  });

  function openGallery(event){
    const index = event.target.getAttribute("data-index");
    const imageTarget = galleryLightbox.querySelector(`[data-index="${index}"]`);
    
    document.body.classList.add("fixed");
    galleryLightbox.classList.add("active");

    const rect = imageTarget.getBoundingClientRect();
    galleryLightbox.scrollTo(0, 0);
    galleryLightbox.scrollTo(0, rect.top-40);
    
  }

  function closeGallery(){
    document.body.classList.remove("fixed");
    galleryLightbox.classList.remove("active");
  }
});
