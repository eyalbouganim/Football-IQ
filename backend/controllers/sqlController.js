const { pool } = require('../config/database');
const { quizChallenges, queryChallenges } = require('../data/sqlChallenges');

// ========================================
// 🎯 QUIZ MODE - Multiple Choice
// ========================================

// Get quiz challenges list
const getQuizChallenges = async (req, res, next) => {
    try {
        const { difficulty } = req.query;

        let challenges = quizChallenges.map(c => ({
            id: c.id,
            difficulty: c.difficulty,
            category: c.category,
            points: c.points
        }));

        if (difficulty && ['basic', 'medium', 'hard'].includes(difficulty)) {
            challenges = challenges.filter(c => c.difficulty === difficulty);
        }

        res.json({
            success: true,
            data: {
                challenges,
                total: challenges.length,
                byDifficulty: {
                    basic: quizChallenges.filter(c => c.difficulty === 'basic').length,
                    medium: quizChallenges.filter(c => c.difficulty === 'medium').length,
                    hard: quizChallenges.filter(c => c.difficulty === 'hard').length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Start a quiz game
const startQuizGame = async (req, res, next) => {
    try {
        const { difficulty, count = 5 } = req.query;
        const numQuestions = Math.min(Math.max(parseInt(count) || 5, 1), 10);

        let filtered = [...quizChallenges];
        if (difficulty && ['basic', 'medium', 'hard'].includes(difficulty)) {
            filtered = quizChallenges.filter(c => c.difficulty === difficulty);
        }

        // Shuffle and pick questions
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, numQuestions);

        const questions = selected.map(c => ({
            id: c.id,
            difficulty: c.difficulty,
            category: c.category,
            question: c.question,
            query: c.query,
            options: c.options,
            points: c.points
        }));

        res.json({
            success: true,
            data: {
                questions,
                totalQuestions: questions.length,
                maxPoints: selected.reduce((sum, c) => sum + c.points, 0)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Submit quiz answer
const submitQuizAnswer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;
        const userId = req.userId;

        const challenge = quizChallenges.find(c => c.id === parseInt(id));
        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found' });
        }

        if (!answer || !['A', 'B', 'C', 'D'].includes(answer.toUpperCase())) {
            return res.status(400).json({ success: false, message: 'Answer must be A, B, C, or D' });
        }

        const isCorrect = answer.toUpperCase() === challenge.correctAnswer;
        const pointsEarned = isCorrect ? challenge.points : 0;

        // Update user score if correct
        if (isCorrect && userId) {
            try {
                await pool.query(
                    `UPDATE users 
                     SET total_score = total_score + ?, 
                         games_played = games_played + 1,
                         highest_score = GREATEST(highest_score, ?)
                     WHERE id = ?`,
                    [pointsEarned, pointsEarned, userId]
                );
            } catch (dbError) {
                console.error('Error updating score:', dbError);
            }
        }

        res.json({
            success: true,
            data: {
                isCorrect,
                pointsEarned,
                correctAnswer: challenge.correctAnswer,
                explanation: challenge.explanation,
                yourAnswer: answer.toUpperCase()
            }
        });
    } catch (error) {
        next(error);
    }
};

// ========================================
// ✍️ QUERY MODE - Write SQL
// ========================================

// Get query challenges list
const getQueryChallenges = async (req, res, next) => {
    try {
        const { difficulty } = req.query;

        let challenges = queryChallenges.map(c => ({
            id: c.id,
            difficulty: c.difficulty,
            category: c.category,
            title: c.title,
            points: c.points
        }));

        if (difficulty && ['basic', 'medium', 'hard'].includes(difficulty)) {
            challenges = challenges.filter(c => c.difficulty === difficulty);
        }

        res.json({
            success: true,
            data: {
                challenges,
                total: challenges.length,
                byDifficulty: {
                    basic: queryChallenges.filter(c => c.difficulty === 'basic').length,
                    medium: queryChallenges.filter(c => c.difficulty === 'medium').length,
                    hard: queryChallenges.filter(c => c.difficulty === 'hard').length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single query challenge
const getQueryChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;
        const challenge = queryChallenges.find(c => c.id === parseInt(id));

        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found' });
        }

        res.json({
            success: true,
            data: {
                id: challenge.id,
                difficulty: challenge.difficulty,
                category: challenge.category,
                title: challenge.title,
                description: challenge.description,
                hint: challenge.hint,
                points: challenge.points,
                table: challenge.table
            }
        });
    } catch (error) {
        next(error);
    }
};

// Submit query answer
const submitQueryAnswer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { query } = req.body;
        const userId = req.userId;

        const challenge = queryChallenges.find(c => c.id === parseInt(id));
        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found' });
        }

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ success: false, message: 'Query is required' });
        }

        // Security check - only SELECT allowed
        const normalizedQuery = query.trim().toUpperCase();
        if (!normalizedQuery.startsWith('SELECT')) {
            return res.status(400).json({ success: false, message: 'Only SELECT queries allowed' });
        }

        const dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
        for (const kw of dangerous) {
            if (normalizedQuery.includes(kw)) {
                return res.status(400).json({ success: false, message: `${kw} not allowed` });
            }
        }

        let userResults, expectedResults;
        let isCorrect = false;
        let feedback = '';

        try {
            // Execute user query
            const [userRows] = await pool.query(query);
            userResults = userRows;

            // Execute expected query
            const [expectedRows] = await pool.query(challenge.expectedQuery);
            expectedResults = expectedRows;

            // Validate results
            if (challenge.validateFn(userResults)) {
                // Check if results match roughly
                if (userResults.length > 0 && expectedResults.length > 0) {
                    const userCols = Object.keys(userResults[0]).length;
                    const expectedCols = Object.keys(expectedResults[0]).length;

                    if (userCols >= expectedCols - 1 && userResults.length === expectedResults.length) {
                        isCorrect = true;
                        feedback = '✅ Great job! Your query produces correct results.';
                    } else if (userCols >= expectedCols - 1) {
                        isCorrect = true;
                        feedback = '✅ Correct logic! Result count may vary slightly.';
                    } else {
                        feedback = '⚠️ Query runs but may be missing columns.';
                    }
                } else if (userResults.length === 0 && expectedResults.length === 0) {
                    isCorrect = true;
                    feedback = '✅ Correct! Both return empty as expected.';
                } else {
                    feedback = '⚠️ Query runs but returns different row count.';
                }
            } else {
                feedback = '⚠️ Query runs but doesn\'t meet the requirements.';
            }
        } catch (sqlError) {
            feedback = `❌ SQL Error: ${sqlError.message}`;
            userResults = [];
        }

        const pointsEarned = isCorrect ? challenge.points : 0;

        // Update user score if correct
        if (isCorrect && userId) {
            try {
                await pool.query(
                    `UPDATE users 
                     SET total_score = total_score + ?, 
                         games_played = games_played + 1,
                         highest_score = GREATEST(highest_score, ?)
                     WHERE id = ?`,
                    [pointsEarned, pointsEarned, userId]
                );
            } catch (dbError) {
                console.error('Error updating score:', dbError);
            }
        }

        res.json({
            success: true,
            data: {
                isCorrect,
                feedback,
                pointsEarned,
                userResults: (userResults || []).slice(0, 20),
                expectedSample: !isCorrect ? (expectedResults || []).slice(0, 5) : null,
                hint: !isCorrect ? challenge.hint : null,
                solution: isCorrect ? challenge.expectedQuery : null
            }
        });
    } catch (error) {
        next(error);
    }
};

// Execute query in sandbox mode
const executeQuery = async (req, res, next) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ success: false, message: 'Query is required' });
        }

        const normalizedQuery = query.trim().toUpperCase();
        if (!normalizedQuery.startsWith('SELECT')) {
            return res.status(400).json({ success: false, message: 'Only SELECT queries allowed' });
        }

        const dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
        for (const kw of dangerous) {
            if (normalizedQuery.includes(kw)) {
                return res.status(400).json({ success: false, message: `${kw} not allowed` });
            }
        }

        const startTime = Date.now();
        const [results] = await pool.query(query);
        const executionTime = Date.now() - startTime;

        const limited = results.slice(0, 100);

        res.json({
            success: true,
            data: {
                results: limited,
                rowCount: results.length,
                truncated: results.length > 100,
                executionTime: `${executionTime}ms`,
                columns: limited.length > 0 ? Object.keys(limited[0]) : []
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'SQL Error',
            error: error.message
        });
    }
};

// Get database schema
const getSchema = async (req, res, next) => {
    try {
        const schema = {
            tables: [
                {
                    name: 'players',
                    description: 'Football player information',
                    columns: ['player_id', 'name', 'first_name', 'last_name', 'country_of_citizenship', 'position', 'sub_position', 'current_club_id', 'current_club_name', 'market_value_in_eur', 'height_in_cm', 'foot', 'date_of_birth']
                },
                {
                    name: 'clubs',
                    description: 'Football clubs',
                    columns: ['club_id', 'name', 'domestic_competition_id', 'squad_size', 'average_age', 'stadium_name', 'stadium_seats', 'coach_name', 'total_market_value']
                },
                {
                    name: 'games',
                    description: 'Match results',
                    columns: ['game_id', 'competition_id', 'season', 'date', 'home_club_id', 'away_club_id', 'home_club_name', 'away_club_name', 'home_club_goals', 'away_club_goals', 'attendance', 'stadium', 'referee']
                },
                {
                    name: 'appearances',
                    description: 'Player stats per game',
                    columns: ['appearance_id', 'game_id', 'player_id', 'player_name', 'goals', 'assists', 'yellow_cards', 'red_cards', 'minutes_played']
                },
                {
                    name: 'competitions',
                    description: 'Leagues and tournaments',
                    columns: ['competition_id', 'name', 'type', 'country_name', 'confederation', 'sub_type']
                },
                {
                    name: 'transfers',
                    description: 'Player transfers',
                    columns: ['player_id', 'player_name', 'transfer_date', 'transfer_season', 'from_club_id', 'to_club_id', 'from_club_name', 'to_club_name', 'transfer_fee', 'market_value_in_eur']
                },
                {
                    name: 'game_events',
                    description: 'In-game events (goals, cards, etc)',
                    columns: ['game_event_id', 'game_id', 'minute', 'type', 'club_id', 'player_id', 'description']
                }
            ]
        };

        res.json({ success: true, data: { schema } });
    } catch (error) {
        next(error);
    }
};

// Get leaderboard
const getLeaderboard = async (req, res, next) => {
    try {
        const [users] = await pool.query(
            `SELECT username, total_score, games_played, favorite_team 
             FROM users 
             WHERE is_active = true AND games_played > 0
             ORDER BY total_score DESC 
             LIMIT 20`
        );

        res.json({
            success: true,
            data: {
                leaderboard: users.map((u, i) => ({
                    rank: i + 1,
                    username: u.username,
                    score: u.total_score,
                    gamesPlayed: u.games_played,
                    favoriteTeam: u.favorite_team
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Quiz Mode
    getQuizChallenges,
    startQuizGame,
    submitQuizAnswer,
    // Query Mode
    getQueryChallenges,
    getQueryChallenge,
    submitQueryAnswer,
    // Shared
    executeQuery,
    getSchema,
    getLeaderboard
};
