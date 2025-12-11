// SQL Challenge Questions based on the Football Database
// Each question tests aggregation skills (GROUP BY, HAVING, COUNT, SUM, AVG, JOINs)

const sqlChallenges = [
    // Level 1: Basic GROUP BY
    {
        id: 1,
        difficulty: 'easy',
        category: 'GROUP BY Basics',
        title: 'Count Players by Country',
        description: 'Write a query to count how many players are from each country. Show the country and the count, ordered by count descending. Limit to top 10 countries.',
        hint: 'Use GROUP BY with COUNT() and ORDER BY',
        expectedQuery: `SELECT country_of_citizenship, COUNT(*) as player_count 
FROM players 
WHERE country_of_citizenship IS NOT NULL
GROUP BY country_of_citizenship 
ORDER BY player_count DESC 
LIMIT 10`,
        validateFn: (result) => {
            return result.length === 10 && 
                   result[0].hasOwnProperty('country_of_citizenship') &&
                   result[0].hasOwnProperty('player_count');
        },
        points: 10,
        schema: `Table: players
- player_id, name, country_of_citizenship, position, current_club_id, market_value_in_eur`
    },
    {
        id: 2,
        difficulty: 'easy',
        category: 'GROUP BY Basics',
        title: 'Count Players by Position',
        description: 'Count how many players play in each position (Attack, Midfield, Defender, Goalkeeper). Order by count descending.',
        hint: 'Use GROUP BY on the position column',
        expectedQuery: `SELECT position, COUNT(*) as player_count 
FROM players 
WHERE position IS NOT NULL
GROUP BY position 
ORDER BY player_count DESC`,
        validateFn: (result) => {
            return result.length >= 1 && 
                   result[0].hasOwnProperty('position') &&
                   result[0].hasOwnProperty('player_count');
        },
        points: 10,
        schema: `Table: players
- player_id, name, position, sub_position, foot, height_in_cm`
    },
    {
        id: 3,
        difficulty: 'easy',
        category: 'Aggregate Functions',
        title: 'Average Goals per Game',
        description: 'Calculate the average number of goals scored by home teams across all games.',
        hint: 'Use AVG() function on home_club_goals',
        expectedQuery: `SELECT ROUND(AVG(home_club_goals), 2) as avg_home_goals 
FROM games 
WHERE home_club_goals IS NOT NULL`,
        validateFn: (result) => {
            return result.length === 1 && 
                   result[0].hasOwnProperty('avg_home_goals') &&
                   typeof result[0].avg_home_goals === 'number';
        },
        points: 10,
        schema: `Table: games
- game_id, home_club_id, away_club_id, home_club_goals, away_club_goals, attendance, season`
    },

    // Level 2: GROUP BY with HAVING
    {
        id: 4,
        difficulty: 'medium',
        category: 'HAVING Clause',
        title: 'High-Scoring Countries',
        description: 'Find countries that have more than 100 players in the database. Show country name and count.',
        hint: 'Use HAVING to filter grouped results',
        expectedQuery: `SELECT country_of_citizenship, COUNT(*) as player_count 
FROM players 
WHERE country_of_citizenship IS NOT NULL
GROUP BY country_of_citizenship 
HAVING COUNT(*) > 100
ORDER BY player_count DESC`,
        validateFn: (result) => {
            return result.every(r => r.player_count > 100);
        },
        points: 15,
        schema: `Table: players
- player_id, name, country_of_citizenship, position, market_value_in_eur`
    },
    {
        id: 5,
        difficulty: 'medium',
        category: 'HAVING Clause',
        title: 'Prolific Scorers',
        description: 'Find players who have scored more than 10 goals total (across all appearances). Show player name and total goals.',
        hint: 'SUM the goals and use HAVING to filter',
        expectedQuery: `SELECT player_name, SUM(goals) as total_goals 
FROM appearances 
WHERE goals IS NOT NULL
GROUP BY player_id, player_name 
HAVING SUM(goals) > 10
ORDER BY total_goals DESC`,
        validateFn: (result) => {
            return result.every(r => r.total_goals > 10) &&
                   result[0].hasOwnProperty('player_name');
        },
        points: 15,
        schema: `Table: appearances
- appearance_id, game_id, player_id, player_name, goals, assists, yellow_cards, red_cards, minutes_played`
    },
    {
        id: 6,
        difficulty: 'medium',
        category: 'Multiple Aggregates',
        title: 'Goals and Assists Leaders',
        description: 'For each player with at least 5 goals, show their name, total goals, total assists, and total goal contributions (goals + assists). Order by contributions.',
        hint: 'Use multiple SUM() functions and arithmetic',
        expectedQuery: `SELECT player_name, 
       SUM(goals) as total_goals, 
       SUM(assists) as total_assists,
       SUM(goals) + SUM(assists) as contributions
FROM appearances 
GROUP BY player_id, player_name 
HAVING SUM(goals) >= 5
ORDER BY contributions DESC
LIMIT 20`,
        validateFn: (result) => {
            return result[0].hasOwnProperty('contributions') &&
                   result.every(r => r.total_goals >= 5);
        },
        points: 15,
        schema: `Table: appearances
- appearance_id, player_id, player_name, goals, assists, minutes_played`
    },

    // Level 3: JOINs with GROUP BY
    {
        id: 7,
        difficulty: 'hard',
        category: 'JOIN with GROUP BY',
        title: 'Goals per Competition',
        description: 'Find total goals scored in each competition. Join games with competitions to show competition name and total goals (home + away).',
        hint: 'JOIN games with competitions, then SUM both home and away goals',
        expectedQuery: `SELECT c.name as competition_name, 
       SUM(g.home_club_goals + g.away_club_goals) as total_goals
FROM games g
JOIN competitions c ON g.competition_id = c.competition_id
WHERE g.home_club_goals IS NOT NULL AND g.away_club_goals IS NOT NULL
GROUP BY c.competition_id, c.name
ORDER BY total_goals DESC
LIMIT 10`,
        validateFn: (result) => {
            return result[0].hasOwnProperty('competition_name') &&
                   result[0].hasOwnProperty('total_goals');
        },
        points: 20,
        schema: `Tables: games, competitions
games: game_id, competition_id, home_club_goals, away_club_goals
competitions: competition_id, name, type, country_name`
    },
    {
        id: 8,
        difficulty: 'hard',
        category: 'JOIN with GROUP BY',
        title: 'Club Squad Value',
        description: 'Calculate the total market value of players for each club. Show club name and total value. Only include clubs with total value over 100 million.',
        hint: 'JOIN players with clubs and use HAVING',
        expectedQuery: `SELECT c.name as club_name, 
       SUM(p.market_value_in_eur) as total_value
FROM players p
JOIN clubs c ON p.current_club_id = c.club_id
WHERE p.market_value_in_eur IS NOT NULL
GROUP BY c.club_id, c.name
HAVING SUM(p.market_value_in_eur) > 100000000
ORDER BY total_value DESC`,
        validateFn: (result) => {
            return result[0].hasOwnProperty('club_name') &&
                   result.every(r => r.total_value > 100000000);
        },
        points: 20,
        schema: `Tables: players, clubs
players: player_id, name, current_club_id, market_value_in_eur
clubs: club_id, name, domestic_competition_id`
    },
    {
        id: 9,
        difficulty: 'hard',
        category: 'JOIN with Aggregates',
        title: 'Average Attendance by Country',
        description: 'Calculate the average game attendance for each country (based on competition). Show country name and average attendance, only for averages over 20,000.',
        hint: 'Join games → competitions, GROUP BY country_name',
        expectedQuery: `SELECT c.country_name, 
       ROUND(AVG(g.attendance), 0) as avg_attendance
FROM games g
JOIN competitions c ON g.competition_id = c.competition_id
WHERE g.attendance IS NOT NULL AND g.attendance > 0
GROUP BY c.country_name
HAVING AVG(g.attendance) > 20000
ORDER BY avg_attendance DESC`,
        validateFn: (result) => {
            return result[0].hasOwnProperty('country_name') &&
                   result.every(r => r.avg_attendance > 20000);
        },
        points: 20,
        schema: `Tables: games, competitions
games: game_id, competition_id, attendance, date
competitions: competition_id, name, country_name`
    },

    // Level 4: Complex Aggregations
    {
        id: 10,
        difficulty: 'expert',
        category: 'Complex Aggregation',
        title: 'Top Transfer Spenders',
        description: 'Find the clubs that have spent the most on incoming transfers. Show club name and total spent, for clubs that spent over 50 million. Order by amount spent.',
        hint: 'Use transfers table, group by to_club_name, sum transfer_fee',
        expectedQuery: `SELECT to_club_name as club_name, 
       SUM(transfer_fee) as total_spent
FROM transfers
WHERE transfer_fee IS NOT NULL AND transfer_fee > 0
GROUP BY to_club_id, to_club_name
HAVING SUM(transfer_fee) > 50000000
ORDER BY total_spent DESC
LIMIT 15`,
        validateFn: (result) => {
            return result[0].hasOwnProperty('club_name') &&
                   result[0].hasOwnProperty('total_spent') &&
                   result.every(r => r.total_spent > 50000000);
        },
        points: 25,
        schema: `Table: transfers
- player_id, transfer_date, from_club_id, to_club_id, from_club_name, to_club_name, transfer_fee, player_name`
    },
    {
        id: 11,
        difficulty: 'expert',
        category: 'Complex Aggregation',
        title: 'Card-Heavy Competitions',
        description: 'Find competitions where the average yellow cards per game (across all appearances) is greater than 2. Show competition name and average cards.',
        hint: 'Join appearances with competitions via competition_id',
        expectedQuery: `SELECT c.name as competition_name,
       ROUND(AVG(a.yellow_cards), 2) as avg_yellow_cards
FROM appearances a
JOIN competitions c ON a.competition_id = c.competition_id
WHERE a.yellow_cards IS NOT NULL
GROUP BY c.competition_id, c.name
HAVING AVG(a.yellow_cards) > 0.2
ORDER BY avg_yellow_cards DESC
LIMIT 10`,
        validateFn: (result) => {
            return result[0].hasOwnProperty('competition_name') &&
                   result[0].hasOwnProperty('avg_yellow_cards');
        },
        points: 25,
        schema: `Tables: appearances, competitions
appearances: appearance_id, competition_id, yellow_cards, red_cards
competitions: competition_id, name, country_name`
    },
    {
        id: 12,
        difficulty: 'expert',
        category: 'Subquery with GROUP BY',
        title: 'Above Average Market Value',
        description: 'Find all players whose market value is above the average market value of all players. Show name, market value, and position. Order by value descending, limit 20.',
        hint: 'Use a subquery to calculate the average first',
        expectedQuery: `SELECT name, market_value_in_eur, position
FROM players
WHERE market_value_in_eur > (
    SELECT AVG(market_value_in_eur) 
    FROM players 
    WHERE market_value_in_eur IS NOT NULL
)
ORDER BY market_value_in_eur DESC
LIMIT 20`,
        validateFn: (result) => {
            return result.length === 20 &&
                   result[0].hasOwnProperty('name') &&
                   result[0].hasOwnProperty('market_value_in_eur');
        },
        points: 25,
        schema: `Table: players
- player_id, name, position, market_value_in_eur, country_of_citizenship`
    },
    {
        id: 13,
        difficulty: 'expert',
        category: 'Multiple JOINs',
        title: 'Player Performance by Club',
        description: 'For each club, calculate total goals scored by their players. Join players to clubs to appearances. Show club name, player count, and total goals.',
        hint: 'Use multiple JOINs: clubs → players → appearances',
        expectedQuery: `SELECT c.name as club_name,
       COUNT(DISTINCT p.player_id) as player_count,
       SUM(a.goals) as total_goals
FROM clubs c
JOIN players p ON c.club_id = p.current_club_id
JOIN appearances a ON p.player_id = a.player_id
WHERE a.goals IS NOT NULL
GROUP BY c.club_id, c.name
HAVING SUM(a.goals) > 50
ORDER BY total_goals DESC
LIMIT 15`,
        validateFn: (result) => {
            return result[0].hasOwnProperty('club_name') &&
                   result[0].hasOwnProperty('player_count') &&
                   result[0].hasOwnProperty('total_goals');
        },
        points: 30,
        schema: `Tables: clubs, players, appearances
clubs: club_id, name
players: player_id, name, current_club_id
appearances: player_id, goals, assists`
    },
    {
        id: 14,
        difficulty: 'expert',
        category: 'Window-like Aggregation',
        title: 'Season Goal Totals',
        description: 'Calculate total goals (home + away) for each season. Show season and total goals, ordered by season.',
        hint: 'GROUP BY season, SUM both goal columns',
        expectedQuery: `SELECT season, 
       SUM(home_club_goals) + SUM(away_club_goals) as total_goals,
       COUNT(*) as games_played
FROM games
WHERE season IS NOT NULL 
  AND home_club_goals IS NOT NULL 
  AND away_club_goals IS NOT NULL
GROUP BY season
ORDER BY season DESC`,
        validateFn: (result) => {
            return result[0].hasOwnProperty('season') &&
                   result[0].hasOwnProperty('total_goals');
        },
        points: 25,
        schema: `Table: games
- game_id, season, home_club_goals, away_club_goals, competition_id`
    },
    {
        id: 15,
        difficulty: 'expert',
        category: 'Complex Analysis',
        title: 'Home vs Away Performance',
        description: 'For each competition, calculate the percentage of home wins. A home win is when home_club_goals > away_club_goals. Show competition name and home win percentage.',
        hint: 'Use CASE/SUM to count home wins, divide by total games',
        expectedQuery: `SELECT c.name as competition_name,
       COUNT(*) as total_games,
       SUM(CASE WHEN g.home_club_goals > g.away_club_goals THEN 1 ELSE 0 END) as home_wins,
       ROUND(100.0 * SUM(CASE WHEN g.home_club_goals > g.away_club_goals THEN 1 ELSE 0 END) / COUNT(*), 1) as home_win_pct
FROM games g
JOIN competitions c ON g.competition_id = c.competition_id
WHERE g.home_club_goals IS NOT NULL AND g.away_club_goals IS NOT NULL
GROUP BY c.competition_id, c.name
HAVING COUNT(*) > 100
ORDER BY home_win_pct DESC
LIMIT 10`,
        validateFn: (result) => {
            return result[0].hasOwnProperty('competition_name') &&
                   result[0].hasOwnProperty('home_win_pct');
        },
        points: 30,
        schema: `Tables: games, competitions
games: game_id, competition_id, home_club_goals, away_club_goals
competitions: competition_id, name`
    }
];

module.exports = { sqlChallenges };

