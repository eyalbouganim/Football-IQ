const { User, Question, GameSession, GameAnswer } = require('../models');
const { pool } = require('../config/database');
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
            // Raw SQL for All-Time Leaderboard
            const [users] = await pool.query(
                `SELECT username, favorite_team, total_score, games_played, highest_score 
                 FROM users 
                 WHERE is_active = true 
                 ORDER BY total_score DESC 
                 LIMIT ?`,
                [count]
            );

            return res.json({
                success: true,
                data: {
                    period,
                    leaderboard: users.map((u, i) => ({
                        rank: i + 1,
                        username: u.username,
                        favoriteTeam: u.favorite_team,
                        highestScore: u.highest_score || 0,
                        totalScore: u.total_score || 0,
                        gamesPlayed: u.games_played || 0
                    }))
                }
            });
        }

        // Calculate date filter for week/month
        let dateLimit = new Date(0);
        if (period === 'week') {
            dateLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === 'month') {
            dateLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }

        // Raw SQL for Period Leaderboard (joining game_sessions with users)
        const [results] = await pool.query(
            `SELECT u.username, u.favorite_team, gs.score, gs.correct_answers, gs.total_questions, gs.completed_at
             FROM game_sessions gs
             JOIN users u ON gs.user_id = u.id
             WHERE gs.status = 'completed' AND gs.completed_at >= ?
             ORDER BY gs.score DESC
             LIMIT ?`,
            [dateLimit, count]
        );

        const leaderboard = results.map((r, i) => ({
            rank: i + 1,
            username: r.username || 'Unknown',
            favoriteTeam: r.favorite_team || '-',
            score: r.score,
            correctAnswers: r.correct_answers,
            totalQuestions: r.total_questions,
            completedAt: r.completed_at
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

        // 1. Fetch User Model
        const user = await User.findById(userId);
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // 2. Fetch Recent Games
        // Use raw SQL since GameSession.findAll is not available
        const [recentGames] = await pool.query(
            `SELECT * FROM game_sessions 
             WHERE user_id = ? AND status = 'completed' 
             ORDER BY completed_at DESC 
             LIMIT 5`,
            [userId]
        );

        // 3. Fetch Raw Stats (Handle potential pool errors)
        let stats = {};
        if (pool) {
        const [statsRows] = await pool.query(
            'SELECT total_score, games_played, highest_score FROM users WHERE id = ?',
            [userId]
        );
            stats = statsRows[0] || {};
        } else {
            // Fallback if pool is not available
            console.warn('Database pool not available in gameController, falling back to ORM user object');
            stats = {
                total_score: user.totalScore,
                games_played: user.gamesPlayed,
                highest_score: user.highestScore
            };
        }

        const totalScore = parseInt(stats.total_score || 0);
        const gamesPlayed = parseInt(stats.games_played || 0);
        const highestScore = parseInt(stats.highest_score || 0);

        // Calculate average from global stats to include SQL Quiz games
        const avgScore = gamesPlayed > 0
            ? Math.round(totalScore / gamesPlayed)
            : 0;

        res.json({
            success: true,
            data: {
                user: {
                    username: user.username,
                    favoriteTeam: user.favoriteTeam || user.favorite_team,
                    totalScore: totalScore,
                    gamesPlayed: gamesPlayed,
                    highestScore: highestScore,
                    averageScore: avgScore
                },
                recentGames: recentGames.map(g => ({
                    score: g.score,
                    correctAnswers: g.correctAnswers || g.correct_answers,
                    totalQuestions: g.totalQuestions || g.total_questions,
                    accuracy: g.totalQuestions > 0
                        ? Math.round(((g.correctAnswers || g.correct_answers) / (g.totalQuestions || g.total_questions)) * 100)
                        : 0,
                    difficulty: g.difficulty,
                    completedAt: g.completedAt || g.completed_at,
                    timeSpentSeconds: g.timeSpentSeconds || g.time_spent_seconds
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
