const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const gameRoutes = require('./game');
const questionRoutes = require('./questions');
const healthRoutes = require('./health');
const sqlRoutes = require('./sql');

router.use('/auth', authRoutes);
router.use('/game', gameRoutes);
router.use('/questions', questionRoutes);
router.use('/health', healthRoutes);
router.use('/sql', sqlRoutes);

module.exports = router;

