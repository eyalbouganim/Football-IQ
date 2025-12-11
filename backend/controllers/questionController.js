const { Question } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const getQuestions = async (req, res, next) => {
    try {
        const { difficulty, category, limit = 20, offset = 0 } = req.query;

        const whereClause = { isActive: true };
        if (difficulty) whereClause.difficulty = difficulty;
        if (category) whereClause.category = category;

        const questions = await Question.findAndCountAll({
            where: whereClause,
            limit: Math.min(parseInt(limit) || 20, 100),
            offset: parseInt(offset) || 0,
            attributes: ['id', 'question', 'options', 'difficulty', 'category', 'points'],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                questions: questions.rows,
                total: questions.count,
                limit: parseInt(limit) || 20,
                offset: parseInt(offset) || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

const getQuestionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const question = await Question.findByPk(id, {
            attributes: ['id', 'question', 'options', 'difficulty', 'category', 'points']
        });

        if (!question) {
            return next(new AppError('Question not found', 404));
        }

        res.json({
            success: true,
            data: { question }
        });
    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res, next) => {
    try {
        const categories = await Question.findAll({
            where: { isActive: true },
            attributes: ['category'],
            group: ['category']
        });

        res.json({
            success: true,
            data: {
                categories: categories.map(c => c.category)
            }
        });
    } catch (error) {
        next(error);
    }
};

const getDifficulties = async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                difficulties: ['easy', 'medium', 'hard', 'expert']
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getQuestions,
    getQuestionById,
    getCategories,
    getDifficulties
};

