import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Determine listening port:
// 1. In AI Studio / Cloud Run, DEFAULT_APP_PORT is 3000 (with internal NGINX reverse-proxy listening on 8080).
// 2. If DEFAULT_APP_PORT is set, use it.
// 3. If PORT is provided and distinct from NGINX_PORT, use PORT.
// 4. Otherwise default to 3000.
let port = 3000;
if (process.env.DEFAULT_APP_PORT) {
  port = parseInt(process.env.DEFAULT_APP_PORT, 10);
} else if (process.env.PORT && process.env.PORT !== process.env.NGINX_PORT) {
  port = parseInt(process.env.PORT, 10);
} else if (process.env.APP_PORT) {
  port = parseInt(process.env.APP_PORT, 10);
}

const host = '0.0.0.0';

app.use(express.json());

// Health check endpoint for Cloud Run and monitoring probes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'K99 Coffee POS ERP',
  });
});

const distPath = path.resolve(__dirname, 'dist');

// Serve static assets from dist (production build)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.send(`
      <!doctype html>
      <html>
        <head><title>K99 Coffee POS</title></head>
        <body style="font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 2rem; text-align: center;">
          <h2>K99 Coffee POS Server Running</h2>
          <p>Please run <code>npm run build</code> to generate the client build.</p>
        </body>
      </html>
    `);
  });
}

// Only start listening if not running under an active test
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, host, () => {
    console.log(`K99 Coffee POS Server listening on http://${host}:${port}`);
  });
}

export default app;
