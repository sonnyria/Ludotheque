export function hasExactProductIdentifier(code: string, product: Record<string, unknown>): boolean {
  const canonical = (value: unknown) => String(value ?? '').replace(/\D/g, '').replace(/^0+/, '');
  const expected = canonical(code);
  return !!expected && ['barcode', 'ean', 'upc', 'gtin', 'gtin8', 'gtin12', 'gtin13', 'gtin14', 'code'].some(key => canonical(product?.[key]) === expected);
}

interface Source { title: string; url: string }

// AI confidence and citations alone are not proof. Read the cited pages.
export async function verifyBarcodeSources(
  code: string,
  title: string,
  sources: Source[],
  fetcher: typeof fetch = fetch,
  platform = '',
): Promise<Source[]> {
  const normalized = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const wantedTitle = normalized(title);
  if (!wantedTitle) return [];
  const platformPatterns: Record<string, RegExp> = {
    'PlayStation 5': /\b(?:ps5|playstation\s*5)\b/i,
    'PlayStation 4': /\b(?:ps4|playstation\s*4)\b/i,
    'PlayStation 3': /\b(?:ps3|playstation\s*3)\b/i,
    'PlayStation 2': /\b(?:ps2|playstation\s*2)\b/i,
    'PlayStation 1': /\b(?:ps1|psx|playstation\s*1)\b/i,
    'Nintendo Switch': /\bswitch\b/i,
    'Xbox One': /\bxbox\s*one\b/i,
    'Xbox 360': /\bxbox\s*360\b/i,
    'Xbox Series X|S': /\bxbox\s*series\b/i,
  };
  const collectProducts = (value: any): any[] => {
    if (!value || typeof value !== 'object') return [];
    if (Array.isArray(value)) return value.flatMap(collectProducts);
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    return [...(types.includes('Product') ? [value] : []), ...Object.values(value).flatMap(collectProducts)];
  };
  const results = await Promise.all(sources.slice(0, 4).map(async source => {
    try {
      const url = new URL(source.url);
      if (!/^https?:$/.test(url.protocol)) return null;
      const response = await fetcher(url.href, {signal: AbortSignal.timeout(2000)});
      if (!response.ok) return null;
      const target = new URL(response.url || url.href);
      const host = target.hostname.replace(/^www\./, '');
      if (/(?:^|\.)(?:google\.[a-z.]+|bing\.com|duckduckgo\.com)$/.test(host)) return null;
      const html = (await response.text()).slice(0, 500000);
      let matched = false;
      for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
          const products = collectProducts(JSON.parse(script[1]));
          matched = products.some(product => {
            if (!hasExactProductIdentifier(code, product) || !normalized(String(product.name || '')).includes(wantedTitle)) return false;
            if (!platform || platform === 'Autre') return true;
            const pattern = platformPatterns[platform];
            const context = `${product.name || ''} ${product.description || ''} ${product.category || ''}`;
            return pattern ? pattern.test(context) : normalized(context).includes(normalized(platform));
          });
          if (matched) break;
        } catch { /* Ignore malformed structured product data. */ }
      }
      if (!matched) return null;
      return { ...source, url: target.href, host };
    } catch { return null; }
  }));
  const seen = new Set<string>();
  const verified: Source[] = [];
  for (const result of results) {
    if (!result || seen.has(result.host)) continue;
    seen.add(result.host);
    verified.push({title: result.title, url: result.url});
  }
  return verified.length >= 2 ? verified : [];
}
