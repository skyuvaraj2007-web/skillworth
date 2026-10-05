require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config(); // also loads local .env if present

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
const isVercel = Boolean(process.env.VERCEL);
const uploadsDir = isVercel ? path.resolve('/tmp', 'uploads') : path.resolve(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  // Graceful fallback for read-only environments
}
app.use('/uploads', express.static(uploadsDir));

const { isSupabaseConfigured } = require('./database/supabaseClient');

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    application: 'SkillWorth — Recognition of Prior Learning Platform',
    version: '1.0.0',
    supabaseConnected: Boolean(isSupabaseConfigured),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/evidence', require('./routes/evidence'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/assessor', require('./routes/assessor'));
app.use('/api/credentials', require('./routes/credentials'));
app.use('/api/rpl', require('./routes/rpl'));
app.use('/api/notifications', require('./routes/notifications'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SkillWorth API Error]', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error in SkillWorth API.' });
});

// Server listener
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('[SkillWorth Server] Running on http://localhost:' + PORT);
    console.log('[SkillWorth Server] Uploads served from ' + uploadsDir);
  });
}

module.exports = app;
