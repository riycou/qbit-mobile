import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const configPath = path.join(rootDir, 'config.json');
const clientDir = path.join(rootDir, 'www');

const defaults = {
  qbitMobilePort: 8792,
  listenAddress: '0.0.0.0',
  qbitHost: '127.0.0.1',
  qbitPort: 8081,
};

function loadConfig() {
  if (!fs.existsSync(configPath)) return defaults;
  const raw = fs.readFileSync(configPath, 'utf8');
  return { ...defaults, ...JSON.parse(raw) };
}

const config = loadConfig();

if (!fs.existsSync(clientDir)) {
  console.error(`Missing frontend folder: ${clientDir}`);
  console.error('Run the release packager or copy the production frontend into www.');
  process.exit(1);
}

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon'],
  ['.woff2', 'font/woff2'],
]);

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);
  let target = path.normalize(path.join(clientDir, pathname === '/' ? 'index.html' : pathname));

  if (!target.startsWith(clientDir)) {
    send(res, 403, 'Forbidden', { 'content-type': 'text/plain; charset=utf-8' });
    return;
  }

  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    target = path.join(clientDir, 'index.html');
  }

  const ext = path.extname(target).toLowerCase();
  const headers = {
    'content-type': contentTypes.get(ext) || 'application/octet-stream',
  };

  if (pathname.startsWith('/_next/static/')) {
    headers['cache-control'] = 'public, max-age=31536000, immutable';
  }
  else {
    headers['cache-control'] = 'no-cache';
  }

  fs.createReadStream(target)
    .on('error', () => send(res, 500, 'Could not read file', { 'content-type': 'text/plain; charset=utf-8' }))
    .pipe(res.writeHead(200, headers));
}

function proxyQbit(req, res) {
  const incoming = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const targetPath = incoming.pathname.replace(/^\/qbit\/?/, '/') + incoming.search;

  const headers = { ...req.headers };
  delete headers.host;

  const proxyReq = http.request({
    hostname: config.qbitHost,
    port: Number(config.qbitPort),
    path: targetPath,
    method: req.method,
    headers,
  }, proxyRes => {
    const responseHeaders = { ...proxyRes.headers };
    res.writeHead(proxyRes.statusCode || 502, responseHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', error => {
    send(res, 502, `qBittorrent WebUI is unreachable at ${config.qbitHost}:${config.qbitPort}\n${error.message}`, {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    });
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/qbit')) {
    res.setHeader('cache-control', 'no-store');
    proxyQbit(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(Number(config.qbitMobilePort), config.listenAddress, () => {
  console.log(`qBit Mobile listening at http://${config.listenAddress}:${config.qbitMobilePort}`);
  console.log(`Proxying /qbit to http://${config.qbitHost}:${config.qbitPort}`);
});
