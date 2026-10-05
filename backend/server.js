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

// Health Check handler
const healthHandler = (req, res) => {
  res.json({
    status: 'OK',
    application: 'SkillWorth — Recognition of Prior Learning Platform',
    version: '1.0.0',
    supabaseConnected: Boolean(isSupabaseConfigured),
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// API Routes
const authRouter = require('./routes/auth');
const skillsRouter = require('./routes/skills');
const evidenceRouter = require('./routes/evidence');
const assessmentsRouter = require('./routes/assessments');
const assessorRouter = require('./routes/assessor');
const credentialsRouter = require('./routes/credentials');
const rplRouter = require('./routes/rpl');
const notificationsRouter = require('./routes/notifications');

app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/skills', skillsRouter);
app.use('/skills', skillsRouter);

app.use('/api/evidence', evidenceRouter);
app.use('/evidence', evidenceRouter);

app.use('/api/assessments', assessmentsRouter);
app.use('/assessments', assessmentsRouter);

app.use('/api/assessor', assessorRouter);
app.use('/assessor', assessorRouter);

app.use('/api/credentials', credentialsRouter);
app.use('/credentials', credentialsRouter);

app.use('/api/rpl', rplRouter);
app.use('/rpl', rplRouter);

app.use('/api/notifications', notificationsRouter);
app.use('/notifications', notificationsRouter);

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
