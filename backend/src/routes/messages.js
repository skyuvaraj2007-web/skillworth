const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');
const { requireAuth } = require('../middleware/auth');

// GET /api/messages/conversations or /threads
// Returns real database conversations for the authenticated user
router.get(['/conversations', '/threads'], requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID missing from session' });
    }

    const conversations = await relationalManager.getConversations(userId);
    res.json({
      success: true,
      data: conversations,
      threads: conversations,
      count: conversations.length
    });
  } catch (err) {
    console.error('Failed to get conversations:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/messages/conversations/:id or /threads/:id
// Returns messages for a specific conversation
router.get(['/conversations/:id', '/threads/:id', '/conversations/:id/messages', '/threads/:id/messages'], requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const conversationId = req.params.id;

    const messages = await relationalManager.getConversationMessages(conversationId, userId);
    res.json({
      success: true,
      data: messages,
      messages: messages,
      count: messages.length
    });
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

// POST /api/messages/conversations or /threads
// Start a new conversation
router.post(['/conversations', '/threads'], requireAuth, async (req, res) => {
  try {
    const initiatorUserId = req.user?.id || req.user?.userId;
    const { recipientUserId, title, opportunityId, initialMessage } = req.body;

    if (!recipientUserId) {
      return res.status(400).json({ success: false, message: 'recipientUserId is required' });
    }

    const conv = await relationalManager.createConversation(
      initiatorUserId,
      recipientUserId,
      title || null,
      opportunityId || null,
      initialMessage || null
    );

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conv
    });
  } catch (err) {
    console.error('Failed to create conversation:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/messages/conversations/:id/messages or /threads/:id/messages
// Send a message in an existing conversation
router.post(['/conversations/:id/messages', '/threads/:id/messages', '/conversations/:id', '/threads/:id'], requireAuth, async (req, res) => {
  try {
    const senderUserId = req.user?.id || req.user?.userId;
    const conversationId = req.params.id;
    const { text, message } = req.body;

    const messageText = text || message;
    if (!messageText || !messageText.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const msg = await relationalManager.sendMessage(conversationId, senderUserId, messageText);
    res.status(201).json({
      success: true,
      message: 'Message delivered',
      data: msg
    });
  } catch (err) {
    const status = err.message.includes('Access denied') ? 403 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

module.exports = router;
