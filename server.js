// ============================================================================
// سرور بومی Node.js آماده برای استقرار فوری روی Render.com و اتصال به Neon / GitHub
// بدون هیچ خطای Deprecation (استفاده از WHATWG URL API)
// پشتیبانی ۱۰۰٪ از Health Check رندر (/api/health)، مسیر /login و وب‌سرویس‌های ابری
// ============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const SERVER_DATA_PATH = path.join(__dirname, 'server-db.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8',
  '.geojson': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // استفاده از استاندارد WHATWG URL API جهت رفع اخطار Deprecation Node.js 26
  const host = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url, `http://${host}`);
  const pathname = parsedUrl.pathname;

  // هدرهای CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 1. پشتیبانی ۱۰۰٪ از Health Check سرور Render.com و Keep-Alive (/ping، /api/health، /api/ping)
  if (pathname === '/ping' || pathname === '/api/health' || pathname === '/api/ping' || pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      ok: true,
      status: 'healthy',
      message: 'OK',
      service: 'namayandeelmi-javad-crm',
      timestamp: new Date().toISOString()
    }));
  }

  // 2. وب‌سرویس دریافت اطلاعات (GET /api/state)
  if (pathname === '/api/state' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (fs.existsSync(SERVER_DATA_PATH)) {
      const data = fs.readFileSync(SERVER_DATA_PATH, 'utf8');
      return res.end(JSON.stringify({ status: 'success', data: JSON.parse(data) }));
    } else {
      return res.end(JSON.stringify({ status: 'empty', message: 'اطلاعاتی در سرور ثبت نشده است، کلاینت از داده پیش‌فرض استفاده کند.' }));
    }
  }

  // 3. وب‌سرویس ذخیره اطلاعات (POST /api/state)
  if (pathname === '/api/state' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(SERVER_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'success', message: 'اطلاعات با موفقیت در سرور ذخیره شد.' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
    return;
  }

  // 4. وب‌سرویس دانلود بکاپ تک‌نام (GET /api/backup)
  if (pathname === '/api/backup' && req.method === 'GET') {
    if (fs.existsSync(SERVER_DATA_PATH)) {
      res.writeHead(200, {
        'Content-Disposition': 'attachment; filename="crm-backup-latest.json"',
        'Content-Type': 'application/json; charset=utf-8'
      });
      const readStream = fs.createReadStream(SERVER_DATA_PATH);
      return readStream.pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ status: 'error', message: 'فایل پشتیبان سرور یافت نشد.' }));
    }
  }

  // 5. پشتیبانی از مسیرهای /login، /panel، /admin و / (برای namayandeelmi-javad.onrender.com/login)
  if (pathname === '/login' || pathname === '/login/' || pathname === '/panel' || pathname === '/admin' || pathname === '/') {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    const rootIndexPath = path.join(__dirname, 'index.html');
    const targetPath = fs.existsSync(indexPath) ? indexPath : rootIndexPath;

    fs.readFile(targetPath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
    return;
  }

  // 6. سرویس‌دهی فایل‌های استاتیک پوشه public و مسیر جاری
  let relPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  if (!relPath) relPath = 'index.html';

  const publicPath = path.join(__dirname, 'public', relPath);
  const rootPath = path.join(__dirname, relPath);
  const filePath = fs.existsSync(publicPath) ? publicPath : rootPath;

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // حالت SPA Fallback (برگشت به index.html)
      const fallbackPath = fs.existsSync(path.join(__dirname, 'public', 'index.html'))
        ? path.join(__dirname, 'public', 'index.html')
        : path.join(__dirname, 'index.html');

      fs.readFile(fallbackPath, (err2, indexContent) => {
        if (err2) {
          res.writeHead(404);
          return res.end('File not found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexContent);
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================================`);
  console.log(`🚀 سرور بومی Node.js با موفقیت روی 0.0.0.0:${PORT} فعال شد!`);
  console.log(`✅ هماهنگ با Health Check سرور Render.com (/api/health)`);
  console.log(`🔗 آماده برای namayandeelmi-javad.onrender.com و ndcohub.ir`);
  console.log(`========================================================`);
});
