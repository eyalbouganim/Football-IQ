const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Use SQLite for simplicity (no external database needed)
// Switch to PostgreSQL in production by setting DB_DIALECT=postgres
const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'postgres') {
    sequelize = new Sequelize(
        process.env.DB_NAME || 'football_iq',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'password',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            dialect: 'postgres',
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            define: {
                timestamps: true,
                underscored: true,
            }
        }
    );
} else {
    // SQLite - stores data in a local file
    const dbPath = path.join(__dirname, '..', 'data', 'football_iq.sqlite');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
            timestamps: true,
            underscored: true,
        }
    });
}

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log(`✅ Database connection established (${dialect}).`);
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
        return false;
    }
};

module.exports = { sequelize, testConnection };
