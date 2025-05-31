window.addEventListener('load', () => {
  const description = document.querySelector('#description');
  const descriptionIcon = document.querySelector('#description-icon');
  var descriptionActive = false;
  description.addEventListener('click', toggleDescription);

  function toggleDescription(){
    descriptionActive = !descriptionActive;
    descriptionActive ? description.classList.add("active") : description.classList.remove("active");
    descriptionActive ? descriptionIcon.classList.add("minus") : descriptionIcon.classList.remove("minus");
  }
});