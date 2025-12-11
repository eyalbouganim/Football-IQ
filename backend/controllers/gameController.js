const { Op } = require('sequelize');
const { User, Question, GameSession, GameAnswer, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const startGame = async (req, res, next) => {
    try {
        const { difficulty = 'mixed', questionCount = 10 } = req.body;
        const userId = req.userId;

        // Validate question count
        const count = Math.min(Math.max(parseInt(questionCount) || 10, 5), 20);

        // Create game session
        const session = await GameSession.create({
            userId,
            difficulty,
            totalQuestions: count,
            status: 'in_progress'
        });

        // Get questions based on difficulty
        const whereClause = { isActive: true };
        if (difficulty !== 'mixed') {
            whereClause.difficulty = difficulty;
        }

        const questions = await Question.findAll({
            where: whereClause,
            order: sequelize.random(),
            limit: count,
            attributes: ['id', 'question', 'options', 'difficulty', 'category', 'points']
        });

        if (questions.length === 0) {
            await session.destroy();
            return next(new AppError('No questions available for this difficulty', 404));
        }

        res.status(201).json({
            success: true,
            message: 'Game started',
            data: {
                sessionId: session.id,
                totalQuestions: questions.length,
                difficulty,
                questions: questions.map(q => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    difficulty: q.difficulty,
                    category: q.category,
                    points: q.points
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

const submitAnswer = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { questionId, answer, timeSpent } = req.body;
        const userId = req.userId;

        // Verify session
        const session = await GameSession.findOne({
            where: { id: sessionId, userId, status: 'in_progress' }
        });

        if (!session) {
            return next(new AppError('Game session not found or already completed', 404));
        }

        // Check if already answered
        const existingAnswer = await GameAnswer.findOne({
            where: { sessionId, questionId }
        });

        if (existingAnswer) {
            return next(new AppError('Question already answered', 400));
        }

        // Get the question
        const question = await Question.findByPk(questionId);
        if (!question) {
            return next(new AppError('Question not found', 404));
        }

        // Check answer
        const isCorrect = answer.toString().trim().toLowerCase() === 
                         question.correctAnswer.toString().trim().toLowerCase();
        const pointsEarned = isCorrect ? question.points : 0;

        // Save answer
        await GameAnswer.create({
            sessionId,
            questionId,
            userAnswer: answer,
            isCorrect,
            pointsEarned,
            timeSpentSeconds: timeSpent || 0
        });

        // Update session score
        if (isCorrect) {
            session.score += pointsEarned;
            session.correctAnswers += 1;
        }
        await session.save();

        // Update question statistics
        question.timesAnswered += 1;
        if (isCorrect) {
            question.timesCorrect += 1;
        }
        await question.save();

        res.json({
            success: true,
            data: {
                isCorrect,
                pointsEarned,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                currentScore: session.score,
                correctAnswers: session.correctAnswers
            }
        });
    } catch (error) {
        next(error);
    }
};

const endGame = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const userId = req.userId;

        const session = await GameSession.findOne({
            where: { id: sessionId, userId },
            include: [{
                model: GameAnswer,
                as: 'answers',
                include: [{
                    model: Question,
                    as: 'question',
                    attributes: ['question', 'correctAnswer', 'explanation', 'points']
                }]
            }]
        });

        if (!session) {
            return next(new AppError('Game session not found', 404));
        }

        // Calculate time spent
        const now = new Date();
        const timeSpent = Math.floor((now - session.startedAt) / 1000);

        // Update session
        session.status = 'completed';
        session.completedAt = now;
        session.timeSpentSeconds = timeSpent;
        await session.save();

        // Update user statistics
        const user = await User.findByPk(userId);
        user.gamesPlayed += 1;
        user.totalScore += session.score;
        if (session.score > user.highestScore) {
            user.highestScore = session.score;
        }
        await user.save();

        res.json({
            success: true,
            message: 'Game completed',
            data: {
                sessionId: session.id,
                score: session.score,
                totalQuestions: session.totalQuestions,
                correctAnswers: session.correctAnswers,
                accuracy: session.totalQuestions > 0 
                    ? Math.round((session.correctAnswers / session.totalQuestions) * 100) 
                    : 0,
                timeSpentSeconds: timeSpent,
                answers: session.answers.map(a => ({
                    question: a.question.question,
                    userAnswer: a.userAnswer,
                    correctAnswer: a.question.correctAnswer,
                    isCorrect: a.isCorrect,
                    pointsEarned: a.pointsEarned,
                    explanation: a.question.explanation
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

const getLeaderboard = async (req, res, next) => {
    try {
        const { limit = 10, period = 'all' } = req.query;
        const count = Math.min(parseInt(limit) || 10, 100);

        let dateFilter = {};
        if (period === 'week') {
            dateFilter = { 
                completedAt: { 
                    [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                } 
            };
        } else if (period === 'month') {
            dateFilter = { 
                completedAt: { 
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
                } 
            };
        }

        // All-time leaderboard from user stats
        if (period === 'all') {
            const users = await User.findAll({
                where: { isActive: true, gamesPlayed: { [Op.gt]: 0 } },
                order: [['highestScore', 'DESC']],
                limit: count,
                attributes: ['id', 'username', 'favoriteTeam', 'totalScore', 'gamesPlayed', 'highestScore']
            });

            return res.json({
                success: true,
                data: {
                    period,
                    leaderboard: users.map((u, i) => ({
                        rank: i + 1,
                        username: u.username,
                        favoriteTeam: u.favoriteTeam,
                        highestScore: u.highestScore,
                        totalScore: u.totalScore,
                        gamesPlayed: u.gamesPlayed
                    }))
                }
            });
        }

        // Period-based leaderboard from game sessions
        const results = await GameSession.findAll({
            where: { 
                status: 'completed',
                ...dateFilter
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'favoriteTeam']
            }],
            order: [['score', 'DESC']],
            limit: count
        });

        res.json({
            success: true,
            data: {
                period,
                leaderboard: results.map((r, i) => ({
                    rank: i + 1,
                    username: r.user.username,
                    favoriteTeam: r.user.favoriteTeam,
                    score: r.score,
                    correctAnswers: r.correctAnswers,
                    totalQuestions: r.totalQuestions,
                    completedAt: r.completedAt
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

const getUserStats = async (req, res, next) => {
    try {
        const userId = req.userId;

        const user = await User.findByPk(userId, {
            attributes: ['username', 'favoriteTeam', 'totalScore', 'gamesPlayed', 'highestScore']
        });

        const recentGames = await GameSession.findAll({
            where: { userId, status: 'completed' },
            order: [['completedAt', 'DESC']],
            limit: 5,
            attributes: ['score', 'correctAnswers', 'totalQuestions', 'difficulty', 'completedAt', 'timeSpentSeconds']
        });

        // Calculate average score
        const avgScore = recentGames.length > 0
            ? Math.round(recentGames.reduce((sum, g) => sum + g.score, 0) / recentGames.length)
            : 0;

        res.json({
            success: true,
            data: {
                user: {
                    username: user.username,
                    favoriteTeam: user.favoriteTeam,
                    totalScore: user.totalScore,
                    gamesPlayed: user.gamesPlayed,
                    highestScore: user.highestScore,
                    averageScore: avgScore
                },
                recentGames: recentGames.map(g => ({
                    score: g.score,
                    correctAnswers: g.correctAnswers,
                    totalQuestions: g.totalQuestions,
                    accuracy: g.totalQuestions > 0 
                        ? Math.round((g.correctAnswers / g.totalQuestions) * 100) 
                        : 0,
                    difficulty: g.difficulty,
                    completedAt: g.completedAt,
                    timeSpentSeconds: g.timeSpentSeconds
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    startGame,
    submitAnswer,
    endGame,
    getLeaderboard,
    getUserStats
};

