const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const { supabase } = require('./config/supabase');
const authRoutes = require('./routes/auth');
const skillsRoutes = require('./routes/skills');
const assessmentsRoutes = require('./routes/assessments');
const learningRoutes = require('./routes/learning');
const emergingTechRoutes = require('./routes/emergingTech');
const projectsRoutes = require('./routes/projects');
const opportunitiesRoutes = require('./routes/opportunities');
const passportRoutes = require('./routes/passport');
const profileRoutes = require('./routes/profile');
const aiRoutes = require('./routes/ai');
const nexusRoutes = require('./routes/nexusRoutes');
const messageRoutes = require('./routes/messages');
const skillGapRoutes = require('./routes/skillGapRoutes');
const skillGraphRoutes = require('./routes/skillGraphRoutes');
const careerReadinessRoutes = require('./routes/careerReadinessRoutes');
const skillCredibilityRoutes = require('./routes/skillCredibilityRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware & CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : (process.env.CLIENT_URL ? [process.env.CLIENT_URL] : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Allow localhost/127.0.0.1 in non-production
    if (process.env.NODE_ENV !== 'production') {
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow Vercel preview & production domains
    if (/^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Blocked by CORS policy'));
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/student/skills', skillsRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/assessment', assessmentsRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/emerging-tech', emergingTechRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/passport', passportRoutes);
app.use('/api/digital-passport', passportRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/nexus', nexusRoutes);
app.use('/api/skill-gap', skillGapRoutes);
app.use('/api/skill-graph', skillGraphRoutes);
app.use('/api/career-readiness', careerReadinessRoutes);
app.use('/api/skill-credibility', skillCredibilityRoutes);
const careerCopilotRoutes = require('./routes/careerCopilotRoutes');
app.use('/api/career-copilot', careerCopilotRoutes);
const collegeMasterRoutes = require('./routes/collegeMasterRoutes');
const academicRoutes = require('./routes/academic');
const companyRoutes = require('./routes/company');
const studentRoutes = require('./routes/studentRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const communicationRoutes = require('./routes/communicationRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const academicianRoutes = require('./routes/academician');
const institutionStaffRoutes = require('./routes/institutionStaff');
app.use('/api/college-master', collegeMasterRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/academician', academicianRoutes);
app.use('/api/institution', institutionStaffRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/messages', messageRoutes);

const relationalManager = require('./db/relationalManager');
relationalManager.ensureCanonicalDemoAccounts();
const notificationRouter = express.Router();
notificationRouter.get('/', async (req, res) => {
  try {
    const role = req.query.role || req.user?.role || 'student';
    const isTrash = req.query.trash === 'true';
    const list = await relationalManager.getNotifications(role, isTrash);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
notificationRouter.get('/:role', async (req, res) => {
  try {
    const role = req.params.role;
    const isTrash = req.query.trash === 'true';
    const list = await relationalManager.getNotifications(role, isTrash);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
notificationRouter.post(['/', '/:role'], async (req, res) => {
  try {
    const role = req.params.role || req.body.role || 'student';
    const created = await relationalManager.addNotification(role, req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
notificationRouter.put('/:id/read', async (req, res) => {
  try {
    const updated = await relationalManager.markNotificationRead(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
notificationRouter.put('/read-all/:role', async (req, res) => {
  try {
    await relationalManager.markAllNotificationsRead(req.params.role);
    res.json({ success: true, message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
notificationRouter.delete('/:id', async (req, res) => {
  try {
    const deleted = await relationalManager.softDeleteNotification(req.params.id);
    res.json({ success: true, data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
app.use('/api/notifications', notificationRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let database = 'DISCONNECTED';

  if (supabase) {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      database = error ? 'DISCONNECTED' : 'CONNECTED';
    } catch (err) {
      database = 'DISCONNECTED';
    }
  }

  res.json({
    status: 'ONLINE',
    database,
    node: 'SKILLNEXUS-SOVEREIGN-NODE-01',
    blockHeight: 'Block #8941_301 Synced',
    timestamp: new Date().toISOString()
  });
});

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Production SPA static asset serving
const distPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`⚡ SKILLNEXUS AI BACKEND SERVER ONLINE ON PORT ${PORT} ⚡`);
    console.log(`   Node: SKILLNEXUS-SOVEREIGN-NODE-01`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;
