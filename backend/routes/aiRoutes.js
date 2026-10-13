const express = require('express');
const router = express.Router();
const { chatWithCampusBot } = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Support both /api/ai/assistant/chat, /api/ai/chat, and /api/ai/assistant/query
router.post('/assistant/chat', chatWithCampusBot);
router.post('/chat', chatWithCampusBot);
router.post('/assistant/query', chatWithCampusBot);
router.post('/query', chatWithCampusBot);

module.exports = router;
