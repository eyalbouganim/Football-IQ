const { pool } = require('../config/database');
const { sqlChallenges } = require('../data/sqlChallenges');
const { AppError } = require('../middleware/errorHandler');

// Get all challenges (without answers)
const getChallenges = async (req, res, next) => {
    try {
        const { difficulty } = req.query;

        let challenges = sqlChallenges.map(c => ({
            id: c.id,
            difficulty: c.difficulty,
            category: c.category,
            title: c.title,
            description: c.description,
            hint: c.hint,
            points: c.points,
            schema: c.schema
        }));

        if (difficulty) {
            challenges = challenges.filter(c => c.difficulty === difficulty);
        }

        res.json({
            success: true,
            data: {
                challenges,
                total: challenges.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get a single challenge
const getChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;
        const challenge = sqlChallenges.find(c => c.id === parseInt(id));

        if (!challenge) {
            return next(new AppError('Challenge not found', 404));
        }

        res.json({
            success: true,
            data: {
                challenge: {
                    id: challenge.id,
                    difficulty: challenge.difficulty,
                    category: challenge.category,
                    title: challenge.title,
                    description: challenge.description,
                    hint: challenge.hint,
                    points: challenge.points,
                    schema: challenge.schema
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Execute a SQL query (for practice)
const executeQuery = async (req, res, next) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== 'string') {
            return next(new AppError('Query is required', 400));
        }

        // Security: Only allow SELECT queries
        const normalizedQuery = query.trim().toUpperCase();
        if (!normalizedQuery.startsWith('SELECT')) {
            return next(new AppError('Only SELECT queries are allowed', 400));
        }

        // Block dangerous keywords
        const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE'];
        for (const keyword of dangerousKeywords) {
            if (normalizedQuery.includes(keyword)) {
                return next(new AppError(`${keyword} operations are not allowed`, 400));
            }
        }

        // Execute the query with timeout
        const startTime = Date.now();
        const [results] = await pool.query(query);
        const executionTime = Date.now() - startTime;

        // Limit results
        const limitedResults = results.slice(0, 100);

        res.json({
            success: true,
            data: {
                results: limitedResults,
                rowCount: results.length,
                truncated: results.length > 100,
                executionTime: `${executionTime}ms`,
                columns: limitedResults.length > 0 ? Object.keys(limitedResults[0]) : []
            }
        });
    } catch (error) {
        // Return SQL error message to help user debug
        res.status(400).json({
            success: false,
            message: 'SQL Error',
            error: error.message
        });
    }
};

// Submit answer for a challenge
const submitChallenge = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { query } = req.body;
        const userId = req.userId;

        const challenge = sqlChallenges.find(c => c.id === parseInt(id));
        if (!challenge) {
            return next(new AppError('Challenge not found', 404));
        }

        if (!query || typeof query !== 'string') {
            return next(new AppError('Query is required', 400));
        }

        // Security check
        const normalizedQuery = query.trim().toUpperCase();
        if (!normalizedQuery.startsWith('SELECT')) {
            return next(new AppError('Only SELECT queries are allowed', 400));
        }

        const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
        for (const keyword of dangerousKeywords) {
            if (normalizedQuery.includes(keyword)) {
                return next(new AppError(`${keyword} operations are not allowed`, 400));
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

            // Validate using the challenge's validation function
            if (challenge.validateFn(userResults)) {
                // Additional check: compare result structure and approximate values
                if (userResults.length > 0 && expectedResults.length > 0) {
                    const userCols = Object.keys(userResults[0]).sort();
                    const expectedCols = Object.keys(expectedResults[0]).sort();

                    // Check if columns are similar (allowing for different aliases)
                    if (userCols.length >= expectedCols.length - 1) {
                        isCorrect = true;
                        feedback = 'Great job! Your query produces correct results.';
                    } else {
                        feedback = 'Your query runs but may be missing some required columns.';
                    }
                } else if (userResults.length === 0 && expectedResults.length === 0) {
                    isCorrect = true;
                    feedback = 'Correct! Both queries return empty results as expected.';
                } else {
                    feedback = 'Your query runs but returns different results than expected.';
                }
            } else {
                feedback = 'Your query runs but doesn\'t meet the requirements. Check the conditions in the description.';
            }

        } catch (sqlError) {
            feedback = `SQL Error: ${sqlError.message}`;
            userResults = [];
        }

        // Update user score if correct
        if (isCorrect && userId) {
            const { User } = require('../models');
            const user = await User.findById(userId);
            if (user) {
                await User.update(userId, {
                    totalScore: user.totalScore + challenge.points,
                    gamesPlayed: user.gamesPlayed + 1,
                    highestScore: challenge.points > user.highestScore ? challenge.points : user.highestScore
                });
            }
        }

        res.json({
            success: true,
            data: {
                isCorrect,
                feedback,
                points: isCorrect ? challenge.points : 0,
                userResults: userResults.slice(0, 20),
                expectedSample: isCorrect ? null : expectedResults.slice(0, 5),
                hint: !isCorrect ? challenge.hint : null,
                solution: !isCorrect ? null : challenge.expectedQuery // Show solution only if correct
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get database schema info
const getSchema = async (req, res, next) => {
    try {
        const schema = {
            tables: [
                {
                    name: 'players',
                    description: 'Football players information',
                    columns: [
                        { name: 'player_id', type: 'INTEGER', description: 'Primary key' },
                        { name: 'name', type: 'TEXT', description: 'Full player name' },
                        { name: 'first_name', type: 'TEXT', description: 'First name' },
                        { name: 'last_name', type: 'TEXT', description: 'Last name' },
                        { name: 'country_of_citizenship', type: 'TEXT', description: 'Nationality' },
                        { name: 'position', type: 'TEXT', description: 'Playing position (Attack, Midfield, Defender, Goalkeeper)' },
                        { name: 'sub_position', type: 'TEXT', description: 'Specific position (e.g., Centre-Forward)' },
                        { name: 'current_club_id', type: 'INTEGER', description: 'FK to clubs' },
                        { name: 'current_club_name', type: 'TEXT', description: 'Current club name' },
                        { name: 'market_value_in_eur', type: 'INTEGER', description: 'Market value in EUR' },
                        { name: 'height_in_cm', type: 'INTEGER', description: 'Height in centimeters' },
                        { name: 'foot', type: 'TEXT', description: 'Preferred foot (left/right)' },
                        { name: 'date_of_birth', type: 'TEXT', description: 'Birth date' }
                    ],
                    sampleQuery: 'SELECT name, position, market_value_in_eur FROM players LIMIT 5'
                },
                {
                    name: 'clubs',
                    description: 'Football clubs information',
                    columns: [
                        { name: 'club_id', type: 'INTEGER', description: 'Primary key' },
                        { name: 'name', type: 'TEXT', description: 'Club name' },
                        { name: 'domestic_competition_id', type: 'TEXT', description: 'FK to competitions' },
                        { name: 'squad_size', type: 'INTEGER', description: 'Number of players' },
                        { name: 'average_age', type: 'REAL', description: 'Average player age' },
                        { name: 'stadium_name', type: 'TEXT', description: 'Home stadium' },
                        { name: 'stadium_seats', type: 'INTEGER', description: 'Stadium capacity' },
                        { name: 'coach_name', type: 'TEXT', description: 'Head coach' }
                    ],
                    sampleQuery: 'SELECT name, squad_size, stadium_name FROM clubs LIMIT 5'
                },
                {
                    name: 'games',
                    description: 'Match results',
                    columns: [
                        { name: 'game_id', type: 'INTEGER', description: 'Primary key' },
                        { name: 'competition_id', type: 'TEXT', description: 'FK to competitions' },
                        { name: 'season', type: 'INTEGER', description: 'Season year' },
                        { name: 'date', type: 'TEXT', description: 'Match date' },
                        { name: 'home_club_id', type: 'INTEGER', description: 'Home team FK' },
                        { name: 'away_club_id', type: 'INTEGER', description: 'Away team FK' },
                        { name: 'home_club_name', type: 'TEXT', description: 'Home team name' },
                        { name: 'away_club_name', type: 'TEXT', description: 'Away team name' },
                        { name: 'home_club_goals', type: 'INTEGER', description: 'Home team goals' },
                        { name: 'away_club_goals', type: 'INTEGER', description: 'Away team goals' },
                        { name: 'attendance', type: 'INTEGER', description: 'Match attendance' },
                        { name: 'stadium', type: 'TEXT', description: 'Venue' }
                    ],
                    sampleQuery: 'SELECT home_club_name, away_club_name, home_club_goals, away_club_goals FROM games LIMIT 5'
                },
                {
                    name: 'appearances',
                    description: 'Player match appearances with stats',
                    columns: [
                        { name: 'appearance_id', type: 'TEXT', description: 'Primary key' },
                        { name: 'game_id', type: 'INTEGER', description: 'FK to games' },
                        { name: 'player_id', type: 'INTEGER', description: 'FK to players' },
                        { name: 'player_name', type: 'TEXT', description: 'Player name' },
                        { name: 'competition_id', type: 'TEXT', description: 'FK to competitions' },
                        { name: 'goals', type: 'INTEGER', description: 'Goals scored in match' },
                        { name: 'assists', type: 'INTEGER', description: 'Assists in match' },
                        { name: 'yellow_cards', type: 'INTEGER', description: 'Yellow cards received' },
                        { name: 'red_cards', type: 'INTEGER', description: 'Red cards received' },
                        { name: 'minutes_played', type: 'INTEGER', description: 'Minutes played' }
                    ],
                    sampleQuery: 'SELECT player_name, goals, assists FROM appearances WHERE goals > 0 LIMIT 5'
                },
                {
                    name: 'competitions',
                    description: 'Football competitions/leagues',
                    columns: [
                        { name: 'competition_id', type: 'TEXT', description: 'Primary key' },
                        { name: 'name', type: 'TEXT', description: 'Competition name' },
                        { name: 'type', type: 'TEXT', description: 'Type (domestic_league, cup, etc.)' },
                        { name: 'country_name', type: 'TEXT', description: 'Country' },
                        { name: 'confederation', type: 'TEXT', description: 'Confederation (UEFA, etc.)' }
                    ],
                    sampleQuery: 'SELECT name, country_name, type FROM competitions LIMIT 5'
                },
                {
                    name: 'transfers',
                    description: 'Player transfers between clubs',
                    columns: [
                        { name: 'player_id', type: 'INTEGER', description: 'FK to players' },
                        { name: 'player_name', type: 'TEXT', description: 'Player name' },
                        { name: 'transfer_date', type: 'TEXT', description: 'Transfer date' },
                        { name: 'from_club_id', type: 'INTEGER', description: 'Source club FK' },
                        { name: 'to_club_id', type: 'INTEGER', description: 'Destination club FK' },
                        { name: 'from_club_name', type: 'TEXT', description: 'Source club name' },
                        { name: 'to_club_name', type: 'TEXT', description: 'Destination club name' },
                        { name: 'transfer_fee', type: 'REAL', description: 'Transfer fee in EUR' },
                        { name: 'market_value_in_eur', type: 'REAL', description: 'Player value at transfer' }
                    ],
                    sampleQuery: 'SELECT player_name, from_club_name, to_club_name, transfer_fee FROM transfers WHERE transfer_fee > 0 LIMIT 5'
                }
            ]
        };

        res.json({
            success: true,
            data: { schema }
        });
    } catch (error) {
        next(error);
    }
};

// Get leaderboard for SQL challenges
const getSqlLeaderboard = async (req, res, next) => {
    try {
        const { User } = require('../models');

        const users = await User.findAll({
            where: {
                isActive: true,
                'games_played': { '[Op.gt]': 0 }
            },
            order: [['totalScore', 'DESC']],
            limit: 20,
        });

        res.json({
            success: true,
            data: {
                leaderboard: users.map((u, i) => ({
                    rank: i + 1,
                    username: u.username,
                    score: u.totalScore,
                    challengesSolved: u.gamesPlayed,
                    favoriteTeam: u.favoriteTeam
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getChallenges,
    getChallenge,
    executeQuery,
    submitChallenge,
    getSchema,
    getSqlLeaderboard
};
