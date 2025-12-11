const express = require('express');
const router = express.Router();
const sqlController = require('../controllers/sqlController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/schema', sqlController.getSchema);
router.get('/challenges', sqlController.getChallenges);
router.get('/challenges/:id', sqlController.getChallenge);
router.get('/leaderboard', sqlController.getSqlLeaderboard);

// Protected routes (require login)
router.post('/execute', authenticate, sqlController.executeQuery);
router.post('/challenges/:id/submit', authenticate, sqlController.submitChallenge);

module.exports = router;

