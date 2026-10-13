const express = require('express');
const router = express.Router();
const {
  getLostFoundItems,
  createLostFoundItem,
  resolveLostFoundItem,
} = require('../controllers/lostFoundController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', getLostFoundItems);
router.post('/', createLostFoundItem);
router.patch('/:id/resolve', resolveLostFoundItem);

module.exports = router;
