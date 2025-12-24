const { User, Question, GameSession, GameAnswer } = require('../models');
const { AppError } = require('../middleware/errorHandler');

const startGame = async (req, res, next) => {
    try {
        const { difficulty = 'mixed', questionCount = 10 } = req.body;
        const userId = req.userId;

        // Ensure count is valid
        const count = Math.min(Math.max(parseInt(questionCount) || 10, 5), 20);

        // Model will translate 'isActive' -> 'is_active'
        const whereClause = { isActive: true };
        if (difficulty !== 'mixed') {
            whereClause.difficulty = difficulty;
        }

        // Use our new random finder
        const questions = await Question.findRandom(count, difficulty);

        if (questions.length === 0) {
            return next(new AppError('No questions available for this difficulty', 404));
        }

        // Create game session
        const session = await GameSession.create({
            userId,
            difficulty,
            totalQuestions: questions.length,
        });

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

        // Verify session (Model translates 'userId' -> 'user_id')
        const session = await GameSession.findOne({
            where: { id: sessionId, userId: userId, status: 'in_progress' }
        });

        if (!session) {
            return next(new AppError('Game session not found or already completed', 404));
        }

        // Check if already answered (Model translates 'sessionId' -> 'session_id')
        const existingAnswer = await GameAnswer.findOne({
            where: { sessionId: sessionId, questionId: questionId }
        });

        if (existingAnswer) {
            return next(new AppError('Question already answered', 400));
        }

        // Get the question
        const question = await Question.findById(questionId);
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
        const newScore = isCorrect ? session.score + pointsEarned : session.score;
        const newCorrectAnswers = isCorrect ? session.correctAnswers + 1 : session.correctAnswers;
        
        await GameSession.update(sessionId, { score: newScore, correctAnswers: newCorrectAnswers });

        // Update question statistics
        const newTimesAnswered = (question.timesAnswered || 0) + 1;
        const newTimesCorrect = isCorrect ? (question.timesCorrect || 0) + 1 : (question.timesCorrect || 0);
        
        // Model translates 'timesAnswered' -> 'times_answered'
        await Question.update(questionId, { timesAnswered: newTimesAnswered, timesCorrect: newTimesCorrect });

        const updatedSession = await GameSession.findById(sessionId);

        res.json({
            success: true,
            data: {
                isCorrect,
                pointsEarned,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                currentScore: updatedSession.score,
                correctAnswers: updatedSession.correctAnswers
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
            where: { id: sessionId, userId: userId },
        });

        if (!session) {
            return next(new AppError('Game session not found', 404));
        }

        // Calculate time spent
        const now = new Date();
        const timeSpent = Math.floor((now - new Date(session.startedAt)) / 1000);

        // Update session
        await GameSession.update(sessionId, { status: 'completed', completedAt: now, timeSpentSeconds: timeSpent });

        // Update user statistics
        const user = await User.findById(userId);
        const newGamesPlayed = user.gamesPlayed + 1;
        const newTotalScore = user.totalScore + session.score;
        const newHighestScore = session.score > user.highestScore ? session.score : user.highestScore;
        
        // Model translates 'gamesPlayed' -> 'games_played'
        await User.update(userId, { gamesPlayed: newGamesPlayed, totalScore: newTotalScore, highestScore: newHighestScore });

        const updatedSession = await GameSession.findById(sessionId);

        res.json({
            success: true,
            message: 'Game completed',
            data: {
                sessionId: updatedSession.id,
                score: updatedSession.score,
                totalQuestions: updatedSession.totalQuestions,
                correctAnswers: updatedSession.correctAnswers,
                accuracy: updatedSession.totalQuestions > 0
                    ? Math.round((updatedSession.correctAnswers / updatedSession.totalQuestions) * 100)
                    : 0,
                timeSpentSeconds: updatedSession.timeSpentSeconds
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

        if (period === 'all') {
            // Include all active users in leaderboard
            const users = await User.findAll({
                where: { isActive: true },
                order: [['totalScore', 'DESC']],
                limit: count,
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

        let dateFilter = {};
        if (period === 'week') {
            dateFilter = { completedAt: { '[Op.gte]': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
        } else if (period === 'month') {
            dateFilter = { completedAt: { '[Op.gte]': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
        }

        // Model translates keys to snake_case automatically
        const results = await GameSession.findAll({
            where: {
                status: 'completed',
                ...dateFilter
            },
            order: [['score', 'DESC']],
            limit: count
        });

        const leaderboard = await Promise.all(results.map(async (r, i) => {
            const user = await User.findById(r.userId);
            return {
                rank: i + 1,
                username: user ? user.username : 'Unknown',
                favoriteTeam: user ? user.favoriteTeam : '-',
                score: r.score,
                correctAnswers: r.correctAnswers,
                totalQuestions: r.totalQuestions,
                completedAt: r.completedAt
            };
        }));

        res.json({
            success: true,
            data: {
                period,
                leaderboard
            }
        });
    } catch (error) {
        next(error);
    }
};

const getUserStats = async (req, res, next) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId);

        const recentGames = await GameSession.findAll({
            where: { userId, status: 'completed' },
            order: [['completedAt', 'DESC']],
            limit: 5,
        });

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

// FIX: Export the functions directly. Do NOT use require() here.
module.exports = {
    startGame,
    submitAnswer,
    endGame,
    getLeaderboard,
    getUserStats
};
