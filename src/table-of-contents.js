function addIds() {
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const headingMap = new Map();

  headings.forEach((heading) => {
    let id = heading.id
      ? heading.id
      : heading.textContent
          .trim()
          .toLowerCase()
          .split(" ")
          .join("-")
          .replace(/[!@#$%^&*():]/gi, "")
          .replace(/\//gi, "-");

    headingMap.set(id, !isNaN(headingMap.get(id)) ? headingMap.get(id) + 1 : 0);
    if (headingMap.get(id) != 0) {
      heading.id = `${id}-${headingMap.get(id)}`;
    } else {
      heading.id = id;
    }
  });
}

class TableOfContents {
  constructor({ from, to }) {
    this.fromElement = from;
    this.toElement = to;
    this.headingElements = this.fromElement.querySelectorAll(
      "h2:not([data-ignore]), h3:not([data-ignore]), h4:not([data-ignore]), h5:not([data-ignore]), h6:not([data-ignore])"
    );
    this.tocElement = document.createElement("div");
  }

  getMostImportantHeadingLevel() {
    let mostImportantHeadingLevel = 6;
    for (let i = 0; i < this.headingElements.length; i++) {
      let headingLevel = TableOfContents.getHeadingLevel(
        this.headingElements[i]
      );
      mostImportantHeadingLevel =
        headingLevel < mostImportantHeadingLevel
          ? headingLevel
          : mostImportantHeadingLevel;
    }
    return mostImportantHeadingLevel;
  }

  static generateId(headingElement) {
    return headingElement.textContent.replace(/\s+/g, "_");
  }

  static getHeadingLevel(headingElement) {
    switch (headingElement.tagName.toLowerCase()) {
      case "h1":
        return 1;
      case "h2":
        return 2;
      case "h3":
        return 3;
      case "h4":
        return 4;
      case "h5":
        return 5;
      case "h6":
        return 6;
      default:
        return 1;
    }
  }

  generateToc() {
    let currentLevel = this.getMostImportantHeadingLevel() - 1,
      currentElement = this.tocElement;

    for (let i = 0; i < this.headingElements.length; i++) {
      let headingElement = this.headingElements[i],
        headingLevel = TableOfContents.getHeadingLevel(headingElement),
        headingLevelDifference = headingLevel - currentLevel,
        linkElement = document.createElement("a");

      if (!headingElement.id) {
        headingElement.id = TableOfContents.generateId(headingElement);
      }
      linkElement.href = `#${headingElement.id}`;
      linkElement.textContent = headingElement.textContent;

      if (headingLevelDifference > 0) {
        for (let j = 0; j < headingLevelDifference; j++) {
          let listElement = document.createElement("ol"),
            listItemElement = document.createElement("li");
          listElement.appendChild(listItemElement);
          currentElement.appendChild(listElement);
          currentElement = listItemElement;
        }
        currentElement.appendChild(linkElement);
      } else {
        for (let j = 0; j < -headingLevelDifference; j++) {
          currentElement = currentElement.parentNode.parentNode;
        }
        let listItemElement = document.createElement("li");
        listItemElement.appendChild(linkElement);
        currentElement.parentNode.appendChild(listItemElement);
        currentElement = listItemElement;
      }

      currentLevel = headingLevel;
    }

    this.toElement.appendChild(this.tocElement.firstChild);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  addIds();
  new TableOfContents({
    from: document.querySelector("body"),
    to: document.querySelector("[is='table-of-contents']"),
  }).generateToc();
});
