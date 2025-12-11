const { sequelize } = require('../config/database');
const User = require('./User');
const Question = require('./Question');
const GameSession = require('./GameSession');
const GameAnswer = require('./GameAnswer');

// Define associations
User.hasMany(GameSession, { 
    foreignKey: 'userId', 
    as: 'gameSessions' 
});
GameSession.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
});

GameSession.hasMany(GameAnswer, { 
    foreignKey: 'sessionId', 
    as: 'answers' 
});
GameAnswer.belongsTo(GameSession, { 
    foreignKey: 'sessionId', 
    as: 'session' 
});

Question.hasMany(GameAnswer, { 
    foreignKey: 'questionId', 
    as: 'answers' 
});
GameAnswer.belongsTo(Question, { 
    foreignKey: 'questionId', 
    as: 'question' 
});

// Sync function
const syncDatabase = async (force = false) => {
    try {
        await sequelize.sync({ force });
        console.log('✅ Database synchronized successfully.');
        return true;
    } catch (error) {
        console.error('❌ Error synchronizing database:', error);
        return false;
    }
};

module.exports = {
    sequelize,
    User,
    Question,
    GameSession,
    GameAnswer,
    syncDatabase
};

