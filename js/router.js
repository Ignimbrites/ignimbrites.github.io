// A small hash router.
//
// Why the hash? A static host (like GitHub Pages) only serves files that exist
// at a path. Routes live after the "#", which the server never sees, so every
// request resolves to index.html and the app boots from the root. Navigation is
// just the hash changing, so plain <a href="#/about"> links need no handlers.

import { routes, notFound } from "./routes.js";

const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fetched page fragments are cached so re-visiting a page is instant.
const fragmentCache = new Map();

/**
 * Turn location.hash into a route path.
 * "" / "#" / "#/"  -> "/"           (home)
 * "#/about"        -> "/about"      (a route)
 * "#main", "#foo"  -> null          (in-page anchor, not a route — leave it be)
 */
function parseHash() {
  const h = location.hash;
  if (h === "" || h === "#" || h === "#/") return "/";
  if (h.startsWith("#/")) return h.slice(1);
  return null;
}

function matchPath(pattern, path) {
  const pp = pattern.split("/").filter(Boolean);
  const sp = path.split("/").filter(Boolean);
  if (pp.length !== sp.length) return null;

  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) {
      params[pp[i].slice(1)] = decodeURIComponent(sp[i]);
    } else if (pp[i] !== sp[i]) {
      return null;
    }
  }
  return params;
}

function matchRoute(path) {
  for (const route of routes) {
    const params = matchPath(route.path, path);
    if (params) return { route, params };
  }
  return { route: notFound, params: {} };
}

async function fetchFragment(src) {
  if (fragmentCache.has(src)) return fragmentCache.get(src);
  // Resolve against document.baseURI so paths work from a domain root or a
  // project subpath like /repo/ without any configuration.
  const res = await fetch(new URL(src, document.baseURI));
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${src}`);
  const html = await res.text();
  fragmentCache.set(src, html);
  return html;
}

async function resolveContent(route, params) {
  if (typeof route.render === "function") return route.render(params);
  if (route.fragment) {
    try {
      return await fetchFragment(route.fragment);
    } catch (err) {
      console.error("[router]", err);
      return `<section class="section"><div class="wrap article-wrap">
        <p class="eyebrow">Error</p>
        <h1>Couldn't load this page</h1>
        <p class="muted">Something went wrong fetching this view. Try again, or head back <a class="link" href="#/">home</a>.</p>
      </div></section>`;
    }
  }
  return "";
}

// Guards against a slow fetch landing after a newer navigation has started.
let navToken = 0;

async function render() {
  const path = parseHash();
  if (path === null) return; // in-page anchor — not ours to handle

  const token = ++navToken;
  const { route, params } = matchRoute(path);
  const content = await resolveContent(route, params);
  if (token !== navToken) return; // superseded by a newer navigation

  const baseTitle =
    typeof route.title === "function" ? route.title(params) : route.title;

  const main = document.getElementById("main");
  const update = () => {
    // Set the title first; a rendered component (e.g. <blog-post>) may refine it
    // when it upgrades during the innerHTML assignment below.
    document.title = `${baseTitle} — ignimbrites`;
    main.innerHTML = content;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  if (document.startViewTransition && !reduceMotion()) {
    try {
      await document.startViewTransition(update).finished;
    } catch {
      /* a skipped/aborted transition still reaches the end state */
    }
  } else {
    update();
  }

  updateActiveLinks(path);
  // Move keyboard/AT focus into the freshly rendered view, without scrolling.
  main.focus({ preventScroll: true });
}

/** Mark the current nav link with aria-current="page". */
export function updateActiveLinks(path = parseHash()) {
  if (path === null) return;
  const links = document.querySelectorAll("[data-nav] a[href^='#']");
  links.forEach((a) => {
    const target = hrefToPath(a.getAttribute("href"));
    if (target === null) return;
    const isActive =
      target === path || (target !== "/" && path.startsWith(target + "/"));
    if (isActive) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function hrefToPath(href) {
  if (!href) return null;
  if (href === "#" || href === "#/") return "/";
  if (href.startsWith("#/")) return href.slice(1);
  return null;
}

export function startRouter() {
  window.addEventListener("hashchange", render);

  // The header/footer fragments load asynchronously. When a fragment arrives,
  // re-apply the active-link state and fill in the footer year.
  document.addEventListener("html-include:load", () => {
    updateActiveLinks();
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  });

  render();
}
