// Local preview that behaves like GitHub Pages: folders serve index.html,
// "/page" also finds "page.html", and unknown paths get 404.html.
//
// Usage:  node tools/serve.mjs      then open http://localhost:4173

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json',
};

const isFile = p => fs.existsSync(p) && fs.statSync(p).isFile();

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) return res.writeHead(301, { Location: url.pathname + '/' + url.search }).end();
    file = path.join(file, 'index.html');
  }
  let status = 200;
  if (!isFile(file)) {
    if (isFile(file + '.html')) file += '.html';
    else { file = path.join(root, '404.html'); status = 404; }
  }
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Previewing ${root} on http://localhost:${port}`));
