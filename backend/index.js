const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

// Fail fast on missing required env in production
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length && process.env.NODE_ENV === 'production') {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}
if (missing.length) {
  console.warn(`Warning: missing env vars (${missing.join(', ')}) — using insecure defaults for local dev only`);
}

const app = express();

// Trust Render's proxy so rate-limiter sees the real client IP
app.set('trust proxy', 1);

app.use(helmet());

// Global rate limit: 100 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict auth rate limit: 10 attempts / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in 15 minutes.' },
});

// CORS: allow a comma-separated list of origins via CORS_ORIGIN env var
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / curl / server-to-server (no origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true); // open in dev if not configured
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medtrack')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Health check (for Render / uptime pingers)
app.get('/', (req, res) => res.json({ status: 'ok', service: 'medtrack-api' }));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/medications', globalLimiter, require('./routes/medications'));
app.use('/api/doses', globalLimiter, require('./routes/doses'));
app.use('/api/reports', globalLimiter, require('./routes/reports'));
app.use('/api/cron', require('./routes/cron')); // cron-secret protected, no IP limit

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
