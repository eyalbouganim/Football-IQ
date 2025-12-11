const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GameAnswer = sequelize.define('GameAnswer', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'session_id',
        references: {
            model: 'game_sessions',
            key: 'id'
        }
    },
    questionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'question_id',
        references: {
            model: 'questions',
            key: 'id'
        }
    },
    userAnswer: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'user_answer'
    },
    isCorrect: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        field: 'is_correct'
    },
    pointsEarned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'points_earned'
    },
    timeSpentSeconds: {
        type: DataTypes.INTEGER,
        field: 'time_spent_seconds'
    }
}, {
    tableName: 'game_answers',
    indexes: [
        { fields: ['session_id'] },
        { fields: ['question_id'] },
        { fields: ['is_correct'] }
    ]
});

module.exports = GameAnswer;

