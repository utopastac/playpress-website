window.addEventListener("load", function(){

  const copyItems = document.querySelectorAll('.copy-text');
  copyItems.forEach((item) => {
    item.addEventListener('click', copy);
  });

  function copy(e) {
    const objectToCopy = this.parentNode.querySelector(".text-to-copy");
    navigator.clipboard.writeText(objectToCopy.innerHTML);
    // alert("Copied the text: " + objectToCopy.innerHTML);
    this.classList.add("copied");
    this.innerHTML = "Copied";
  }

});