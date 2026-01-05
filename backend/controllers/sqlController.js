const { pool } = require('../config/database');
const { quizChallenges, queryChallenges, verifyChallenge } = require('../data/sqlChallenges');

// ========================================
// 🎯 QUIZ MODE - Multiple Choice
// ========================================

// Get quiz challenges list
const getQuizChallenges = async (req, res, next) => {
    try {
        const { difficulty } = req.query;

        // Use static data for listing (much faster, no DB queries needed here)
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

        // 1. Filter static challenges first
        let filtered = [...quizChallenges];
        if (difficulty && ['basic', 'medium', 'hard'].includes(difficulty)) {
            filtered = quizChallenges.filter(c => c.difficulty === difficulty);
        }

        // Shuffle and pick questions
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, numQuestions);

        // 2. Verify ONLY the selected questions (5 queries instead of 25+)
        const verifiedQuestions = await Promise.all(selected.map(c => verifyChallenge(pool, c)));

        const questions = verifiedQuestions.map(c => ({
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

// Submit quiz answer (scores are now updated at game end, not per question)
const submitQuizAnswer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;

        // 1. Find static challenge
        const staticChallenge = quizChallenges.find(c => c.id === parseInt(id));
        if (!staticChallenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found' });
        }

        // 2. Verify just this one question (1 query instead of 25+)
        const challenge = await verifyChallenge(pool, staticChallenge);

        if (!answer || !['A', 'B', 'C', 'D'].includes(answer.toUpperCase())) {
            return res.status(400).json({ success: false, message: 'Answer must be A, B, C, or D' });
        }

        const isCorrect = answer.toUpperCase() === challenge.correctAnswer;
        const pointsEarned = isCorrect ? challenge.points : 0;

        // Note: User scores are updated at game end via endQuizGame endpoint

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

// End quiz game and update user stats
const endQuizGame = async (req, res, next) => {
    try {
        const { totalScore, correctCount, totalQuestions } = req.body;
        const userId = req.userId;

        console.log('[endQuizGame] Called with:', { totalScore, correctCount, totalQuestions, userId });

        if (!userId) {
            console.log('[endQuizGame] No userId - not authenticated');
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        if (typeof totalScore !== 'number' || totalScore < 0) {
            console.log('[endQuizGame] Invalid score:', totalScore);
            return res.status(400).json({ success: false, message: 'Invalid score' });
        }

        try {
            // Update user stats - increment games_played once, add to total_score, update highest_score if this game was better
            console.log('[endQuizGame] Updating user', userId, 'with score:', totalScore);
            await pool.query(
                `UPDATE users 
                 SET total_score = total_score + ?, 
                     games_played = games_played + 1,
                     highest_score = GREATEST(highest_score, ?)
                 WHERE id = ?`,
                [totalScore, totalScore, userId]
            );

            // Get updated user data
            const [users] = await pool.query('SELECT username, total_score, games_played, highest_score FROM users WHERE id = ?', [userId]);
            const user = users[0];
            console.log('[endQuizGame] Updated user:', user);

            res.json({
                success: true,
                message: 'Game completed!',
                data: {
                    scoreAdded: totalScore,
                    correctCount,
                    totalQuestions,
                    newTotalScore: user?.total_score || 0,
                    newHighestScore: user?.highest_score || 0,
                    gamesPlayed: user?.games_played || 0
                }
            });
        } catch (dbError) {
            console.error('[endQuizGame] DB Error:', dbError);
            return res.status(500).json({ success: false, message: 'Failed to save score' });
        }
    } catch (error) {
        console.error('[endQuizGame] Error:', error);
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

            // Validate results - must match row count AND have correct columns
            if (challenge.validateFn(userResults)) {
                if (userResults.length > 0 && expectedResults.length > 0) {
                    const userCols = Object.keys(userResults[0]).length;
                    const expectedCols = Object.keys(expectedResults[0]).length;
                    const rowCountMatch = userResults.length === expectedResults.length;
                    const colCountMatch = userCols >= expectedCols - 1;

                    if (rowCountMatch && colCountMatch) {
                        // Check if first row data roughly matches (spot check)
                        const userFirstValues = Object.values(userResults[0]).map(v => String(v).toLowerCase());
                        const expectedFirstValues = Object.values(expectedResults[0]).map(v => String(v).toLowerCase());
                        const hasMatchingData = expectedFirstValues.some(ev => userFirstValues.includes(ev));
                        
                        if (hasMatchingData) {
                            isCorrect = true;
                            feedback = '✅ Great job! Your query produces correct results.';
                        } else {
                            feedback = '❌ Wrong answer. Your query returns different data than expected.';
                        }
                    } else if (!rowCountMatch) {
                        feedback = `❌ Wrong answer. Expected ${expectedResults.length} rows but got ${userResults.length}.`;
                    } else {
                        feedback = '❌ Wrong answer. Missing required columns.';
                    }
                } else if (userResults.length === 0 && expectedResults.length === 0) {
                    isCorrect = true;
                    feedback = '✅ Correct! Both return empty as expected.';
                } else if (userResults.length === 0) {
                    feedback = `❌ Wrong answer. Your query returned no results, expected ${expectedResults.length} rows.`;
                } else {
                    feedback = `❌ Wrong answer. Expected no results but got ${userResults.length} rows.`;
                }
            } else {
                feedback = '❌ Wrong answer. Query doesn\'t meet the requirements.';
            }
        } catch (sqlError) {
            feedback = `❌ SQL Error: ${sqlError.message}`;
            userResults = [];
        }

        const pointsEarned = isCorrect ? challenge.points : 0;

        // Update user total score if correct (challenges add to total but don't count as games)
        if (isCorrect && userId) {
            try {
                await pool.query(
                    `UPDATE users 
                     SET total_score = total_score + ?
                     WHERE id = ?`,
                    [pointsEarned, userId]
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
                solution: challenge.expectedQuery // Always show solution for learning
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

// Get database schema with detailed info
const getSchema = async (req, res, next) => {
    try {
        const schema = {
            tables: [
                {
                    name: 'players',
                    description: 'Football player information - contains all player details and current club',
                    primaryKey: 'player_id',
                    foreignKeys: [
                        { column: 'current_club_id', references: 'clubs.club_id' }
                    ],
                    columns: [
                        { name: 'player_id', type: 'INT', key: 'PK', description: 'Unique player identifier' },
                        { name: 'name', type: 'VARCHAR', description: 'Full player name' },
                        { name: 'first_name', type: 'VARCHAR', description: 'Player first name' },
                        { name: 'last_name', type: 'VARCHAR', description: 'Player last name' },
                        { name: 'country_of_citizenship', type: 'VARCHAR', description: 'Nationality' },
                        { name: 'position', type: 'VARCHAR', description: 'Main position (Attack, Midfield, Defender, Goalkeeper)' },
                        { name: 'sub_position', type: 'VARCHAR', description: 'Specific position (e.g., Centre-Forward, Right Winger)' },
                        { name: 'current_club_id', type: 'INT', key: 'FK', description: 'Current club ID → clubs.club_id' },
                        { name: 'current_club_name', type: 'VARCHAR', description: 'Current club name' },
                        { name: 'market_value_in_eur', type: 'BIGINT', description: 'Market value in Euros' },
                        { name: 'height_in_cm', type: 'INT', description: 'Player height in centimeters' },
                        { name: 'foot', type: 'VARCHAR', description: 'Preferred foot (left/right/both)' },
                        { name: 'date_of_birth', type: 'DATE', description: 'Birth date' }
                    ]
                },
                {
                    name: 'clubs',
                    description: 'Football clubs - team information and stadium details',
                    primaryKey: 'club_id',
                    foreignKeys: [
                        { column: 'domestic_competition_id', references: 'competitions.competition_id' }
                    ],
                    columns: [
                        { name: 'club_id', type: 'INT', key: 'PK', description: 'Unique club identifier' },
                        { name: 'name', type: 'VARCHAR', description: 'Club name' },
                        { name: 'domestic_competition_id', type: 'VARCHAR', key: 'FK', description: 'League ID → competitions.competition_id' },
                        { name: 'squad_size', type: 'INT', description: 'Number of players in squad' },
                        { name: 'average_age', type: 'DECIMAL', description: 'Average squad age' },
                        { name: 'stadium_name', type: 'VARCHAR', description: 'Home stadium name' },
                        { name: 'stadium_seats', type: 'INT', description: 'Stadium capacity' },
                        { name: 'coach_name', type: 'VARCHAR', description: 'Current coach name' },
                        { name: 'total_market_value', type: 'BIGINT', description: 'Total squad value in Euros' }
                    ]
                },
                {
                    name: 'competitions',
                    description: 'Leagues and tournaments - competition metadata',
                    primaryKey: 'competition_id',
                    foreignKeys: [],
                    columns: [
                        { name: 'competition_id', type: 'VARCHAR', key: 'PK', description: 'Unique competition identifier (e.g., GB1, ES1)' },
                        { name: 'name', type: 'VARCHAR', description: 'Competition name (e.g., Premier League)' },
                        { name: 'type', type: 'VARCHAR', description: 'Type (domestic_league, international_cup, etc.)' },
                        { name: 'country_name', type: 'VARCHAR', description: 'Country name' },
                        { name: 'confederation', type: 'VARCHAR', description: 'Continental confederation (UEFA, CONMEBOL, etc.)' },
                        { name: 'sub_type', type: 'VARCHAR', description: 'Sub-type (first_tier, second_tier, cup)' }
                    ]
                },
                {
                    name: 'games',
                    description: 'Match results - all game details and scores',
                    primaryKey: 'game_id',
                    foreignKeys: [
                        { column: 'competition_id', references: 'competitions.competition_id' },
                        { column: 'home_club_id', references: 'clubs.club_id' },
                        { column: 'away_club_id', references: 'clubs.club_id' }
                    ],
                    columns: [
                        { name: 'game_id', type: 'INT', key: 'PK', description: 'Unique game identifier' },
                        { name: 'competition_id', type: 'VARCHAR', key: 'FK', description: 'Competition ID → competitions.competition_id' },
                        { name: 'season', type: 'INT', description: 'Season year (e.g., 2023)' },
                        { name: 'date', type: 'DATE', description: 'Match date' },
                        { name: 'home_club_id', type: 'INT', key: 'FK', description: 'Home team ID → clubs.club_id' },
                        { name: 'away_club_id', type: 'INT', key: 'FK', description: 'Away team ID → clubs.club_id' },
                        { name: 'home_club_name', type: 'VARCHAR', description: 'Home team name' },
                        { name: 'away_club_name', type: 'VARCHAR', description: 'Away team name' },
                        { name: 'home_club_goals', type: 'INT', description: 'Home team goals scored' },
                        { name: 'away_club_goals', type: 'INT', description: 'Away team goals scored' },
                        { name: 'attendance', type: 'INT', description: 'Match attendance' },
                        { name: 'stadium', type: 'VARCHAR', description: 'Stadium name' },
                        { name: 'referee', type: 'VARCHAR', description: 'Referee name' }
                    ]
                },
                {
                    name: 'appearances',
                    description: 'Player stats per game - individual player performance in each match',
                    primaryKey: 'appearance_id',
                    foreignKeys: [
                        { column: 'game_id', references: 'games.game_id' },
                        { column: 'player_id', references: 'players.player_id' }
                    ],
                    columns: [
                        { name: 'appearance_id', type: 'INT', key: 'PK', description: 'Unique appearance identifier' },
                        { name: 'game_id', type: 'INT', key: 'FK', description: 'Game ID → games.game_id' },
                        { name: 'player_id', type: 'INT', key: 'FK', description: 'Player ID → players.player_id' },
                        { name: 'player_name', type: 'VARCHAR', description: 'Player name' },
                        { name: 'goals', type: 'INT', description: 'Goals scored in this game' },
                        { name: 'assists', type: 'INT', description: 'Assists in this game' },
                        { name: 'yellow_cards', type: 'INT', description: 'Yellow cards received' },
                        { name: 'red_cards', type: 'INT', description: 'Red cards received' },
                        { name: 'minutes_played', type: 'INT', description: 'Minutes played in game' }
                    ]
                },
                {
                    name: 'transfers',
                    description: 'Player transfers - movement between clubs with fees',
                    primaryKey: null,
                    foreignKeys: [
                        { column: 'player_id', references: 'players.player_id' },
                        { column: 'from_club_id', references: 'clubs.club_id' },
                        { column: 'to_club_id', references: 'clubs.club_id' }
                    ],
                    columns: [
                        { name: 'player_id', type: 'INT', key: 'FK', description: 'Player ID → players.player_id' },
                        { name: 'player_name', type: 'VARCHAR', description: 'Player name' },
                        { name: 'transfer_date', type: 'DATE', description: 'Transfer date' },
                        { name: 'transfer_season', type: 'VARCHAR', description: 'Transfer window (e.g., 2023-summer)' },
                        { name: 'from_club_id', type: 'INT', key: 'FK', description: 'Previous club ID → clubs.club_id' },
                        { name: 'to_club_id', type: 'INT', key: 'FK', description: 'New club ID → clubs.club_id' },
                        { name: 'from_club_name', type: 'VARCHAR', description: 'Previous club name' },
                        { name: 'to_club_name', type: 'VARCHAR', description: 'New club name' },
                        { name: 'transfer_fee', type: 'BIGINT', description: 'Transfer fee in Euros' },
                        { name: 'market_value_in_eur', type: 'BIGINT', description: 'Player market value at transfer time' }
                    ]
                },
                {
                    name: 'game_events',
                    description: 'In-game events - goals, cards, substitutions with minute',
                    primaryKey: 'game_event_id',
                    foreignKeys: [
                        { column: 'game_id', references: 'games.game_id' },
                        { column: 'club_id', references: 'clubs.club_id' },
                        { column: 'player_id', references: 'players.player_id' }
                    ],
                    columns: [
                        { name: 'game_event_id', type: 'INT', key: 'PK', description: 'Unique event identifier' },
                        { name: 'game_id', type: 'INT', key: 'FK', description: 'Game ID → games.game_id' },
                        { name: 'minute', type: 'INT', description: 'Minute of event' },
                        { name: 'type', type: 'VARCHAR', description: 'Event type (Goals, Cards, Substitutions)' },
                        { name: 'club_id', type: 'INT', key: 'FK', description: 'Club ID → clubs.club_id' },
                        { name: 'player_id', type: 'INT', key: 'FK', description: 'Player ID → players.player_id' },
                        { name: 'description', type: 'VARCHAR', description: 'Event description' }
                    ]
                }
            ],
            relationships: [
                { from: 'players', to: 'clubs', description: 'Players belong to clubs (current_club_id)', type: 'many-to-one' },
                { from: 'clubs', to: 'competitions', description: 'Clubs play in competitions (domestic_competition_id)', type: 'many-to-one' },
                { from: 'games', to: 'competitions', description: 'Games belong to competitions', type: 'many-to-one' },
                { from: 'games', to: 'clubs', description: 'Games have home and away clubs', type: 'many-to-many' },
                { from: 'appearances', to: 'games', description: 'Appearances are linked to games', type: 'many-to-one' },
                { from: 'appearances', to: 'players', description: 'Appearances track player stats', type: 'many-to-one' },
                { from: 'transfers', to: 'players', description: 'Transfers track player movements', type: 'many-to-one' },
                { from: 'transfers', to: 'clubs', description: 'Transfers link from/to clubs', type: 'many-to-many' },
                { from: 'game_events', to: 'games', description: 'Events happen in games', type: 'many-to-one' },
                { from: 'game_events', to: 'players', description: 'Events involve players', type: 'many-to-one' }
            ],
            diagram: `
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  competitions   │     │     clubs       │     │    players      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ 🔑 competition_id│◄────│ domestic_comp_id│     │ 🔑 player_id    │
│    name         │     │ 🔑 club_id      │◄────│    current_club_id
│    country_name │     │    name         │     │    name         │
│    type         │     │    stadium_name │     │    position     │
└─────────────────┘     │    coach_name   │     │    market_value │
                        └────────┬────────┘     └────────┬────────┘
                                 │                       │
        ┌────────────────────────┼───────────────────────┤
        │                        │                       │
        ▼                        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     games       │     │   transfers     │     │  appearances    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ 🔑 game_id      │     │    player_id ───┼────►│ 🔑 appearance_id│
│    home_club_id─┼────►│    from_club_id │     │    game_id ─────┼──┐
│    away_club_id─┼────►│    to_club_id   │     │    player_id ───┼──┤
│    competition_id     │    transfer_fee │     │    goals        │  │
│    date, score  │     │    transfer_date│     │    assists      │  │
└────────┬────────┘     └─────────────────┘     └─────────────────┘  │
         │                                                           │
         │              ┌─────────────────┐                          │
         │              │  game_events    │                          │
         │              ├─────────────────┤                          │
         └─────────────►│ 🔑 game_event_id│◄─────────────────────────┘
                        │    game_id      │
                        │    player_id    │
                        │    minute, type │
                        └─────────────────┘

🔑 = Primary Key    ──► = Foreign Key Relationship
`,
            tips: [
                'Use JOIN to connect tables: SELECT * FROM players p JOIN clubs c ON p.current_club_id = c.club_id',
                'Use GROUP BY for aggregations: SELECT club_id, COUNT(*) FROM players GROUP BY club_id',
                'Use ORDER BY to sort: SELECT * FROM players ORDER BY market_value_in_eur DESC',
                'Use LIMIT to restrict results: SELECT * FROM players LIMIT 10',
                'Use WHERE to filter: SELECT * FROM players WHERE position = "Attack"',
                'Use aggregate functions: COUNT(), SUM(), AVG(), MAX(), MIN()'
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
    endQuizGame,
    // Query Mode
    getQueryChallenges,
    getQueryChallenge,
    submitQueryAnswer,
    // Shared
    executeQuery,
    getSchema,
    getLeaderboard
};
