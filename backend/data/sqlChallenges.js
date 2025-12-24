// ============================================================
// SQL CHALLENGES - Football IQ
// ============================================================
// Two game modes:
// 1. QUIZ MODE (Multiple Choice) - Football questions + SQL query shown
// 2. QUERY MODE (Write SQL) - User writes the actual query
// ============================================================
// Tables covered: players, clubs, games, appearances, 
//                 competitions, transfers, game_events
// ============================================================

// ========================================
// 🎯 QUIZ MODE - Multiple Choice Questions
// ========================================
// Format: Football question + query shown, user picks answer
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
        question: 'How many players are registered in the database?',
        query: `SELECT COUNT(*) AS total_players FROM players;`,
        options: [
            'A) Around 10,000',
            'B) Around 25,000',
            'C) Around 50,000',
            'D) Around 100,000'
        ],
        correctAnswer: 'B',
        explanation: 'The players table contains approximately 25,000 professional football players from top leagues.'
    },
    {
        id: 2,
        difficulty: 'basic',
        points: 10,
        category: 'Players',
        table: 'players',
        question: 'How many left-footed players are in the database?',
        query: `SELECT COUNT(*) AS left_footed 
FROM players 
WHERE foot = 'Left';`,
        options: [
            'A) Less than 1,000',
            'B) Between 1,000 and 3,000',
            'C) Between 3,000 and 6,000',
            'D) More than 6,000'
        ],
        correctAnswer: 'C',
        explanation: 'Approximately 20-25% of players are left-footed, which is around 4,000-5,000 players.'
    },
    
    // --- CLUBS TABLE ---
    {
        id: 3,
        difficulty: 'basic',
        points: 10,
        category: 'Clubs',
        table: 'clubs',
        question: 'How many clubs have a squad size larger than 30 players?',
        query: `SELECT COUNT(*) AS big_squads 
FROM clubs 
WHERE squad_size > 30;`,
        options: [
            'A) Less than 50',
            'B) Between 50 and 150',
            'C) Between 150 and 300',
            'D) More than 300'
        ],
        correctAnswer: 'C',
        explanation: 'Many top clubs maintain large squads for depth, with over 200 clubs having 30+ players.'
    },
    
    // --- COMPETITIONS TABLE ---
    {
        id: 4,
        difficulty: 'basic',
        points: 10,
        category: 'Competitions',
        table: 'competitions',
        question: 'How many domestic leagues are registered in the system?',
        query: `SELECT COUNT(*) AS domestic_leagues 
FROM competitions 
WHERE type = 'domestic_league';`,
        options: [
            'A) 10-20 leagues',
            'B) 20-40 leagues',
            'C) 40-60 leagues',
            'D) More than 60 leagues'
        ],
        correctAnswer: 'B',
        explanation: 'The database includes top domestic leagues from Europe, Americas, and Asia.'
    },
    
    // --- GAMES TABLE ---
    {
        id: 5,
        difficulty: 'basic',
        points: 10,
        category: 'Games',
        table: 'games',
        question: 'How many matches ended with the home team scoring more than 5 goals?',
        query: `SELECT COUNT(*) AS high_scoring_home 
FROM games 
WHERE home_club_goals > 5;`,
        options: [
            'A) Less than 100',
            'B) Between 100 and 500',
            'C) Between 500 and 1,500',
            'D) More than 1,500'
        ],
        correctAnswer: 'C',
        explanation: 'High-scoring home wins (6+ goals) are relatively rare but do occur in several hundred matches.'
    },
    
    // --- TRANSFERS TABLE ---
    {
        id: 6,
        difficulty: 'basic',
        points: 10,
        category: 'Transfers',
        table: 'transfers',
        question: 'What was the highest transfer fee ever paid for a single player (in EUR)?',
        query: `SELECT player_name, transfer_fee 
FROM transfers 
ORDER BY transfer_fee DESC 
LIMIT 1;`,
        options: [
            'A) Around €100 million',
            'B) Around €150 million',
            'C) Around €200 million',
            'D) Around €250 million'
        ],
        correctAnswer: 'C',
        explanation: 'The record transfer fee is around €200-220 million (Neymar to PSG in 2017).'
    },
    
    // --- APPEARANCES TABLE ---
    {
        id: 7,
        difficulty: 'basic',
        points: 10,
        category: 'Appearances',
        table: 'appearances',
        question: 'How many hat-tricks (3+ goals in a match) have been scored?',
        query: `SELECT COUNT(*) AS hat_tricks 
FROM appearances 
WHERE goals >= 3;`,
        options: [
            'A) Less than 500',
            'B) Between 500 and 1,500',
            'C) Between 1,500 and 3,000',
            'D) More than 3,000'
        ],
        correctAnswer: 'C',
        explanation: 'Hat-tricks are special achievements, with around 2,000 recorded across all competitions.'
    },

    // ========== MEDIUM (25 points) ==========
    
    // --- PLAYERS + GROUP BY ---
    {
        id: 8,
        difficulty: 'medium',
        points: 25,
        category: 'Players',
        table: 'players',
        question: 'Which country has the most players in the database?',
        query: `SELECT country_of_citizenship, COUNT(*) AS player_count 
FROM players 
GROUP BY country_of_citizenship 
ORDER BY player_count DESC 
LIMIT 1;`,
        options: [
            'A) Brazil',
            'B) England',
            'C) Spain',
            'D) Germany'
        ],
        correctAnswer: 'B',
        explanation: 'England has the most registered players due to the extensive English football pyramid.'
    },
    
    // --- CLUBS + AVG ---
    {
        id: 9,
        difficulty: 'medium',
        points: 25,
        category: 'Clubs',
        table: 'clubs',
        question: 'What is the average squad size across all clubs in the Premier League (GB1)?',
        query: `SELECT ROUND(AVG(squad_size), 1) AS avg_squad 
FROM clubs 
WHERE domestic_competition_id = 'GB1';`,
        options: [
            'A) Around 22-24 players',
            'B) Around 25-27 players',
            'C) Around 28-30 players',
            'D) Around 31-33 players'
        ],
        correctAnswer: 'B',
        explanation: 'Premier League clubs typically maintain squads of 25-27 players for squad registration rules.'
    },
    
    // --- APPEARANCES + HAVING ---
    {
        id: 10,
        difficulty: 'medium',
        points: 25,
        category: 'Appearances',
        table: 'appearances',
        question: 'How many players have scored more than 100 career goals (in the database)?',
        query: `SELECT COUNT(*) FROM (
    SELECT player_id, SUM(goals) AS total_goals 
    FROM appearances 
    GROUP BY player_id 
    HAVING total_goals > 100
) AS centurions;`,
        options: [
            'A) Less than 20',
            'B) Between 20 and 50',
            'C) Between 50 and 100',
            'D) More than 100'
        ],
        correctAnswer: 'C',
        explanation: 'Around 70-80 players have achieved over 100 goals across their careers in top leagues.'
    },
    
    // --- TRANSFERS + SUM ---
    {
        id: 11,
        difficulty: 'medium',
        points: 25,
        category: 'Transfers',
        table: 'transfers',
        question: 'Which club has spent the most money on incoming transfers (total)?',
        query: `SELECT to_club_name, SUM(transfer_fee) AS total_spent 
FROM transfers 
WHERE transfer_fee IS NOT NULL 
GROUP BY to_club_name 
ORDER BY total_spent DESC 
LIMIT 1;`,
        options: [
            'A) Manchester City',
            'B) Paris Saint-Germain',
            'C) Chelsea',
            'D) Real Madrid'
        ],
        correctAnswer: 'A',
        explanation: 'Manchester City has the highest total transfer spending in football history.'
    },
    
    // --- GAMES + AVG ATTENDANCE ---
    {
        id: 12,
        difficulty: 'medium',
        points: 25,
        category: 'Games',
        table: 'games',
        question: 'Which stadium has the highest average attendance?',
        query: `SELECT stadium, ROUND(AVG(attendance), 0) AS avg_attendance 
FROM games 
WHERE attendance > 0 
GROUP BY stadium 
ORDER BY avg_attendance DESC 
LIMIT 1;`,
        options: [
            'A) Camp Nou (Barcelona)',
            'B) Signal Iduna Park (Dortmund)',
            'C) Old Trafford (Man United)',
            'D) Santiago Bernabéu (Real Madrid)'
        ],
        correctAnswer: 'B',
        explanation: 'Borussia Dortmund\'s Signal Iduna Park consistently has the highest average attendance in European football.'
    },
    
    // --- COMPETITIONS + COUNT ---
    {
        id: 13,
        difficulty: 'medium',
        points: 25,
        category: 'Competitions',
        table: 'competitions',
        question: 'Which confederation (UEFA, CONMEBOL, etc.) has the most registered competitions?',
        query: `SELECT confederation, COUNT(*) AS num_competitions 
FROM competitions 
GROUP BY confederation 
ORDER BY num_competitions DESC 
LIMIT 1;`,
        options: [
            'A) UEFA (Europe)',
            'B) CONMEBOL (South America)',
            'C) CONCACAF (North America)',
            'D) AFC (Asia)'
        ],
        correctAnswer: 'A',
        explanation: 'UEFA has the most competitions due to numerous domestic leagues and cups across European countries.'
    },
    
    // --- GAME_EVENTS TABLE ---
    {
        id: 14,
        difficulty: 'medium',
        points: 25,
        category: 'Game Events',
        table: 'game_events',
        question: 'What type of event occurs most frequently in matches?',
        query: `SELECT type, COUNT(*) AS event_count 
FROM game_events 
GROUP BY type 
ORDER BY event_count DESC 
LIMIT 1;`,
        options: [
            'A) Goals',
            'B) Substitutions',
            'C) Yellow Cards',
            'D) Red Cards'
        ],
        correctAnswer: 'B',
        explanation: 'Substitutions are the most common event with 3-5 per team per match (6-10 per game).'
    },

    // ========== HARD (50 points) ==========
    
    // --- SUBQUERY - Player Values ---
    {
        id: 15,
        difficulty: 'hard',
        points: 50,
        category: 'Players',
        table: 'players',
        question: 'What percentage of players have a market value above the average?',
        query: `SELECT 
    ROUND(
        COUNT(CASE WHEN market_value_in_eur > (
            SELECT AVG(market_value_in_eur) FROM players WHERE market_value_in_eur > 0
        ) THEN 1 END) * 100.0 / COUNT(*), 1
    ) AS pct_above_avg
FROM players 
WHERE market_value_in_eur > 0;`,
        options: [
            'A) Around 15-20%',
            'B) Around 25-35%',
            'C) Around 40-50%',
            'D) Around 55-65%'
        ],
        correctAnswer: 'B',
        explanation: 'Due to skewed distribution (few superstars), only about 30% of players are above average value.'
    },
    
    // --- COMPLEX AGGREGATION - Goals Per Game ---
    {
        id: 16,
        difficulty: 'hard',
        points: 50,
        category: 'Appearances',
        table: 'appearances',
        question: 'Among players with 50+ appearances, who has the best goals-per-game ratio?',
        query: `SELECT player_name,
       COUNT(*) AS appearances,
       SUM(goals) AS total_goals,
       ROUND(SUM(goals) * 1.0 / COUNT(*), 2) AS goals_per_game
FROM appearances 
GROUP BY player_id, player_name 
HAVING COUNT(*) >= 50 
ORDER BY goals_per_game DESC 
LIMIT 1;`,
        options: [
            'A) Lionel Messi',
            'B) Robert Lewandowski',
            'C) Cristiano Ronaldo',
            'D) Erling Haaland'
        ],
        correctAnswer: 'D',
        explanation: 'Erling Haaland has the best goals-per-game ratio among active players with 50+ appearances.'
    },
    
    // --- JOIN + AGGREGATION - League Goals ---
    {
        id: 17,
        difficulty: 'hard',
        points: 50,
        category: 'Competitions & Games',
        table: 'competitions,games',
        question: 'Which league has the highest average goals per game?',
        query: `SELECT c.name AS competition_name,
       ROUND(AVG(g.home_club_goals + g.away_club_goals), 2) AS avg_goals_per_game
FROM competitions c
JOIN games g ON c.competition_id = g.competition_id
GROUP BY c.competition_id, c.name
HAVING COUNT(g.game_id) > 100
ORDER BY avg_goals_per_game DESC
LIMIT 1;`,
        options: [
            'A) Bundesliga (Germany)',
            'B) Premier League (England)',
            'C) La Liga (Spain)',
            'D) Eredivisie (Netherlands)'
        ],
        correctAnswer: 'A',
        explanation: 'The Bundesliga consistently has the highest goals-per-game average among top 5 leagues.'
    },
    
    // --- TRANSFER ANALYSIS - Busiest Season ---
    {
        id: 18,
        difficulty: 'hard',
        points: 50,
        category: 'Transfers',
        table: 'transfers',
        question: 'Which transfer season had the highest total spending worldwide?',
        query: `SELECT transfer_season,
       COUNT(*) AS num_transfers,
       SUM(transfer_fee) AS total_spent
FROM transfers 
WHERE transfer_fee > 0 
GROUP BY transfer_season 
ORDER BY total_spent DESC
LIMIT 1;`,
        options: [
            'A) Summer 2017',
            'B) Summer 2019',
            'C) Summer 2021',
            'D) Summer 2023'
        ],
        correctAnswer: 'B',
        explanation: 'The 2019 summer window saw record-breaking spending before the COVID-19 pandemic.'
    },
    
    // --- COMPLEX JOIN - Most Valuable Squad ---
    {
        id: 19,
        difficulty: 'hard',
        points: 50,
        category: 'Players & Clubs',
        table: 'players,clubs',
        question: 'Which club has the highest total squad market value?',
        query: `SELECT c.name AS club_name,
       SUM(p.market_value_in_eur) AS total_squad_value
FROM clubs c
JOIN players p ON c.club_id = p.current_club_id
WHERE p.market_value_in_eur > 0
GROUP BY c.club_id, c.name
ORDER BY total_squad_value DESC
LIMIT 1;`,
        options: [
            'A) Manchester City',
            'B) Real Madrid',
            'C) Paris Saint-Germain',
            'D) Chelsea'
        ],
        correctAnswer: 'A',
        explanation: 'Manchester City has the most valuable squad with combined value exceeding €1 billion.'
    },
    
    // --- CARD STATISTICS ---
    {
        id: 20,
        difficulty: 'hard',
        points: 50,
        category: 'Appearances',
        table: 'appearances',
        question: 'Which player has received the most total cards (yellow + red) in the database?',
        query: `SELECT player_name,
       SUM(yellow_cards) AS total_yellows,
       SUM(red_cards) AS total_reds,
       SUM(yellow_cards) + SUM(red_cards) AS total_cards
FROM appearances 
GROUP BY player_id, player_name 
ORDER BY total_cards DESC 
LIMIT 1;`,
        options: [
            'A) Sergio Ramos',
            'B) Pepe',
            'C) Diego Costa',
            'D) Nigel de Jong'
        ],
        correctAnswer: 'A',
        explanation: 'Sergio Ramos holds the record for most cards received in top European competitions.'
    },
    
    // --- HOME ADVANTAGE with CASE ---
    {
        id: 21,
        difficulty: 'hard',
        points: 50,
        category: 'Games',
        table: 'games',
        question: 'What is the overall home win percentage across all matches?',
        query: `SELECT 
    ROUND(
        SUM(CASE WHEN home_club_goals > away_club_goals THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
        1
    ) AS home_win_pct
FROM games;`,
        options: [
            'A) Around 35-40%',
            'B) Around 42-47%',
            'C) Around 48-53%',
            'D) Around 55-60%'
        ],
        correctAnswer: 'B',
        explanation: 'Home teams win approximately 45% of matches, with about 25% draws and 30% away wins.'
    },
    
    // --- HIGHEST SCORING MATCH ---
    {
        id: 22,
        difficulty: 'hard',
        points: 50,
        category: 'Games',
        table: 'games',
        question: 'What was the highest combined score in a single match?',
        query: `SELECT home_club_name, away_club_name,
       home_club_goals, away_club_goals,
       (home_club_goals + away_club_goals) AS total_goals
FROM games
ORDER BY total_goals DESC
LIMIT 1;`,
        options: [
            'A) 9 goals (like 7-2)',
            'B) 10-11 goals',
            'C) 12-13 goals',
            'D) 14+ goals'
        ],
        correctAnswer: 'C',
        explanation: 'Some matches have ended with 12-13 combined goals, often in cup competitions.'
    },

    // --- PLAYERS BY AGE GROUP ---
    {
        id: 23,
        difficulty: 'medium',
        points: 25,
        category: 'Players',
        table: 'players',
        question: 'What percentage of players are under 25 years old?',
        query: `SELECT 
    ROUND(
        COUNT(CASE WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 25 THEN 1 END) * 100.0 / COUNT(*), 
        1
    ) AS pct_under_25
FROM players
WHERE date_of_birth IS NOT NULL;`,
        options: [
            'A) Around 20-30%',
            'B) Around 35-45%',
            'C) Around 50-60%',
            'D) Around 65-75%'
        ],
        correctAnswer: 'B',
        explanation: 'About 40% of professional players are under 25, with peak age being 24-29.'
    },

    // --- BIGGEST TRANSFER PROFIT ---
    {
        id: 24,
        difficulty: 'hard',
        points: 50,
        category: 'Transfers',
        table: 'transfers',
        question: 'Which club has made the most money from selling players (total)?',
        query: `SELECT from_club_name, SUM(transfer_fee) AS total_received 
FROM transfers 
WHERE transfer_fee IS NOT NULL AND transfer_fee > 0
GROUP BY from_club_name 
ORDER BY total_received DESC 
LIMIT 1;`,
        options: [
            'A) Benfica',
            'B) Monaco',
            'C) Ajax',
            'D) Sporting CP'
        ],
        correctAnswer: 'A',
        explanation: 'Benfica has made the most money from player sales due to their excellent youth development.'
    },

    // --- ASSISTS LEADERS ---
    {
        id: 25,
        difficulty: 'medium',
        points: 25,
        category: 'Appearances',
        table: 'appearances',
        question: 'Who has the most career assists in the database?',
        query: `SELECT player_name, SUM(assists) AS total_assists 
FROM appearances 
GROUP BY player_id, player_name 
ORDER BY total_assists DESC 
LIMIT 1;`,
        options: [
            'A) Kevin De Bruyne',
            'B) Lionel Messi',
            'C) Thomas Müller',
            'D) Angel Di Maria'
        ],
        correctAnswer: 'C',
        explanation: 'Thomas Müller is known as the "assist king" with the most assists in Bundesliga history.'
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
