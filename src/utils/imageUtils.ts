import React from 'react';

/**
 * Safely resolves a cover image URL through the server-side proxy
 * to prevent CORS issues, referrer blocking (Wikipedia, Amazon),
 * and hotlink restrictions.
 */
export function getSafeCoverUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Already routed through proxy or data URL or local asset
  if (
    trimmed.startsWith('/api/covers/proxy') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  // Route external HTTP/HTTPS images through our robust proxy
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return `/api/covers/proxy?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

/**
 * Handle image loading failure by trying the proxy if it wasn't already used
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, originalUrl?: string) {
  const target = e.currentTarget;
  if (originalUrl && !target.src.includes('/api/covers/proxy') && (originalUrl.startsWith('http://') || originalUrl.startsWith('https://'))) {
    target.src = `/api/covers/proxy?url=${encodeURIComponent(originalUrl)}`;
    return;
  }
  target.style.display = 'none';
}
