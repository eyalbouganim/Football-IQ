require('dotenv').config();

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3001,
    
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        name: process.env.DB_NAME || 'football_iq',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
    },
    
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback_secret_change_me',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    },
    
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    }
};

