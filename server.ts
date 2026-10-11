import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import authRoutes from './server/routes/authRoutes.ts';
import profileRoutes from './server/routes/profileRoutes.ts';
import discoverRoutes from './server/routes/discoverRoutes.ts';
import subscriptionRoutes from './server/routes/subscriptionRoutes.ts';
import messageRoutes from './server/routes/messageRoutes.ts';
import marketplaceRoutes from './server/routes/marketplaceRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import publicChatRoutes from './server/routes/publicChatRoutes.ts';
import { realtimeHub } from './server/websocket.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Security & Middleware
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Static uploads directory for screenshots and profile pictures
  const uploadsDir = path.resolve(__dirname, '.data/uploads');
  import('fs').then(fs => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });
  app.use('/uploads', express.static(uploadsDir));

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/discover', discoverRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/marketplace', marketplaceRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/public-chat', publicChatRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'NaijaMatch',
      timestamp: new Date().toISOString()
    });
  });

  // Attach WebSocket Hub for Real-Time Chat & Presence
  realtimeHub.init(server);

  // Vite middleware in dev or static files in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[NAIJAMATCH] Platform backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[NAIJAMATCH] Server fatal startup failure:', err);
  process.exit(1);
});
