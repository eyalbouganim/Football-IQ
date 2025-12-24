// ============================================================
// SQL CHALLENGES - Football IQ
// ============================================================
// Two game modes:
// 1. QUIZ MODE (Multiple Choice) - User picks A/B/C/D
// 2. QUERY MODE (Write SQL) - User writes the actual query
// ============================================================
// Tables covered: players, clubs, games, appearances, 
//                 competitions, transfers, game_events
// ============================================================

// ========================================
// 🎯 QUIZ MODE - Multiple Choice Questions
// ========================================
const quizChallenges = [
    // ========== BASIC (10 points) ==========
    // --- PLAYERS TABLE ---
    {
        id: 1,
        difficulty: 'basic',
        points: 10,
        category: 'Players',
        table: 'players',
        question: 'What does this query return?',
        query: `SELECT COUNT(*) AS total_players FROM players;`,
        options: [
            'A) The names of all players',
            'B) The total number of players in the database',
            'C) The sum of all player IDs',
            'D) The average age of players'
        ],
        correctAnswer: 'B',
        explanation: 'COUNT(*) counts all rows in the table, returning the total number of players.'
    },
    {
        id: 2,
        difficulty: 'basic',
        points: 10,
        category: 'Players',
        table: 'players',
        question: 'What does this query return?',
        query: `SELECT name, position FROM players WHERE foot = 'Left';`,
        options: [
            'A) All players sorted by their left foot skills',
            'B) Players who play on the left side',
            'C) All left-footed players with their names and positions',
            'D) The count of left-footed players'
        ],
        correctAnswer: 'C',
        explanation: 'WHERE foot = "Left" filters for left-footed players, returning their name and position.'
    },
    // --- CLUBS TABLE ---
    {
        id: 3,
        difficulty: 'basic',
        points: 10,
        category: 'Clubs',
        table: 'clubs',
        question: 'What does this query return?',
        query: `SELECT name, stadium_name, squad_size FROM clubs WHERE squad_size > 30;`,
        options: [
            'A) All clubs with exactly 30 players',
            'B) Clubs with more than 30 players, showing name, stadium, and squad size',
            'C) The top 30 clubs by squad size',
            'D) Total number of players across all clubs'
        ],
        correctAnswer: 'B',
        explanation: 'WHERE squad_size > 30 filters for clubs with more than 30 players.'
    },
    // --- COMPETITIONS TABLE ---
    {
        id: 4,
        difficulty: 'basic',
        points: 10,
        category: 'Competitions',
        table: 'competitions',
        question: 'What does this query return?',
        query: `SELECT name, country_name FROM competitions WHERE type = 'domestic_league';`,
        options: [
            'A) All domestic leagues with their country names',
            'B) The number of domestic leagues',
            'C) International competitions only',
            'D) Countries with the most leagues'
        ],
        correctAnswer: 'A',
        explanation: 'This filters for domestic league competitions and shows their names and countries.'
    },
    // --- GAMES TABLE ---
    {
        id: 5,
        difficulty: 'basic',
        points: 10,
        category: 'Games',
        table: 'games',
        question: 'What does this query return?',
        query: `SELECT home_club_name, away_club_name, home_club_goals, away_club_goals 
FROM games 
WHERE home_club_goals > 5;`,
        options: [
            'A) Games where the home team scored exactly 5 goals',
            'B) Games where the home team scored more than 5 goals',
            'C) The top 5 home team performances',
            'D) All games with 5 total goals'
        ],
        correctAnswer: 'B',
        explanation: 'WHERE home_club_goals > 5 filters for games where the home team scored more than 5.'
    },
    // --- TRANSFERS TABLE ---
    {
        id: 6,
        difficulty: 'basic',
        points: 10,
        category: 'Transfers',
        table: 'transfers',
        question: 'What does this query return?',
        query: `SELECT player_name, from_club_name, to_club_name, transfer_fee 
FROM transfers 
ORDER BY transfer_fee DESC 
LIMIT 5;`,
        options: [
            'A) 5 random transfers',
            'B) The 5 cheapest transfers',
            'C) The 5 most expensive transfers',
            'D) All transfers above 5 million'
        ],
        correctAnswer: 'C',
        explanation: 'ORDER BY transfer_fee DESC + LIMIT 5 returns the top 5 most expensive transfers.'
    },
    // --- APPEARANCES TABLE ---
    {
        id: 7,
        difficulty: 'basic',
        points: 10,
        category: 'Appearances',
        table: 'appearances',
        question: 'What does this query return?',
        query: `SELECT player_name, goals, assists FROM appearances WHERE goals >= 3;`,
        options: [
            'A) Players who scored exactly 3 goals in a match',
            'B) Players who scored 3 or more goals in a single match (hat-tricks+)',
            'C) The top 3 scorers overall',
            'D) Players with 3 total career goals'
        ],
        correctAnswer: 'B',
        explanation: 'This finds appearances where a player scored 3+ goals in a single game (hat-tricks or more).'
    },

    // ========== MEDIUM (25 points) ==========
    // --- PLAYERS + GROUP BY ---
    {
        id: 8,
        difficulty: 'medium',
        points: 25,
        category: 'Players',
        table: 'players',
        question: 'What does this query return?',
        query: `SELECT country_of_citizenship, COUNT(*) AS player_count 
FROM players 
GROUP BY country_of_citizenship 
ORDER BY player_count DESC 
LIMIT 10;`,
        options: [
            'A) The 10 countries with the most players',
            'B) 10 random countries and their populations',
            'C) All countries where players were born',
            'D) The top 10 players from each country'
        ],
        correctAnswer: 'A',
        explanation: 'GROUP BY country, COUNT(*) counts each, ORDER BY DESC + LIMIT 10 gives top 10 countries.'
    },
    // --- CLUBS + AVG ---
    {
        id: 9,
        difficulty: 'medium',
        points: 25,
        category: 'Clubs',
        table: 'clubs',
        question: 'What does this query return?',
        query: `SELECT domestic_competition_id, 
       COUNT(*) AS num_clubs,
       ROUND(AVG(squad_size), 1) AS avg_squad
FROM clubs 
GROUP BY domestic_competition_id 
ORDER BY num_clubs DESC;`,
        options: [
            'A) The largest clubs in each league',
            'B) Number of clubs and average squad size per league',
            'C) Total players in each competition',
            'D) Leagues with the biggest stadiums'
        ],
        correctAnswer: 'B',
        explanation: 'This groups clubs by league and calculates count and average squad size per league.'
    },
    // --- APPEARANCES + HAVING ---
    {
        id: 10,
        difficulty: 'medium',
        points: 25,
        category: 'Appearances',
        table: 'appearances',
        question: 'What does this query return?',
        query: `SELECT player_name, SUM(goals) AS total_goals 
FROM appearances 
GROUP BY player_id, player_name 
HAVING total_goals > 50 
ORDER BY total_goals DESC;`,
        options: [
            'A) All players who scored in any game',
            'B) Players with more than 50 total career goals, sorted by goals',
            'C) The top 50 goal scorers',
            'D) Players who scored 50 goals in a single game'
        ],
        correctAnswer: 'B',
        explanation: 'HAVING filters grouped results. This shows only players with 50+ total goals.'
    },
    // --- TRANSFERS + SUM ---
    {
        id: 11,
        difficulty: 'medium',
        points: 25,
        category: 'Transfers',
        table: 'transfers',
        question: 'What does this query return?',
        query: `SELECT to_club_name, SUM(transfer_fee) AS total_spent 
FROM transfers 
WHERE transfer_fee IS NOT NULL 
GROUP BY to_club_name 
ORDER BY total_spent DESC 
LIMIT 5;`,
        options: [
            'A) The 5 clubs that sold players for the most money',
            'B) The 5 clubs that spent the most money on transfers',
            'C) The 5 most expensive individual transfers',
            'D) All clubs and their transfer budgets'
        ],
        correctAnswer: 'B',
        explanation: 'to_club_name is the buying club. SUM(transfer_fee) adds up all purchases.'
    },
    // --- GAMES + AVG ATTENDANCE ---
    {
        id: 12,
        difficulty: 'medium',
        points: 25,
        category: 'Games',
        table: 'games',
        question: 'What does this query return?',
        query: `SELECT stadium, ROUND(AVG(attendance), 0) AS avg_attendance 
FROM games 
WHERE attendance > 0 
GROUP BY stadium 
ORDER BY avg_attendance DESC 
LIMIT 10;`,
        options: [
            'A) The 10 games with highest attendance',
            'B) The 10 stadiums with the highest average attendance',
            'C) All stadiums and their total attendance',
            'D) The 10 largest stadiums by capacity'
        ],
        correctAnswer: 'B',
        explanation: 'AVG(attendance) per stadium finds stadiums with highest average crowd.'
    },
    // --- COMPETITIONS + COUNT ---
    {
        id: 13,
        difficulty: 'medium',
        points: 25,
        category: 'Competitions',
        table: 'competitions',
        question: 'What does this query return?',
        query: `SELECT confederation, COUNT(*) AS num_competitions 
FROM competitions 
GROUP BY confederation 
ORDER BY num_competitions DESC;`,
        options: [
            'A) All confederations and their competition count',
            'B) The biggest competition in each confederation',
            'C) Countries with the most competitions',
            'D) Total teams in each confederation'
        ],
        correctAnswer: 'A',
        explanation: 'This counts how many competitions belong to each confederation (UEFA, CONMEBOL, etc.).'
    },
    // --- GAME_EVENTS TABLE ---
    {
        id: 14,
        difficulty: 'medium',
        points: 25,
        category: 'Game Events',
        table: 'game_events',
        question: 'What does this query return?',
        query: `SELECT type, COUNT(*) AS event_count 
FROM game_events 
GROUP BY type 
ORDER BY event_count DESC;`,
        options: [
            'A) All events from a specific game',
            'B) Count of each event type (goals, cards, substitutions)',
            'C) Players with the most events',
            'D) Games with the most events'
        ],
        correctAnswer: 'B',
        explanation: 'This counts how many of each event type occurred across all games.'
    },

    // ========== HARD (50 points) ==========
    // --- SUBQUERY ---
    {
        id: 15,
        difficulty: 'hard',
        points: 50,
        category: 'Players',
        table: 'players',
        question: 'What does this query return?',
        query: `SELECT name, market_value_in_eur 
FROM players 
WHERE market_value_in_eur > (
    SELECT AVG(market_value_in_eur) 
    FROM players 
    WHERE market_value_in_eur > 0
)
ORDER BY market_value_in_eur DESC;`,
        options: [
            'A) The player with the highest market value',
            'B) All players worth more than the average player value',
            'C) The average market value of all players',
            'D) Players whose value increased above average'
        ],
        correctAnswer: 'B',
        explanation: 'The subquery calculates average value. Main query returns all players above that average.'
    },
    // --- COMPLEX AGGREGATION ---
    {
        id: 16,
        difficulty: 'hard',
        points: 50,
        category: 'Appearances',
        table: 'appearances',
        question: 'What does this query return?',
        query: `SELECT player_name,
       COUNT(*) AS appearances,
       SUM(goals) AS total_goals,
       ROUND(SUM(goals) / COUNT(*), 2) AS goals_per_game
FROM appearances 
GROUP BY player_id, player_name 
HAVING appearances >= 50 
ORDER BY goals_per_game DESC 
LIMIT 10;`,
        options: [
            'A) Top 10 players by total goals scored',
            'B) Top 10 players by goals-per-game ratio (min 50 appearances)',
            'C) Players with exactly 50 appearances',
            'D) The 10 players with most assists'
        ],
        correctAnswer: 'B',
        explanation: 'Calculates goals per game, filters for 50+ appearances, returns top 10 most clinical.'
    },
    // --- JOIN + AGGREGATION ---
    {
        id: 17,
        difficulty: 'hard',
        points: 50,
        category: 'Competitions & Games',
        table: 'competitions,games',
        question: 'What does this query return?',
        query: `SELECT c.name AS competition_name,
       COUNT(g.game_id) AS total_games,
       SUM(g.home_club_goals + g.away_club_goals) AS total_goals,
       ROUND(SUM(g.home_club_goals + g.away_club_goals) / COUNT(g.game_id), 2) AS goals_per_game
FROM competitions c
JOIN games g ON c.competition_id = g.competition_id
GROUP BY c.competition_id, c.name
ORDER BY goals_per_game DESC
LIMIT 5;`,
        options: [
            'A) The 5 competitions with the most games played',
            'B) The 5 competitions with the highest goals-per-game average',
            'C) Total goals scored in all competitions',
            'D) The 5 competitions with the most teams'
        ],
        correctAnswer: 'B',
        explanation: 'Joins competitions with games, calculates goals per game, returns highest scoring leagues.'
    },
    // --- TRANSFER ANALYSIS ---
    {
        id: 18,
        difficulty: 'hard',
        points: 50,
        category: 'Transfers',
        table: 'transfers',
        question: 'What does this query return?',
        query: `SELECT transfer_season,
       COUNT(*) AS num_transfers,
       SUM(transfer_fee) AS total_spent,
       MAX(transfer_fee) AS biggest_transfer
FROM transfers 
WHERE transfer_fee > 0 
GROUP BY transfer_season 
ORDER BY total_spent DESC;`,
        options: [
            'A) The most expensive transfer in history',
            'B) Transfer spending statistics broken down by season',
            'C) All transfers sorted by fee',
            'D) Clubs that spent the most per season'
        ],
        correctAnswer: 'B',
        explanation: 'GROUP BY season creates per-season stats with count, sum, and max of fees.'
    },
    // --- COMPLEX JOIN ---
    {
        id: 19,
        difficulty: 'hard',
        points: 50,
        category: 'Players & Clubs',
        table: 'players,clubs,competitions',
        question: 'What does this query return?',
        query: `SELECT p.name AS player_name,
       c.name AS club_name,
       comp.name AS league_name
FROM players p
JOIN clubs c ON p.current_club_id = c.club_id
JOIN competitions comp ON c.domestic_competition_id = comp.competition_id
WHERE p.market_value_in_eur > 50000000
ORDER BY p.market_value_in_eur DESC;`,
        options: [
            'A) All players, clubs, and leagues in the database',
            'B) Players worth over €50M with their club and league info',
            'C) The 50 most expensive players',
            'D) Clubs in the top 5 leagues'
        ],
        correctAnswer: 'B',
        explanation: 'Multiple JOINs connect players → clubs → competitions. Filters for high-value players.'
    },
    // --- CARD STATISTICS ---
    {
        id: 20,
        difficulty: 'hard',
        points: 50,
        category: 'Appearances',
        table: 'appearances',
        question: 'What does this query return?',
        query: `SELECT player_name,
       SUM(yellow_cards) AS total_yellows,
       SUM(red_cards) AS total_reds,
       SUM(yellow_cards) + SUM(red_cards) AS total_cards
FROM appearances 
GROUP BY player_id, player_name 
HAVING total_cards > 10 
ORDER BY total_cards DESC 
LIMIT 15;`,
        options: [
            'A) Players who received cards in a single game',
            'B) The 15 players with the most disciplinary cards (10+ total)',
            'C) Games with the most cards shown',
            'D) Referees who gave the most cards'
        ],
        correctAnswer: 'B',
        explanation: 'Aggregates cards per player, filters for 10+, returns top 15 "dirtiest" players.'
    },
    // --- HOME ADVANTAGE with CASE ---
    {
        id: 21,
        difficulty: 'hard',
        points: 50,
        category: 'Games',
        table: 'games',
        question: 'What does this query return?',
        query: `SELECT home_club_name,
       COUNT(*) AS home_games,
       SUM(CASE WHEN home_club_goals > away_club_goals THEN 1 ELSE 0 END) AS home_wins,
       ROUND(SUM(CASE WHEN home_club_goals > away_club_goals THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS win_pct
FROM games 
GROUP BY home_club_id, home_club_name 
HAVING home_games >= 20
ORDER BY win_pct DESC 
LIMIT 10;`,
        options: [
            'A) Teams with the most home games',
            'B) The 10 teams with the best home win percentage (min 20 games)',
            'C) Total wins for each team',
            'D) Teams that never lost at home'
        ],
        correctAnswer: 'B',
        explanation: 'CASE counts home wins, divided by total gives win %. HAVING filters for 20+ home games.'
    },
    // --- GAME EVENTS ---
    {
        id: 22,
        difficulty: 'hard',
        points: 50,
        category: 'Game Events',
        table: 'game_events',
        question: 'What does this query return?',
        query: `SELECT g.home_club_name, g.away_club_name, g.date,
       COUNT(ge.game_event_id) AS total_events
FROM games g
JOIN game_events ge ON g.game_id = ge.game_id
WHERE ge.type = 'Goals'
GROUP BY g.game_id, g.home_club_name, g.away_club_name, g.date
ORDER BY total_events DESC
LIMIT 10;`,
        options: [
            'A) All games with events',
            'B) The 10 games with the most goals scored',
            'C) Games without any goals',
            'D) The most common event types'
        ],
        correctAnswer: 'B',
        explanation: 'Joins games with goal events, counts goals per game, returns highest-scoring matches.'
    }
];

// ========================================
// ✍️ QUERY MODE - Write Your Own SQL
// ========================================
const queryChallenges = [
    // ========== BASIC (10 points) ==========
    {
        id: 101,
        difficulty: 'basic',
        points: 10,
        category: 'Players',
        table: 'players',
        title: 'Count All Players',
        description: 'Write a query to count the total number of players in the database.',
        hint: 'Use COUNT(*) to count all rows.',
        expectedQuery: `SELECT COUNT(*) AS total_players FROM players;`,
        validateFn: (results) => results.length === 1 && results[0].total_players !== undefined
    },
    {
        id: 102,
        difficulty: 'basic',
        points: 10,
        category: 'Clubs',
        table: 'clubs',
        title: 'List Premier League Clubs',
        description: 'Find all clubs that play in the English Premier League (domestic_competition_id = "GB1"). Show their name and stadium.',
        hint: 'Use WHERE to filter by domestic_competition_id.',
        expectedQuery: `SELECT name, stadium_name FROM clubs WHERE domestic_competition_id = 'GB1';`,
        validateFn: (results) => results.length > 0 && results[0].name !== undefined
    },
    {
        id: 103,
        difficulty: 'basic',
        points: 10,
        category: 'Games',
        table: 'games',
        title: 'High Scoring Games',
        description: 'Find all games where the total goals scored (home + away) was 7 or more. Show both team names and their goals.',
        hint: 'Use WHERE with home_club_goals + away_club_goals >= 7',
        expectedQuery: `SELECT home_club_name, away_club_name, home_club_goals, away_club_goals 
FROM games 
WHERE home_club_goals + away_club_goals >= 7;`,
        validateFn: (results) => results.every(r => (r.home_club_goals + r.away_club_goals) >= 7)
    },
    {
        id: 104,
        difficulty: 'basic',
        points: 10,
        category: 'Competitions',
        table: 'competitions',
        title: 'UEFA Competitions',
        description: 'List all competitions organized by UEFA. Show the competition name and country.',
        hint: 'Filter by confederation = "europa"',
        expectedQuery: `SELECT name, country_name FROM competitions WHERE confederation = 'europa';`,
        validateFn: (results) => results.length > 0
    },
    {
        id: 105,
        difficulty: 'basic',
        points: 10,
        category: 'Transfers',
        table: 'transfers',
        title: 'Top 10 Expensive Transfers',
        description: 'Find the 10 most expensive transfers ever. Show player name, clubs involved, and the fee.',
        hint: 'Use ORDER BY transfer_fee DESC LIMIT 10',
        expectedQuery: `SELECT player_name, from_club_name, to_club_name, transfer_fee 
FROM transfers 
ORDER BY transfer_fee DESC 
LIMIT 10;`,
        validateFn: (results) => results.length === 10
    },

    // ========== MEDIUM (25 points) ==========
    {
        id: 201,
        difficulty: 'medium',
        points: 25,
        category: 'Players',
        table: 'players',
        title: 'Players by Country',
        description: 'Count how many players are from each country. Show the top 10 countries with the most players.',
        hint: 'Use GROUP BY country_of_citizenship and ORDER BY the count.',
        expectedQuery: `SELECT country_of_citizenship, COUNT(*) AS player_count 
FROM players 
GROUP BY country_of_citizenship 
ORDER BY player_count DESC 
LIMIT 10;`,
        validateFn: (results) => results.length === 10 && results[0].player_count !== undefined
    },
    {
        id: 202,
        difficulty: 'medium',
        points: 25,
        category: 'Appearances',
        table: 'appearances',
        title: 'Top Goal Scorers',
        description: 'Find players with more than 50 career goals. Show their name and total goals, sorted by goals.',
        hint: 'Use GROUP BY, SUM(goals), and HAVING.',
        expectedQuery: `SELECT player_name, SUM(goals) AS total_goals 
FROM appearances 
GROUP BY player_id, player_name 
HAVING total_goals > 50 
ORDER BY total_goals DESC;`,
        validateFn: (results) => results.every(r => r.total_goals > 50)
    },
    {
        id: 203,
        difficulty: 'medium',
        points: 25,
        category: 'Clubs',
        table: 'clubs',
        title: 'Average Squad Size by League',
        description: 'Calculate the average squad size for each domestic competition. Order by average size descending.',
        hint: 'Use AVG(squad_size) with GROUP BY domestic_competition_id.',
        expectedQuery: `SELECT domestic_competition_id, ROUND(AVG(squad_size), 1) AS avg_squad_size 
FROM clubs 
GROUP BY domestic_competition_id 
ORDER BY avg_squad_size DESC;`,
        validateFn: (results) => results.length > 0 && results[0].avg_squad_size !== undefined
    },
    {
        id: 204,
        difficulty: 'medium',
        points: 25,
        category: 'Games',
        table: 'games',
        title: 'Highest Attendance Stadiums',
        description: 'Find the 10 stadiums with the highest average attendance. Only include stadiums with attendance > 0.',
        hint: 'Use AVG(attendance), GROUP BY stadium, filter with WHERE.',
        expectedQuery: `SELECT stadium, ROUND(AVG(attendance), 0) AS avg_attendance 
FROM games 
WHERE attendance > 0 
GROUP BY stadium 
ORDER BY avg_attendance DESC 
LIMIT 10;`,
        validateFn: (results) => results.length === 10
    },
    {
        id: 205,
        difficulty: 'medium',
        points: 25,
        category: 'Transfers',
        table: 'transfers',
        title: 'Big Spending Clubs',
        description: 'Find clubs that spent more than €100 million total on incoming transfers.',
        hint: 'Group by to_club_name and use HAVING with SUM(transfer_fee).',
        expectedQuery: `SELECT to_club_name, SUM(transfer_fee) AS total_spent 
FROM transfers 
WHERE transfer_fee > 0 
GROUP BY to_club_name 
HAVING total_spent > 100000000 
ORDER BY total_spent DESC;`,
        validateFn: (results) => results.every(r => r.total_spent > 100000000)
    },
    {
        id: 206,
        difficulty: 'medium',
        points: 25,
        category: 'Game Events',
        table: 'game_events',
        title: 'Event Type Distribution',
        description: 'Count how many times each event type occurred. Show type and count, ordered by count.',
        hint: 'GROUP BY type and use COUNT(*).',
        expectedQuery: `SELECT type, COUNT(*) AS event_count 
FROM game_events 
GROUP BY type 
ORDER BY event_count DESC;`,
        validateFn: (results) => results.length > 0 && results[0].event_count !== undefined
    },

    // ========== HARD (50 points) ==========
    {
        id: 301,
        difficulty: 'hard',
        points: 50,
        category: 'Players',
        table: 'players',
        title: 'Above Average Value',
        description: 'Find all players whose market value is above the average market value. Show name and value, sorted by value.',
        hint: 'Use a subquery to calculate the average, then filter in the main query.',
        expectedQuery: `SELECT name, market_value_in_eur 
FROM players 
WHERE market_value_in_eur > (SELECT AVG(market_value_in_eur) FROM players WHERE market_value_in_eur > 0)
ORDER BY market_value_in_eur DESC;`,
        validateFn: (results) => results.length > 0
    },
    {
        id: 302,
        difficulty: 'hard',
        points: 50,
        category: 'Appearances',
        table: 'appearances',
        title: 'Goals Per Game Leaders',
        description: 'Find the top 10 players by goals-per-game ratio. Only include players with at least 50 appearances.',
        hint: 'Calculate SUM(goals)/COUNT(*), use HAVING for minimum appearances.',
        expectedQuery: `SELECT player_name, COUNT(*) AS appearances, SUM(goals) AS total_goals,
       ROUND(SUM(goals) / COUNT(*), 2) AS goals_per_game
FROM appearances 
GROUP BY player_id, player_name 
HAVING appearances >= 50 
ORDER BY goals_per_game DESC 
LIMIT 10;`,
        validateFn: (results) => results.length === 10 && results.every(r => r.appearances >= 50)
    },
    {
        id: 303,
        difficulty: 'hard',
        points: 50,
        category: 'Competitions & Games',
        table: 'competitions,games',
        title: 'Highest Scoring Leagues',
        description: 'Find the 5 competitions with the highest average goals per game. Show competition name and goals per game.',
        hint: 'JOIN competitions and games, calculate (home_goals + away_goals) / COUNT(games).',
        expectedQuery: `SELECT c.name, 
       ROUND(SUM(g.home_club_goals + g.away_club_goals) / COUNT(g.game_id), 2) AS goals_per_game
FROM competitions c
JOIN games g ON c.competition_id = g.competition_id
GROUP BY c.competition_id, c.name
ORDER BY goals_per_game DESC
LIMIT 5;`,
        validateFn: (results) => results.length === 5
    },
    {
        id: 304,
        difficulty: 'hard',
        points: 50,
        category: 'Players & Clubs',
        table: 'players,clubs',
        title: 'Club Value Analysis',
        description: 'Find the 10 clubs with the highest total player market value. Show club name and total value.',
        hint: 'JOIN players and clubs, SUM the market values, GROUP BY club.',
        expectedQuery: `SELECT c.name, SUM(p.market_value_in_eur) AS total_value
FROM clubs c
JOIN players p ON c.club_id = p.current_club_id
WHERE p.market_value_in_eur > 0
GROUP BY c.club_id, c.name
ORDER BY total_value DESC
LIMIT 10;`,
        validateFn: (results) => results.length === 10
    },
    {
        id: 305,
        difficulty: 'hard',
        points: 50,
        category: 'Games',
        table: 'games',
        title: 'Home Advantage Analysis',
        description: 'Calculate home win percentage for teams with at least 20 home games. Show team name, games, wins, and win %.',
        hint: 'Use CASE WHEN to count wins, calculate percentage, use HAVING.',
        expectedQuery: `SELECT home_club_name,
       COUNT(*) AS home_games,
       SUM(CASE WHEN home_club_goals > away_club_goals THEN 1 ELSE 0 END) AS home_wins,
       ROUND(SUM(CASE WHEN home_club_goals > away_club_goals THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS win_pct
FROM games 
GROUP BY home_club_id, home_club_name 
HAVING home_games >= 20
ORDER BY win_pct DESC;`,
        validateFn: (results) => results.every(r => r.home_games >= 20)
    },
    {
        id: 306,
        difficulty: 'hard',
        points: 50,
        category: 'Transfers',
        table: 'transfers',
        title: 'Transfer Season Analysis',
        description: 'Analyze transfer spending by season. Show season, number of transfers, total spent, and largest single transfer.',
        hint: 'GROUP BY transfer_season, use COUNT, SUM, and MAX.',
        expectedQuery: `SELECT transfer_season, 
       COUNT(*) AS num_transfers,
       SUM(transfer_fee) AS total_spent,
       MAX(transfer_fee) AS biggest_transfer
FROM transfers 
WHERE transfer_fee > 0 
GROUP BY transfer_season 
ORDER BY total_spent DESC;`,
        validateFn: (results) => results.length > 0
    }
];

module.exports = { quizChallenges, queryChallenges };
