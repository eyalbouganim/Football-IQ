const { User, Question, GameSession, GameAnswer } = require('../models');
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const startGame = async (req, res, next) => {
    try {
        const { difficulty = 'mixed', questionCount = 10 } = req.body;
        const userId = req.userId;

        console.log(`[GAME] Starting game for User ${userId} | Diff: ${difficulty} | Count: ${questionCount}`);

        const count = Math.min(Math.max(parseInt(questionCount) || 10, 5), 20);
        
        // Use our new random finder
        const questions = await Question.findRandom(count, difficulty);

        console.log(`[GAME] Found ${questions.length} questions for session.`);

        if (questions.length === 0) {
            return next(new AppError('No questions available for this difficulty', 404));
        }

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

        const session = await GameSession.findOne({
            where: { id: sessionId, userId: userId, status: 'in_progress' }
        });

        if (!session) {
            return next(new AppError('Game session not found or already completed', 404));
        }

        const existingAnswer = await GameAnswer.findOne({
            where: { sessionId: sessionId, questionId: questionId }
        });

        if (existingAnswer) {
            return next(new AppError('Question already answered', 400));
        }

        const question = await Question.findById(questionId);
        if (!question) {
            return next(new AppError('Question not found', 404));
        }

        // --- LOGGING FOR VERIFICATION ---
        console.log('------------------------------------------------');
        console.log(`[QUIZ CHECK] Question ID: ${questionId}`);
        console.log(`[QUIZ CHECK] User Answer:    "${answer}"`);
        console.log(`[QUIZ CHECK] Correct Answer: "${question.correctAnswer}"`);
        // --------------------------------

        const isCorrect = answer.toString().trim().toLowerCase() ===
            question.correctAnswer.toString().trim().toLowerCase();
        
        console.log(`[QUIZ CHECK] Result: ${isCorrect ? 'PASSED ✅' : 'FAILED ❌'}`);
        console.log('------------------------------------------------');

        const pointsEarned = isCorrect ? question.points : 0;

        await GameAnswer.create({
            sessionId,
            questionId,
            userAnswer: answer,
            isCorrect,
            pointsEarned,
            timeSpentSeconds: timeSpent || 0
        });

        const newScore = isCorrect ? session.score + pointsEarned : session.score;
        const newCorrectAnswers = isCorrect ? session.correctAnswers + 1 : session.correctAnswers;
        
        await GameSession.update(sessionId, { score: newScore, correctAnswers: newCorrectAnswers });

        // Atomic update for stats
        await pool.query(
            `UPDATE questions 
             SET times_answered = times_answered + 1, 
                 times_correct = times_correct + ? 
             WHERE id = ?`,
            [isCorrect ? 1 : 0, questionId]
        );

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
    let connection;
    try {
        const { sessionId } = req.params;
        const userId = req.userId;

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [sessionRows] = await connection.execute(
            'SELECT * FROM game_sessions WHERE id = ? AND user_id = ?',
            [sessionId, userId]
        );
        const session = sessionRows[0];

        if (!session) {
            await connection.rollback();
            return next(new AppError('Game session not found', 404));
        }

        const now = new Date();
        const timeSpent = Math.floor((now - new Date(session.started_at)) / 1000);

        console.log(`[GAME END] Session ${sessionId} | Score: ${session.score} | Time: ${timeSpent}s`);

        await connection.execute(
            `UPDATE game_sessions 
             SET status = 'completed', completed_at = ?, time_spent_seconds = ? 
             WHERE id = ?`,
            [now, timeSpent, sessionId]
        );

        await connection.execute(
            `UPDATE users 
             SET games_played = games_played + 1, 
                 total_score = total_score + ?,
                 highest_score = GREATEST(highest_score, ?)
             WHERE id = ?`,
            [session.score, session.score, userId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Game completed',
            data: {
                sessionId: session.id,
                score: session.score,
                totalQuestions: session.total_questions,
                correctAnswers: session.correct_answers,
                accuracy: session.total_questions > 0
                    ? Math.round((session.correct_answers / session.total_questions) * 100)
                    : 0,
                timeSpentSeconds: timeSpent
            }
        });
    } catch (error) {
        if (connection) await connection.rollback();
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

const getLeaderboard = async (req, res, next) => {
    try {
        const { limit = 10, period = 'all' } = req.query;
        const count = Math.min(parseInt(limit) || 10, 100);

        if (period === 'all') {
            const query = `SELECT username, favorite_team, total_score, games_played, highest_score 
                           FROM users 
                           WHERE is_active = true 
                           ORDER BY total_score DESC 
                           LIMIT ?`;
            
            console.log(`[SQL LOG] Leaderboard Query: ${query.replace('?', count)}`);

            const [users] = await pool.query(query, [count]);

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

        let dateLimit = new Date(0);
        if (period === 'week') {
            dateLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === 'month') {
            dateLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }

        const query = `SELECT u.username, u.favorite_team, gs.score, gs.correct_answers, gs.total_questions, gs.completed_at
                       FROM game_sessions gs
                       JOIN users u ON gs.user_id = u.id
                       WHERE gs.status = 'completed' AND gs.completed_at >= ?
                       ORDER BY gs.score DESC
                       LIMIT ?`;

        console.log(`[SQL LOG] Leaderboard Query (Period: ${period}):`, query);

        const [results] = await pool.query(query, [dateLimit, count]);

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
            data: { period, leaderboard }
        });
    } catch (error) {
        next(error);
    }
};

const getUserStats = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) return next(new AppError('User not found', 404));

        const recentGamesQuery = `SELECT * FROM game_sessions 
                                  WHERE user_id = ? AND status = 'completed' 
                                  ORDER BY completed_at DESC 
                                  LIMIT 5`;
        
        console.log(`[SQL LOG] Recent Games Query for User ${userId}:`, recentGamesQuery);

        const [recentGames] = await pool.query(recentGamesQuery, [userId]);

        const totalScore = parseInt(user.totalScore || 0);
        const gamesPlayed = parseInt(user.gamesPlayed || 0);
        const highestScore = parseInt(user.highestScore || 0);
        const avgScore = gamesPlayed > 0 ? Math.round(totalScore / gamesPlayed) : 0;

        res.json({
            success: true,
            data: {
                user: {
                    username: user.username,
                    favoriteTeam: user.favoriteTeam,
                    totalScore: totalScore,
                    gamesPlayed: gamesPlayed,
                    highestScore: highestScore,
                    averageScore: avgScore
                },
                recentGames: recentGames.map(g => ({
                    score: g.score,
                    correctAnswers: g.correct_answers,
                    totalQuestions: g.total_questions,
                    accuracy: g.total_questions > 0 ? Math.round((g.correct_answers / g.total_questions) * 100) : 0,
                    difficulty: g.difficulty,
                    completedAt: g.completed_at,
                    timeSpentSeconds: g.time_spent_seconds
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { startGame, submitAnswer, endGame, getLeaderboard, getUserStats };