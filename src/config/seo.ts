export const CANONICAL_ORIGIN = 'https://auxmadopgame.bastelar.com';
export const DEFAULT_LANGUAGE = 'es';
export const CANONICAL_ROOT_URL = `${CANONICAL_ORIGIN}/`;

/**
 * Devuelve la URL canónica oficial basada exclusivamente en CANONICAL_ORIGIN.
 * La app consolida en español (idioma por defecto) en la raíz limpia https://auxmadopgame.bastelar.com/.
 */
export function getCanonicalUrl(lang?: string): string {
  if (!lang || lang === DEFAULT_LANGUAGE) {
    return CANONICAL_ROOT_URL;
  }
  return `${CANONICAL_ORIGIN}/?lang=${encodeURIComponent(lang)}`;
}

function upsertHeadLink(rel: string, href: string, hreflang?: string): void {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) {
      el.setAttribute('hreflang', hreflang);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertHeadMeta(attrName: 'property' | 'name', attrValue: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Sincroniza <link rel="canonical">, hreflang, og:url y twitter:url en <head>
 * usando siempre la constante centralizada CANONICAL_ORIGIN.
 */
export function syncSeoHeadTags(lang: string = DEFAULT_LANGUAGE): void {
  if (typeof document === 'undefined') return;
  const canonicalHref = getCanonicalUrl(lang);

  upsertHeadLink('canonical', canonicalHref);
  upsertHeadLink('alternate', CANONICAL_ROOT_URL, DEFAULT_LANGUAGE);
  upsertHeadLink('alternate', CANONICAL_ROOT_URL, 'x-default');
  upsertHeadMeta('property', 'og:url', canonicalHref);
  upsertHeadMeta('name', 'twitter:url', canonicalHref);
}
