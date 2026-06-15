// <blog-post slug="native-page-transitions"></blog-post>
//
// Looks a single post up in the same JSON file the list uses, renders it, and
// sets the document title. Its <h1> shares a view-transition-name with the
// matching list card, so the title morphs into place on navigation.

import posts from "../data/posts.json" with { type: "json" };
import { escapeHTML, formatDate, slugSafe } from "../js/dom.js";

const bySlug = new Map(posts.map((p) => [slugSafe(p.slug), p]));

class BlogPost extends HTMLElement {
  static observedAttributes = ["slug"];

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.#render();
  }

  #render() {
    const slug = slugSafe(this.getAttribute("slug") || "");
    const post = bySlug.get(slug);

    if (!post) {
      document.title = "Post not found — ignimbrites";
      this.innerHTML = `
        <section class="section"><div class="wrap article-wrap">
          <p class="eyebrow">404</p>
          <h1>That post doesn't exist</h1>
          <p class="muted">The link may be out of date, or the post was renamed.</p>
          <p style="margin-top: var(--space-m)"><a class="link" href="#/blog">← Back to the build log</a></p>
        </div></section>`;
      return;
    }

    document.title = `${post.title} — ignimbrites`;

    const meta = [
      `<time datetime="${escapeHTML(post.date)}">${formatDate(post.date)}</time>`,
      post.readingMinutes
        ? `<span aria-hidden="true"> · </span>${escapeHTML(post.readingMinutes)} min read`
        : "",
    ].join("");

    const tags = (post.tags || [])
      .map((t) => `<span class="tag">${escapeHTML(t)}</span>`)
      .join("");

    this.innerHTML = `
      <section class="section"><div class="wrap">
        <article class="article-wrap">
          <p class="article__back"><a class="link" href="#/blog">← Build log</a></p>
          <header class="article__header">
            <p class="article__meta">${meta}</p>
            <h1 class="article__title" style="view-transition-name: post-${slug}">${escapeHTML(post.title)}</h1>
            ${post.excerpt ? `<p class="article__lede">${escapeHTML(post.excerpt)}</p>` : ""}
            ${tags ? `<p class="article__tags">${tags}</p>` : ""}
          </header>
          <div class="prose">${post.content || ""}</div>
          <footer class="article__footer">
            <a class="link" href="#/blog">← All posts</a>
          </footer>
        </article>
      </div></section>`;
  }
}

customElements.define("blog-post", BlogPost);
