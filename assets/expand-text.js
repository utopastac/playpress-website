window.addEventListener('load', () => {
  const textElement = document.getElementById("description-text");
  const originalTextNodes = textElement.querySelectorAll("p");
  const readMore = document.createElement("p");
  readMore.innerHTML = "Full description";
  readMore.classList.add("read-more");
  readMore.addEventListener('click', (e) => {
    switchText();
  });
  textElement.append(readMore);
  let hidden = false;
  switchText();
  

  

  function switchText(){
    // textElement.innerHTML = "";
    hidden = !hidden;
    
    if(hidden){
      // for (var i = 0; i < originalTextNodes.length; i++) {
      //   textElement.append(originalTextNodes[i]);
      // }
      textElement.classList.add("hidden")
      readMore.innerHTML = "Full description";
    } else {
      // textElement.append(originalTextNodes[0]);
      // textElement.append(readMore);
      textElement.classList.remove("hidden")
      readMore.innerHTML = "Close";
    }
  }
});