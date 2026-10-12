const HTML_ENTITIES: Record<string,string> = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, ch => HTML_ENTITIES[ch]);
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function sanitizeExternalUrl(value: unknown): string | null {
  const raw=String(value ?? "").trim();
  if (!raw) return null;
  try {
    const url=new URL(raw, window.location.origin);
    if (!["http:","https:"].includes(url.protocol)) return null;
    return url.href;
  } catch { return null; }
}

export function sanitizeRichText(input: unknown): string {
  const html=String(input ?? "");
  const doc=new DOMParser().parseFromString(html,"text/html");
  const allowed=new Set(["P","BR","STRONG","B","EM","I","UL","OL","LI","H2","H3","H4","BLOCKQUOTE","A","CODE"]);
  const walk=(node: Node) => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType===Node.ELEMENT_NODE) {
        const el=child as HTMLElement;
        if (!allowed.has(el.tagName)) { el.replaceWith(...Array.from(el.childNodes)); return; }
        [...el.attributes].forEach(a => el.removeAttribute(a.name));
        if (el.tagName==="A") {
          const href=sanitizeExternalUrl((child as HTMLAnchorElement).getAttribute("href"));
          if (href) {
            (child as HTMLAnchorElement).href=href;
            (child as HTMLAnchorElement).rel="noopener noreferrer";
            (child as HTMLAnchorElement).target="_blank";
          } else (child as HTMLAnchorElement).removeAttribute("href");
        }
        walk(child);
      }
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

const IMAGE_TYPES=new Set(["image/jpeg","image/png","image/webp","image/avif"]);
export function validateImageUpload(file: File, maxBytes=3*1024*1024): string | null {
  if (!IMAGE_TYPES.has(file.type)) return "Only JPG, PNG, WebP or AVIF images are allowed.";
  if (file.size<=0 || file.size>maxBytes) return `Image must be smaller than ${Math.round(maxBytes/1024/1024)} MB.`;
  return null;
}

export function cleanText(value: unknown, max=500): string {
  return String(value ?? "").replace(/\u0000/g,"").trim().slice(0,max);
}
