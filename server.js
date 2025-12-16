const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 2888;
const LOG_DIR = path.resolve(process.env.LOG_DIR || '/var/ivanproject/logs');
const PUBLIC_DIR = path.join(__dirname, 'public');

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function resolveSafePath(requestPath = '') {
  const normalized = path.normalize(requestPath).replace(/^\/+/, '');
  const candidate = path.resolve(LOG_DIR, normalized);
  if (!candidate.startsWith(LOG_DIR)) {
    throw new Error('Invalid path');
  }
  return candidate;
}

function listFiles(res) {
  fs.readdir(LOG_DIR, { withFileTypes: true }, (err, entries) => {
    if (err) {
      return sendJson(res, 500, { error: err.message });
    }
    const files = entries.map((entry) => {
      const fullPath = path.join(LOG_DIR, entry.name);
      const stats = fs.statSync(fullPath);
      return {
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        mtime: stats.mtime
      };
    });
    sendJson(res, 200, { base: LOG_DIR, files });
  });
}

function readFileContent(res, query) {
  const requestedPath = query.get('path');
  if (!requestedPath) {
    return sendJson(res, 400, { error: 'Missing path parameter' });
  }

  let filePath;
  try {
    filePath = resolveSafePath(requestedPath);
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      return sendJson(res, 404, { error: 'File not found' });
    }
    if (stats.isDirectory()) {
      return sendJson(res, 400, { error: 'Requested path is a directory' });
    }

    fs.readFile(filePath, 'utf8', (readErr, data) => {
      if (readErr) {
        return sendJson(res, 500, { error: readErr.message });
      }
      sendJson(res, 200, { name: path.basename(filePath), content: data });
    });
  });
}

function serveStatic(res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, requested);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.html'
      ? 'text/html; charset=utf-8'
      : 'text/plain; charset=utf-8';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname, searchParams } = url;

  if (pathname === '/api/files') {
    return listFiles(res);
  }
  if (pathname === '/api/file') {
    return readFileContent(res, searchParams);
  }

  return serveStatic(res, pathname);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Log viewer listening on port ${PORT}. Viewing ${LOG_DIR}`);
});
