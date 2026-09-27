// Builds ndvdb/ (the NDVDB section of the site) from the Unity package's
// self-contained Documentation.html:
//   - turns each video's poster (which opens YouTube in a new tab, because a page
//     opened from disk can't embed videos) into a real YouTube embed
//   - moves every embedded base64 image into ndvdb/img/<content-hash>.<ext>, so the
//     page is ~140 KB instead of ~16 MB and images load lazily and cache individually
//   - adds site navigation (Home / Support), a favicon and link-preview tags
// The Unity copy is never modified, so it keeps working offline.
//
// Usage:  node tools/build-docs.mjs [path/to/Documentation.html]

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SOURCE = 'D:/UnityProjects/NDVDBURP/Assets/NDimensionalGames/VDBImporter/Documentation/Documentation.html';
const PAGE_URL = 'https://ndimensionalgames.com/ndvdb/';
const PREVIEW_IMAGE = 'https://ndimensionalgames.com/assets/og-ndvdb.jpg'; // made by tools/make-images.py
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] || DEFAULT_SOURCE);
const outDir = path.join(root, 'ndvdb');
const imgDir = path.join(outDir, 'img');

let html = fs.readFileSync(source, 'utf8');

// ── 1. Video posters → YouTube embeds ───────────────────────────────────────
// The docs' own script already renders data-embed figures as iframes (and keeps
// the "Watch on YouTube" caption link). Dropping data-poster first means those
// poster images are never extracted in step 2.
let videos = 0;
html = html.replace(/<figure\b[^>]*\bdata-youtube="([\w-]+)"[^>]*>/g, (tag, id) => {
  videos++;
  return tag
    .replace(/\s+data-poster="[^"]*"/, '')
    .replace(/data-youtube="[\w-]+"/, `data-embed="https://www.youtube-nocookie.com/embed/${id}"`);
});

// ── 2. Embedded images → files ──────────────────────────────────────────────
fs.rmSync(imgDir, { recursive: true, force: true });
fs.mkdirSync(imgDir, { recursive: true });

const written = new Set();
let imageBytes = 0;
html = html.replace(/data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g, (match, mime, b64) => {
  const ext = EXT[mime];
  if (!ext) return match; // unknown type: leave it embedded
  const buf = Buffer.from(b64, 'base64');
  const rel = `img/${createHash('sha256').update(buf).digest('hex').slice(0, 12)}.${ext}`;
  if (!written.has(rel)) {
    fs.writeFileSync(path.join(outDir, rel), buf);
    written.add(rel);
    imageBytes += buf.length;
  }
  return rel;
});

// ── 3. Site integration ─────────────────────────────────────────────────────
const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'NDVDB Documentation';
const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';

const head = `<!-- added by tools/build-docs.mjs -->
<link rel="icon" href="../assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="../assets/favicon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="../assets/apple-touch-icon.png">
<link rel="canonical" href="${PAGE_URL}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="N Dimensional Games">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${PAGE_URL}">
<meta property="og:image" content="${PREVIEW_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<style>
.site-links { display: flex; gap: 2px; }
.site-links a { color: var(--fg-2); font-weight: 500; padding: 6px 10px; border-radius: 8px; }
.site-links a:hover { background: var(--bg-3); color: var(--fg); text-decoration: none; }
@media (max-width: 860px) { .site-links { display: none; } }
</style>
`;

const topbarLinks = `<nav class="site-links" aria-label="Site"><a href="../">Home</a><a href="../customer-support/">Support</a></nav>
  `;

const sidebarLinks = `
    <div class="nav-group">Help</div>
    <a href="../customer-support/"><span class="ico">✉</span>Customer Support</a>
    <a href="../"><span class="ico">⌂</span>N Dimensional Games</a>
  `;

// Runs after the docs' own script has built the iframes: names each video for
// screen readers and allows fullscreen in browsers that ignore allow="fullscreen".
const videoFixups = `<script>/* added by tools/build-docs.mjs */
document.querySelectorAll('figure.media iframe').forEach(f => { f.title = f.closest('figure').dataset.caption || 'Video'; f.allowFullscreen = true; });
</script>
`;

let warnings = 0;
function insertAt(label, index, text) {
  if (index < 0) { console.warn(`! could not find ${label}; skipped`); warnings++; return; }
  html = html.slice(0, index) + text + html.slice(index);
}

insertAt('</head>', html.indexOf('</head>'), head);
insertAt('the search box in the top bar', html.indexOf('<label class="search">'), topbarLinks);
const sidebar = html.indexOf('<nav class="sidebar"');
const sidebarEnd = sidebar < 0 ? -1 : html.indexOf('</nav>', sidebar);
insertAt('the end of the sidebar nav', sidebarEnd < 0 ? -1 : html.lastIndexOf('</div>', sidebarEnd), sidebarLinks);
if (videos) insertAt('</body>', html.lastIndexOf('</body>'), videoFixups);

fs.writeFileSync(path.join(outDir, 'index.html'), html);

const mb = n => (n / 1024 / 1024).toFixed(1) + ' MB';
console.log(`source      ${source}  (${mb(fs.statSync(source).size)})`);
console.log(`page        ndvdb/index.html  (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
console.log(`videos      ${videos} YouTube embeds`);
console.log(`images      ${written.size} files in ndvdb/img  (${mb(imageBytes)})`);
if (warnings) console.log(`${warnings} warning(s) above: the docs layout changed, so check the injected links.`);
