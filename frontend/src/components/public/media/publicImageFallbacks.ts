const FALLBACK_SVG = (label: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#f5f5f4" />
      <stop offset="100%" stop-color="#e7e5e4" />
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)" />
  <circle cx="600" cy="320" r="110" fill="#d6d3d1" />
  <path d="M290 610c70-120 136-180 202-180s132 60 200 180" fill="none" stroke="#a8a29e" stroke-width="24" stroke-linecap="round" />
  <path d="M650 610c58-92 113-138 166-138 53 0 106 46 164 138" fill="none" stroke="#c4b5fd" stroke-width="18" stroke-linecap="round" opacity="0.45" />
  <text x="600" y="710" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#78716c">${label}</text>
</svg>`;

function toDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const publicEventFallbackImage = toDataUri(FALLBACK_SVG("Event image unavailable"));
export const publicMonkFallbackImage = toDataUri(FALLBACK_SVG("Profile image unavailable"));

const HERO_FALLBACK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="Hero image unavailable">
  <rect width="1200" height="800" fill="#f7ecdd" />
  <path d="M216 606h768" stroke="#333333" stroke-width="4" opacity=".22" />
  <rect x="390" y="220" width="420" height="280" fill="none" stroke="#945c26" stroke-width="10" />
  <circle cx="500" cy="320" r="32" fill="none" stroke="#945c26" stroke-width="10" />
  <path d="m430 450 112-104 88 78 58-52 82 78" fill="none" stroke="#945c26" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

export const publicHeroFallbackImage = toDataUri(HERO_FALLBACK_SVG);
