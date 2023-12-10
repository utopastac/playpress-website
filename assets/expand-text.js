window.addEventListener('load', () => {
  const textElement = document.getElementById("description-text");
  const originalTextNodes = textElement.querySelectorAll("p");
  const readMore = document.createElement("p");
  readMore.innerHTML = "Full description";
  readMore.classList.add("read-more");
  let hidden = false;
  switchText();
  

  textElement.addEventListener('click', (e) => {
    switchText();
  });

  function switchText(){
    textElement.innerHTML = "";
    if(hidden){
      for (var i = 0; i < originalTextNodes.length; i++) {
        textElement.append(originalTextNodes[i]);
      }
    } else {
      textElement.append(originalTextNodes[0]);
      textElement.append(readMore);
    }
    hidden = !hidden;
  }
});