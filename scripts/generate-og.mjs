// Generates public/og-image.png (1200x630) for LinkedIn/Twitter link previews.
// Dark aesthetic matching the app, gold logo mark + wordmark. Run: node scripts/generate-og.mjs
import sharp from 'sharp';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0a0f"/>
      <stop offset="0.5" stop-color="#050506"/>
      <stop offset="1" stop-color="#020203"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#E8A808" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#E8A808" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F0B723"/>
      <stop offset="1" stop-color="#E8A808"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="120" r="420" fill="url(#glow)"/>
  <circle cx="120" cy="560" r="360" fill="url(#glow)"/>

  <!-- logo mark -->
  <g transform="translate(150,249) scale(0.258)">
    <rect width="512" height="512" rx="112" fill="url(#mark)"/>
    <path d="M150 360 V152 h44 l124 150 V152 h44 v208 h-44 L194 210 v150 z" fill="#0a0a0f"/>
  </g>

  <text x="322" y="286" font-family="Arial, sans-serif" font-size="104" font-weight="700" fill="#EDEDEF">Notaty</text>
  <text x="326" y="352" font-family="Arial, sans-serif" font-size="34" fill="#8A8F98">Dump your thoughts — it files them for you.</text>
  <text x="326" y="410" font-family="Arial, sans-serif" font-size="26" font-weight="600" fill="#E8A808">Smart bilingual notes PWA</text>
  <text x="326" y="452" font-family="Arial, sans-serif" font-size="24" fill="#6b7280">React · TypeScript · Supabase · Web Push</text>

  <rect x="150" y="548" width="900" height="1" fill="#E8A808" opacity="0.25"/>
  <text x="150" y="590" font-family="Arial, sans-serif" font-size="24" fill="#8A8F98">notaty-delta.vercel.app</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og-image.png');
console.log('wrote public/og-image.png');
