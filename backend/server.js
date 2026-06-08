require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const usersRouter   = require('./src/routes/users');
const boxRouter     = require('./src/routes/box');
const blocksRouter  = require('./src/routes/blocks');
const reportsRouter = require('./src/routes/reports');

const app = express();

// ── CORS — allow Firebase frontend + localhost dev ────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/users',   usersRouter);
app.use('/api/box',     boxRouter);
app.use('/api/blocks',  blocksRouter);
app.use('/api/reports', reportsRouter);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', app: 'echo-box', ts: new Date().toISOString() })
);

// ── 404 fallback ──────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`📬 Echo-Box backend → http://localhost:${PORT}`));
