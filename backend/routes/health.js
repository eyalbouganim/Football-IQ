const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');

router.get('/', async (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date().toISOString()
    };

    try {
        await sequelize.authenticate();
        healthcheck.database = 'connected';
    } catch (error) {
        healthcheck.database = 'disconnected';
        healthcheck.message = 'Database connection failed';
        return res.status(503).json(healthcheck);
    }

    res.json(healthcheck);
});

router.get('/ready', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({ status: 'not ready', error: error.message });
    }
});

router.get('/live', (req, res) => {
    res.json({ status: 'alive' });
});

module.exports = router;
