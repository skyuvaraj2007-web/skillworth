/**
 * Vercel Serverless Function Entrypoint for Skill Nexus Express API
 */
let app;
try {
  app = require('../backend/src/server');
} catch (err) {
  console.error('[CRITICAL] Vercel Serverless Function failed to load backend server:', err);
  const express = require('express');
  app = express();
  app.all('/api/health', (req, res) => {
    res.status(500).json({
      status: 'CRITICAL_ERROR',
      database: 'DISCONNECTED',
      message: 'Backend server failed to initialize on Vercel: ' + err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
  app.all('/api/*', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Backend server failed to initialize: ' + err.message
    });
  });
}

module.exports = app;
