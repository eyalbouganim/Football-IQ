const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    question: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    options: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
            isValidOptions(value) {
                if (!Array.isArray(value) || value.length < 2 || value.length > 6) {
                    throw new Error('Options must be an array with 2-6 choices');
                }
            }
        }
    },
    correctAnswer: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'correct_answer'
    },
    difficulty: {
        type: DataTypes.ENUM('easy', 'medium', 'hard', 'expert'),
        defaultValue: 'medium'
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'general'
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    explanation: {
        type: DataTypes.TEXT
    },
    sqlQuery: {
        type: DataTypes.TEXT,
        field: 'sql_query',
        comment: 'The SQL query this question tests knowledge of'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    timesAnswered: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'times_answered'
    },
    timesCorrect: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'times_correct'
    }
}, {
    tableName: 'questions',
    indexes: [
        { fields: ['difficulty'] },
        { fields: ['category'] },
        { fields: ['is_active'] }
    ]
});

module.exports = Question;

