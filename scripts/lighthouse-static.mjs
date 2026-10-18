/**
 * Serves frontend/dist the way frontend/nginx.conf does, for Lighthouse
 * when the Docker daemon is down. Gzip level defaults to 6 (nginx
 * gzip_comp_level). Hashed assets get one immutable cache header.
 * /api/* returns an empty JSON body so a missing Java stack does not
 * spam the console.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || 4183);
const gzipLevel = Number(process.argv[4] || 6);

const GZIP_TYPES = new Set([
  'text/html',
  'text/plain',
  'text/css',
  'text/xml',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'application/xml+rss',
  'image/svg+xml',
]);

const ASSET_RE = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function typeOf(file) {
  return MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function security(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function send(req, res, status, body, contentType, cache) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const base = contentType.split(';')[0];
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  if (cache === 'asset') {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (cache === 'html') {
    security(res);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  } else {
    security(res);
    res.setHeader('Cache-Control', 'no-cache');
  }
  const accept = String(req.headers['accept-encoding'] || '');
  if (accept.includes('gzip') && GZIP_TYPES.has(base) && buf.length >= 1024) {
    const gz = zlib.gzipSync(buf, { level: gzipLevel });
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    res.end(gz);
    return;
  }
  res.end(buf);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  if (url.pathname.startsWith('/api/')) {
    const emptyObject = url.pathname.includes('summary') || url.pathname.endsWith('/me');
    send(req, res, 200, JSON.stringify(emptyObject ? {} : []), 'application/json; charset=utf-8', 'nostore');
    return;
  }

  let rel = decodeURIComponent(url.pathname);
  if (rel.includes('\0')) {
    res.statusCode = 400;
    res.end('bad request');
    return;
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) {
    res.statusCode = 403;
    res.end('forbidden');
    return;
  }

  let target = file;
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    const nested = path.join(file, 'index.html');
    target = fs.existsSync(nested) ? nested : path.join(root, 'index.html');
  }
  const data = fs.readFileSync(target);
  const isHtml = target.endsWith('.html');
  const isAsset = !isHtml && ASSET_RE.test(target);
  send(req, res, 200, data, typeOf(target), isAsset ? 'asset' : isHtml ? 'html' : 'other');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`lighthouse-static root=${root} port=${port} gzipLevel=${gzipLevel}`);
});
