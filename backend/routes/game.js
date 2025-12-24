const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticate } = require('../middleware/auth');
const { validateAnswer } = require('../middleware/validate');

// All game routes require authentication
router.use(authenticate);

// Game session routes
router.post('/start', gameController.startGame);
router.post('/:sessionId/answer', validateAnswer, gameController.submitAnswer);
router.post('/:sessionId/end', gameController.endGame);

// Stats routes
router.get('/stats', gameController.getUserStats);
router.get('/leaderboard', gameController.getLeaderboard);

module.exports = router;



