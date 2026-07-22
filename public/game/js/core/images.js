/* ============================================================
   images.js — image cache/loader for the canvas realm and a
   DOM <img> helper with graceful fallback.
   If a file is missing, get() returns null and callers draw their
   built-in vector fallback, so the game never breaks.
   ============================================================ */

const cache = new Map();   // url -> { img, status: 'loading'|'ok'|'fail' }

/** Preload a url; resolves to the HTMLImageElement or null on failure. */
export function loadImage(url) {
  if (!url || typeof Image === "undefined") return Promise.resolve(null);
  const hit = cache.get(url);
  if (hit && hit.status === "ok") return Promise.resolve(hit.img);
  return new Promise((resolve) => {
    const img = new Image();
    const rec = { img, status: "loading" };
    cache.set(url, rec);
    img.onload = () => { rec.status = "ok"; resolve(img); };
    img.onerror = () => { rec.status = "fail"; resolve(null); };
    img.src = url;
  });
}

/** Non-blocking accessor for the render loop: returns the image only if already loaded OK. */
export function getImage(url) {
  const hit = cache.get(url);
  if (hit && hit.status === "ok") return hit.img;
  if (!hit) loadImage(url);     // kick off load; will be ready on a later frame
  return null;
}

export function preloadAll(urls) { return Promise.all((urls || []).filter(Boolean).map(loadImage)); }

/**
 * DOM image element with fallback.
 * imgEl(url, { alt, className, fallback })  where fallback is a DOM node
 * (e.g. an SVG) shown if the image is missing/broken.
 */
export function imgEl(url, opts = {}) {
  const wrap = document.createElement(opts.tag || "div");
  if (opts.className) wrap.className = opts.className;
  if (!url || typeof Image === "undefined") { if (opts.fallback) wrap.appendChild(opts.fallback); return wrap; }
  const im = new Image();
  im.alt = opts.alt || "";
  im.decoding = "async";
  if (opts.style) Object.assign(im.style, opts.style);
  im.style.maxWidth = im.style.maxWidth || "100%";
  im.onerror = () => { wrap.innerHTML = ""; if (opts.fallback) wrap.appendChild(opts.fallback); };
  im.src = url;
  wrap.appendChild(im);
  return wrap;
}
