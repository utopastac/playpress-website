
window.addEventListener("load", function(){
  const images = document.querySelectorAll('.page-image');
  const galleryLightbox = document.querySelector('#gallery-lightbox');
  galleryLightbox.addEventListener('click', closeGallery);

  images.forEach((image) => {
    image.addEventListener('click', openGallery);
    
  });

  function openGallery(event){
    const index = event.target.getAttribute("data-index");
    const imageTarget = galleryLightbox.querySelector(`[data-index="${index}"]`);
    
    const currentScroll = document.body.scrollTop;
    //document.body.classList.add("fixed");
    //document.body.scrollTo(0, currentScroll);
    //galleryLightbox.classList.add("active");

    gsap.to(galleryLightbox, {autoAlpha: 1, duration: 0.25});

    const rect = imageTarget.getBoundingClientRect();
    galleryLightbox.scrollTo(0, 0);
    galleryLightbox.scrollTo(0, rect.top-40);

    
    
  }

  function closeGallery(){
    document.body.classList.remove("fixed");
    //galleryLightbox.classList.remove("active");
    gsap.to(galleryLightbox, {autoAlpha: 0, duration: 0.2});
  }
});
