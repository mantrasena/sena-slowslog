/**
 * HTML Normalization Engine
 * Transforms br-based content into clean paragraph structure.
 * Also strips browser-generated list elements from dash-enter patterns.
 */

export const normalizeHtmlContent = (html: string): string => {
  if (!html || !html.trim()) return "";

  const div = document.createElement("div");
  div.innerHTML = html;

  // Step 1: Unwrap any browser-auto-generated <ul>/<ol> that the user didn't intentionally create
  // We keep lists that have the explicit data-list attribute (from our bullet button)
  div.querySelectorAll("ul:not([data-list]), ol:not([data-list])").forEach((list) => {
    const items = list.querySelectorAll("li");
    const fragment = document.createDocumentFragment();
    items.forEach((li) => {
      const p = document.createElement("p");
      p.innerHTML = li.innerHTML;
      fragment.appendChild(p);
    });
    list.parentNode?.replaceChild(fragment, list);
  });

  // Step 2: Collect top-level nodes and build paragraph blocks
  const result: string[] = [];
  const nodes = Array.from(div.childNodes);

  let currentInline: string[] = [];

  const flushInline = () => {
    if (currentInline.length === 0) return;
    const joined = currentInline.join("").trim();
    if (joined) {
      result.push(`<p>${joined}</p>`);
    }
    currentInline = [];
  };

  const getOuterHTML = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node.nodeType === Node.ELEMENT_NODE) return (node as Element).outerHTML;
    return "";
  };

  const isBlockTag = (tag: string) =>
    /^(p|div|h[1-6]|blockquote|ul|ol|table|hr|pre|figure|section|article)$/i.test(tag);

  const isBr = (node: Node) =>
    node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "BR";

  for (const node of nodes) {
    if (isBr(node)) {
      // BR = paragraph boundary
      flushInline();
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (isBlockTag(tag)) {
        flushInline();

        if (tag === "div") {
          // Div might contain mixed content — recurse
          const inner = normalizeHtmlContent(el.innerHTML);
          if (inner.trim()) result.push(inner);
        } else if (tag === "p") {
          // Clean BRs inside paragraphs — split into multiple paragraphs
          const innerHtml = el.innerHTML;
          if (innerHtml.includes("<br")) {
            const parts = innerHtml.split(/<br\s*\/?>/gi);
            for (const part of parts) {
              const trimmed = part.trim();
              if (trimmed) result.push(`<p>${trimmed}</p>`);
            }
          } else {
            const trimmed = el.innerHTML.trim();
            if (trimmed) result.push(`<p>${trimmed}</p>`);
          }
        } else if (tag === "ul" || tag === "ol") {
          // Intentional list (has data-list) — keep as-is
          result.push(el.outerHTML);
        } else {
          const trimmed = el.innerHTML.trim();
          if (trimmed) result.push(el.outerHTML);
        }
        continue;
      }

      // Inline element (strong, em, a, span, img, etc.)
      if (tag === "img") {
        flushInline();
        result.push(el.outerHTML);
        continue;
      }

      currentInline.push(el.outerHTML);
      continue;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text.trim()) {
        currentInline.push(text);
      } else if (currentInline.length > 0) {
        // preserve spaces between inline elements
        currentInline.push(" ");
      }
      continue;
    }
  }

  flushInline();

  return result.join("\n");
};

/**
 * Sanitize pasted HTML — strip styles, fonts, colors but preserve structure
 */
export const sanitizePastedHtml = (html: string): string => {
  return html
    .replace(/style="[^"]*"/gi, "")
    .replace(/class="[^"]*"/gi, "")
    .replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, "$1")
    .replace(/\s*size="[^"]*"/gi, "")
    .replace(/\s*face="[^"]*"/gi, "")
    .replace(/\s*color="[^"]*"/gi, "")
    .replace(/<blockquote[^>]*>/gi, "<p>")
    .replace(/<\/blockquote>/gi, "</p>");
};
