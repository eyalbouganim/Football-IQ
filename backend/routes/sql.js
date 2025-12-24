const express = require('express');
const router = express.Router();
const sqlController = require('../controllers/sqlController');
const { authenticate } = require('../middleware/auth');

// ========================================
// SHARED ROUTES (Public)
// ========================================
router.get('/schema', sqlController.getSchema);
router.get('/leaderboard', sqlController.getLeaderboard);

// ========================================
// 🎯 QUIZ MODE - Multiple Choice (American Style)
// ========================================
router.get('/quiz/challenges', sqlController.getQuizChallenges);
router.get('/quiz/start', authenticate, sqlController.startQuizGame);
router.post('/quiz/:id/submit', authenticate, sqlController.submitQuizAnswer);
router.post('/quiz/end', authenticate, sqlController.endQuizGame);

// ========================================
// ✍️ QUERY MODE - Write Your Own SQL
// ========================================
router.get('/query/challenges', sqlController.getQueryChallenges);
router.get('/query/challenges/:id', sqlController.getQueryChallenge);
router.post('/query/:id/submit', authenticate, sqlController.submitQueryAnswer);
router.post('/query/execute', authenticate, sqlController.executeQuery);

module.exports = router;
