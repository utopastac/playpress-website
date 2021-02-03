// @license © 2019 Google LLC. Licensed under the Apache License, Version 2.0.
const doc = document;
const store = localStorage;
const PREFERS_COLOR_SCHEME = "prefers-color-scheme";
const MEDIA = "media";
const LIGHT = "light";
const DARK = "dark";
const MQ_DARK = `(${PREFERS_COLOR_SCHEME}:${DARK})`;
const MQ_LIGHT = `(${PREFERS_COLOR_SCHEME}:${LIGHT})`;
const LINK_REL_STYLESHEET = "link[rel=stylesheet]";
const MODE = "mode";
const LABEL = "label";
const COLOR_SCHEME_CHANGE = "colorschemechange";
const PERMANENT_COLOR_SCHEME = "permanentcolorscheme";
const ALL = "all";
const NOT_ALL = "not all";
const NAME = "dark-mode-toggle";

const installStringReflection = (obj, attrName, propName = attrName) => {
  Object.defineProperty(obj, propName, {
    enumerable: true,
    get() {
      const value = this.getAttribute(attrName);
      return value === null ? "" : value;
    },
    set(v) {
      this.setAttribute(attrName, v);
    },
  });
};

const template = doc.createElement("template");

template.innerHTML = `
<style>
  :host {
    contain: content;
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  [part="form"] {
    display: flex;
  }

  [part="input"],
  [part="label"] {
    cursor: pointer;
  }

  [part="input"] {
    opacity: 0;
    pointer-events: none;
    position: absolute;
  }

  [part="label"] {
    align-items: center;
    display: flex;
    color: var(--${NAME}-label, inherit);
    font: inherit;
    font-weight: 700;
    min-height: 2rem;
    position: relative;
    padding-right: 4.5rem;
    -webkit-tap-highlight-color: transparent;
    text-align: right;
    user-select: none;
  }

  [part="label"]::before {
    background: var(--${NAME}-track, transparent);
    border-radius: 500rem;
    content: "";
    display: block;
    height: 2rem;
    position: absolute;
    right: 0;
    top: 0;
    width: 3.5rem;
  }

  [part="label"]::after {
    background: var(--${NAME}-thumb, transparent);
    border-radius: 100%;
    content: "";
    display: block;
    height: calc(2rem - 6px);
    position: absolute;
    right: 0;
    top: 3px;
    transform: translateX(calc(-1.5rem - 2px));
    width: calc(2rem - 6px);
  }

  @media (prefers-reduced-motion: no-preference) {
    [part="label"]::after {
      transition: transform 0.2s;
    }
  }

  [part="input"]:checked + [part="label"]::after {
    transform: translateX(-4px);
  }

  [part="input"]:focus-visible + [part="label"]::before {
    background: var(--${NAME}-focus, transparent);
  }
</style>
<form part="form">
  <input part="input" id="t" type="checkbox">
  <label part="label" for="t"></label>
</form>
`;

export class DarkModeToggle extends HTMLElement {
  static get observedAttributes() {
    return [MODE, LABEL];
  }

  constructor() {
    super();

    installStringReflection(this, MODE);
    installStringReflection(this, LABEL);

    this._darkCSS = null;
    this._lightCSS = null;

    doc.addEventListener(COLOR_SCHEME_CHANGE, (event) => {
      this.mode = event.detail.colorScheme;
      this._updateCheckbox();
    });

    doc.addEventListener(PERMANENT_COLOR_SCHEME, (event) => {
      this.permanent = event.detail.permanent;
      this._permanentCheckbox.checked = this.permanent;
    });

    this._initializeDOM();
  }

  _initializeDOM() {
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(template.content.cloneNode(true));

    // We need to support `media="(prefers-color-scheme: dark)"` (with space)
    // and `media="(prefers-color-scheme:dark)"` (without space)
    this._darkCSS = doc.querySelectorAll(
      `${LINK_REL_STYLESHEET}[${MEDIA}*=${PREFERS_COLOR_SCHEME}][${MEDIA}*="${DARK}"]`
    );
    this._lightCSS = doc.querySelectorAll(
      `${LINK_REL_STYLESHEET}[${MEDIA}*=${PREFERS_COLOR_SCHEME}][${MEDIA}*="${LIGHT}"]`
    );

    // Get DOM references.
    this._darkCheckbox = shadowRoot.querySelector("[part=input]");
    this._checkboxLabel = shadowRoot.querySelector("[part=label]");

    // Does the browser support native `prefers-color-scheme`?
    const hasNativePrefersColorScheme = matchMedia(MQ_DARK).media !== NOT_ALL;
    // Listen to `prefers-color-scheme` changes.
    if (hasNativePrefersColorScheme) {
      matchMedia(MQ_DARK).addListener(({ matches }) => {
        this.mode = matches ? DARK : LIGHT;
        this._dispatchEvent(COLOR_SCHEME_CHANGE, { colorScheme: this.mode });
      });
    }
    // Set initial state, giving preference to a remembered value, then the
    // native value (if supported), and eventually defaulting to a light
    // experience.
    const rememberedValue = store.getItem(NAME);
    if (rememberedValue && [DARK, LIGHT].includes(rememberedValue)) {
      this.mode = rememberedValue;
    } else if (hasNativePrefersColorScheme) {
      this.mode = matchMedia(MQ_LIGHT).matches ? LIGHT : DARK;
    }
    if (!this.mode) {
      this.mode = LIGHT;
    }
    if (!rememberedValue) {
      store.setItem(NAME, this.mode);
    }

    // Make the checkbox reflect the state of the radios
    this._updateCheckbox();

    this._darkCheckbox.addEventListener("change", () => {
      this.mode = this._darkCheckbox.checked ? DARK : LIGHT;
      this._dispatchEvent(COLOR_SCHEME_CHANGE, { colorScheme: this.mode });
    });

    // Finally update the mode and let the world know what's going on
    this._updateMode();
    this._dispatchEvent(COLOR_SCHEME_CHANGE, { colorScheme: this.mode });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === MODE) {
      if (![LIGHT, DARK].includes(newValue)) {
        throw new RangeError(`Allowed values: "${LIGHT}" and "${DARK}".`);
      }
      store.setItem(NAME, this.mode);
      this._updateCheckbox();
      this._updateMode();
    } else if (name === LABEL) {
      this._checkboxLabel.textContent = newValue;
    }
  }

  _dispatchEvent(type, value) {
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        composed: true,
        detail: value,
      })
    );
  }

  _updateCheckbox() {
    if (this.mode === LIGHT) {
      this._darkCheckbox.checked = false;
    } else {
      this._darkCheckbox.checked = true;
    }
  }

  _updateMode() {
    if (this.mode === LIGHT) {
      this._lightCSS.forEach((link) => {
        link.media = ALL;
        link.disabled = false;
      });
      this._darkCSS.forEach((link) => {
        link.media = NOT_ALL;
        link.disabled = true;
      });
    } else {
      this._darkCSS.forEach((link) => {
        link.media = ALL;
        link.disabled = false;
      });
      this._lightCSS.forEach((link) => {
        link.media = NOT_ALL;
        link.disabled = true;
      });
    }
  }
}

customElements.define(NAME, DarkModeToggle);
