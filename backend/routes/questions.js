const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes (with optional auth)
router.get('/', optionalAuth, questionController.getQuestions);
router.get('/categories', questionController.getCategories);
router.get('/difficulties', questionController.getDifficulties);
router.get('/:id', optionalAuth, questionController.getQuestionById);

module.exports = router;



