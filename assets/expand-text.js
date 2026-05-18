window.addEventListener('load', () => {
  function makeToggle(sectionId, iconId) {
    const section = document.querySelector(sectionId);
    const icon = document.querySelector(iconId);
    if (!section) { return; }
    section.addEventListener('click', () => {
      const active = section.classList.toggle('active');
      icon?.classList.toggle('chevron-up', active);
    });
  }

  makeToggle('#description', '#description-icon');
  makeToggle('#reviews', '#reviews-icon');
});
