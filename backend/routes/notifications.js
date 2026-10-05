const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../database/skillworthDatabase');

// GET /api/notifications - Get current user's notifications
router.get('/', requireAuth, (req, res) => {
  try {
    const userId = req.user.profileId || req.user.id;
    const notifications = db.getNotifications(userId);
    return res.json({ success: true, notifications });
  } catch (err) {
    console.error('[Notifications Get Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', requireAuth, (req, res) => {
  try {
    const userId = req.user.profileId || req.user.id;
    const result = db.markNotificationRead(req.params.id, userId);
    if (!result.success) return res.status(404).json(result);
    return res.json(result);
  } catch (err) {
    console.error('[Notification Mark Read Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', requireAuth, (req, res) => {
  try {
    const userId = req.user.profileId || req.user.id;
    const result = db.markAllNotificationsRead(userId);
    return res.json(result);
  } catch (err) {
    console.error('[Notifications Mark All Read Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
});

module.exports = router;
