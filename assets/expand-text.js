window.addEventListener('load', () => {
  const description = document.querySelector('#description');
  const descriptionIcon = document.querySelector('#description-icon');
  var descriptionActive = false;
  description.addEventListener('click', toggleDescription);

  function toggleDescription(){
    descriptionActive = !descriptionActive;
    descriptionActive ? description.classList.add("active") : description.classList.remove("active");
    descriptionActive ? descriptionIcon.classList.add("chevron-up") : descriptionIcon.classList.remove("chevron-up");
  }

  const reviews = document.querySelector('#reviews');
  const reviewsIcon = document.querySelector('#reviews-icon');
  var reviewsActive = false;
  reviews.addEventListener('click', toggleReviews);

  function toggleReviews(){
    reviewsActive = !reviewsActive;
    reviewsActive ? reviews.classList.add("active") : reviews.classList.remove("active");
    reviewsActive ? reviewsIcon.classList.add("chevron-up") : reviewsIcon.classList.remove("chevron-up");
  }
});