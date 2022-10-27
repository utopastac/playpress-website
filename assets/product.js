
window.addEventListener("load", function(){
  const images = document.querySelectorAll('.image');
  const galleryLightbox = document.querySelector('#gallery-lightbox');
  galleryLightbox.addEventListener('click', closeGallery);

  images.forEach((image) => {
    image.addEventListener('click', openGallery);
    
  });

  function openGallery(){
    document.body.classList.add("fixed");
    galleryLightbox.classList.add("active");
  }

  function closeGallery(){
    document.body.classList.remove("fixed");
    galleryLightbox.classList.remove("active");
  }
});
