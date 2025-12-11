const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GameSession = sequelize.define('GameSession', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalQuestions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'total_questions'
    },
    correctAnswers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'correct_answers'
    },
    difficulty: {
        type: DataTypes.ENUM('easy', 'medium', 'hard', 'expert', 'mixed'),
        defaultValue: 'mixed'
    },
    status: {
        type: DataTypes.ENUM('in_progress', 'completed', 'abandoned'),
        defaultValue: 'in_progress'
    },
    startedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'started_at'
    },
    completedAt: {
        type: DataTypes.DATE,
        field: 'completed_at'
    },
    timeSpentSeconds: {
        type: DataTypes.INTEGER,
        field: 'time_spent_seconds'
    }
}, {
    tableName: 'game_sessions',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['status'] },
        { fields: ['score'] },
        { fields: ['created_at'] }
    ]
});

module.exports = GameSession;

