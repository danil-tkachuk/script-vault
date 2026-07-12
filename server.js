const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const scriptsHandler = require('./api/scripts');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Emulate Vercel API routing
  if (pathname.startsWith('/api/scripts')) {
    req.query = parsedUrl.query;
    
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (e) {
        req.body = {};
      }

      // Add response helper methods to match Vercel Serverless signature
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
        return res;
      };

      // Execute Vercel handler function
      scriptsHandler(req, res).catch(err => {
        console.error('API Error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      });
    });
    return;
  }

  // Serve static files
  const safePath = pathname.replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath === '/' ? 'index.html' : safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    let contentType = 'text/html; charset=utf-8';
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.css') contentType = 'text/css';
    else if (ext === '.js') contentType = 'application/javascript; charset=utf-8';
    else if (ext === '.json') contentType = 'application/json';

    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Локальный сервер запущен на http://localhost:${PORT}`);
  console.log(`📂 Данные скриптов (scripts.json) будут обновляться в корневой папке.\n`);
});
