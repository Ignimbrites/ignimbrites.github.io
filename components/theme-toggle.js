// <theme-toggle></theme-toggle>
//
// Switches between dark and light, persists the choice, and otherwise follows
// the operating system preference. Themes are just CSS custom properties keyed
// off the [data-theme] attribute on <html>; this element only flips that.

const STORAGE_KEY = "ignimbrites-theme";

const SUN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>`;
const MOON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"/></svg>`;

class ThemeToggle extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button type="button" class="theme-toggle">
        <span class="theme-toggle__icon"></span>
        <span class="theme-toggle__label"></span>
      </button>`;

    this.button = this.querySelector("button");
    this.button.addEventListener("click", () => this.#toggle());

    this.media = window.matchMedia("(prefers-color-scheme: dark)");
    this.media.addEventListener("change", () => {
      if (!this.#stored()) this.#render();
    });

    this.#render();
  }

  #stored() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch {
      return null;
    }
  }

  #current() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
    return this.media.matches ? "dark" : "light";
  }

  #toggle() {
    const next = this.#current() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked — the choice just won't persist across visits */
    }
    this.#render();
  }

  #render() {
    const isDark = this.#current() === "dark";
    this.button.setAttribute("aria-pressed", String(isDark));
    this.button.setAttribute(
      "aria-label",
      `Switch to ${isDark ? "light" : "dark"} theme`
    );
    this.querySelector(".theme-toggle__icon").innerHTML = isDark ? MOON : SUN;
    this.querySelector(".theme-toggle__label").textContent = isDark
      ? "Dark"
      : "Light";
  }
}

customElements.define("theme-toggle", ThemeToggle);
