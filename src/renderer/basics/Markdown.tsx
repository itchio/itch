import urls from "common/constants/urls";
import marked from "marked-extra";
import React from "react";

interface Props {
  source: string;
  externalLinks?: boolean;
}

// We used to import `emojify` from the `node-emoji` package to convert
// :shortcode: style emoji in markdown, but our locale files only use `:date:`.
// This minimal implementation only supports `:date:` - future translations
// should use emoji characters directly (e.g. 📅) instead of shortcodes.
const emojify = (text: string): string => {
  return text.replace(/:date:/g, "📅");
};

interface RenderOptions {
  externalLinks: boolean;
}

const renderHTML = (source: string, options: RenderOptions) => {
  const emojified = emojify(source);
  const autolinked = autolink(emojified);
  const normalized = normalizeMarkdown(autolinked);

  let html = "";
  try {
    html = marked(normalized);
  } catch (e) {
    const errorMessage =
      e instanceof Error && e.message ? e.message : "Unknown markdown error";
    html = `<p>${escapeHtml(`Markdown error: ${errorMessage}`)}</p>`;
  }

  return { __html: sanitizeRenderedHtml(html, options) };
};

const autolink = (src: string) => {
  return src.replace(
    /#([0-9]+)/g,
    (match, p1) => `[${match}](${urls.itchRepo}/issues/${p1})`
  );
};

const normalizeMarkdown = (src: string) => {
  return src.replace(/\n##/g, "\n\n##");
};

const escapeHtml = (src: string) => {
  return src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

// Strict allowlist sanitizer for marked output.
const allowedTags = new Set([
  "a",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);

const allowedAttributes: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  img: new Set(["src", "alt", "title"]),
  th: new Set(["colspan", "rowspan"]),
  td: new Set(["colspan", "rowspan"]),
};

const isSafeUrl = (value: string, allowMailto: boolean): boolean => {
  const url = value.trim();
  if (!url) {
    return false;
  }

  if (
    url.startsWith("#") ||
    url.startsWith("/") ||
    url.startsWith("./") ||
    url.startsWith("../")
  ) {
    return true;
  }

  try {
    const parsed = new URL(url, "https://itch.io");
    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      (allowMailto && parsed.protocol === "mailto:")
    );
  } catch (e) {
    return false;
  }
};

const isSafeCellSpan = (value: string): boolean => {
  return /^[1-9][0-9]{0,2}$/.test(value.trim());
};

const sanitizeAttributes = (
  source: Element,
  target: Element,
  tagName: string
) => {
  const allowed = allowedAttributes[tagName];
  if (!allowed) {
    return;
  }

  for (const attr of Array.from(source.attributes)) {
    const name = attr.name.toLowerCase();
    if (!allowed.has(name)) {
      continue;
    }

    const value = attr.value.trim();
    if (!value) {
      continue;
    }

    if (name === "href") {
      if (!isSafeUrl(value, true)) {
        continue;
      }
      target.setAttribute("href", value);
      continue;
    }

    if (name === "src") {
      if (!isSafeUrl(value, false)) {
        continue;
      }
      target.setAttribute("src", value);
      continue;
    }

    if ((name === "colspan" || name === "rowspan") && !isSafeCellSpan(value)) {
      continue;
    }

    target.setAttribute(name, value);
  }
};

const sanitizeNode = (
  source: Node,
  target: Node,
  outDoc: Document,
  options: RenderOptions
): void => {
  if (source.nodeType === Node.TEXT_NODE) {
    target.appendChild(outDoc.createTextNode(source.textContent || ""));
    return;
  }

  if (source.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const sourceElement = source as Element;
  const tagName = sourceElement.tagName.toLowerCase();

  if (!allowedTags.has(tagName)) {
    for (const child of Array.from(sourceElement.childNodes)) {
      sanitizeNode(child, target, outDoc, options);
    }
    return;
  }

  const safeElement = outDoc.createElement(tagName);
  sanitizeAttributes(sourceElement, safeElement, tagName);

  if (tagName === "a") {
    const href = safeElement.getAttribute("href");
    if (!href) {
      for (const child of Array.from(sourceElement.childNodes)) {
        sanitizeNode(child, target, outDoc, options);
      }
      return;
    }
    if (options.externalLinks) {
      safeElement.setAttribute("target", "_popout");
    }
    safeElement.setAttribute("rel", "noopener noreferrer");
  }

  if (tagName === "img") {
    if (!safeElement.getAttribute("src")) {
      const alt = sourceElement.getAttribute("alt");
      if (alt) {
        target.appendChild(outDoc.createTextNode(alt));
      }
      return;
    }
  }

  for (const child of Array.from(sourceElement.childNodes)) {
    sanitizeNode(child, safeElement, outDoc, options);
  }

  target.appendChild(safeElement);
};

const sanitizeRenderedHtml = (src: string, options: RenderOptions): string => {
  if (typeof DOMParser === "undefined" || typeof document === "undefined") {
    return escapeHtml(src);
  }

  const parsed = new DOMParser().parseFromString(src, "text/html");
  const outDoc = document.implementation.createHTMLDocument("");
  const container = outDoc.createElement("div");

  for (const child of Array.from(parsed.body.childNodes)) {
    sanitizeNode(child, container, outDoc, options);
  }

  return container.innerHTML;
};

const Markdown = ({ source, externalLinks = false }: Props) => {
  return (
    <div
      dangerouslySetInnerHTML={renderHTML(source, {
        externalLinks,
      })}
    />
  );
};

export default React.memo(Markdown);
