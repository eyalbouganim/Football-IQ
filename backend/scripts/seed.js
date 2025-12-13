require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const footballQuestions = [
    // Easy Questions
    {
        question: "Which country won the FIFA World Cup 2022?",
        options: ["France", "Argentina", "Brazil", "Croatia"],
        correctAnswer: "Argentina",
        difficulty: "easy",
        category: "World Cup",
        points: 5,
        explanation: "Argentina won the 2022 FIFA World Cup in Qatar, defeating France in a penalty shootout after a 3-3 draw."
    },
    {
        question: "How many players are on the field per team in a football match?",
        options: ["9", "10", "11", "12"],
        correctAnswer: "11",
        difficulty: "easy",
        category: "Rules",
        points: 5,
        explanation: "Each team fields 11 players on the pitch, including the goalkeeper."
    },
    {
        question: "Which club has won the most UEFA Champions League titles?",
        options: ["AC Milan", "Real Madrid", "Barcelona", "Liverpool"],
        correctAnswer: "Real Madrid",
        difficulty: "easy",
        category: "Champions League",
        points: 5,
        explanation: "Real Madrid has won 15 Champions League/European Cup titles, more than any other club."
    },
    {
        question: "What is the standard duration of a professional football match?",
        options: ["80 minutes", "90 minutes", "100 minutes", "120 minutes"],
        correctAnswer: "90 minutes",
        difficulty: "easy",
        category: "Rules",
        points: 5,
        explanation: "A standard match consists of two 45-minute halves, totaling 90 minutes of regular time."
    },
    {
        question: "Which player is known as 'CR7'?",
        options: ["Cristiano Ronaldo", "Carlos Roa", "Claudio Reyna", "Cafu"],
        correctAnswer: "Cristiano Ronaldo",
        difficulty: "easy",
        category: "Players",
        points: 5,
        explanation: "CR7 is the nickname of Cristiano Ronaldo, combining his initials with his iconic number 7."
    },
    
    // Medium Questions
    {
        question: "In which year did the English Premier League officially begin?",
        options: ["1990", "1992", "1994", "1996"],
        correctAnswer: "1992",
        difficulty: "medium",
        category: "Premier League",
        points: 10,
        explanation: "The Premier League was founded on February 20, 1992, with the first season starting in August 1992."
    },
    {
        question: "Which player has scored the most goals in World Cup history?",
        options: ["Pelé", "Ronaldo", "Miroslav Klose", "Just Fontaine"],
        correctAnswer: "Miroslav Klose",
        difficulty: "medium",
        category: "World Cup",
        points: 10,
        explanation: "Miroslav Klose holds the record with 16 World Cup goals across four tournaments (2002-2014)."
    },
    {
        question: "What is the maximum number of substitutions allowed in a standard football match?",
        options: ["3", "5", "7", "Unlimited"],
        correctAnswer: "5",
        difficulty: "medium",
        category: "Rules",
        points: 10,
        explanation: "FIFA permanently adopted the rule allowing 5 substitutions per team in 2022."
    },
    {
        question: "Which country hosted the first FIFA World Cup in 1930?",
        options: ["Brazil", "Italy", "Uruguay", "Argentina"],
        correctAnswer: "Uruguay",
        difficulty: "medium",
        category: "World Cup",
        points: 10,
        explanation: "Uruguay hosted and won the inaugural FIFA World Cup in 1930."
    },
    {
        question: "Who is the all-time top scorer for the Spanish national team?",
        options: ["Fernando Torres", "Raúl", "David Villa", "David Silva"],
        correctAnswer: "David Villa",
        difficulty: "medium",
        category: "International",
        points: 10,
        explanation: "David Villa scored 59 goals for Spain in 98 appearances, making him their all-time top scorer."
    },
    {
        question: "What does VAR stand for in football?",
        options: ["Video Assisted Referee", "Video Analysis Review", "Visible Action Replay", "Virtual Assistant Referee"],
        correctAnswer: "Video Assisted Referee",
        difficulty: "medium",
        category: "Rules",
        points: 10,
        explanation: "VAR stands for Video Assistant Referee, introduced to help referees make crucial decisions."
    },
    
    // Hard Questions
    {
        question: "Which player has won the most Ballon d'Or awards?",
        options: ["Cristiano Ronaldo", "Lionel Messi", "Michel Platini", "Johan Cruyff"],
        correctAnswer: "Lionel Messi",
        difficulty: "hard",
        category: "Awards",
        points: 15,
        explanation: "Lionel Messi has won 8 Ballon d'Or awards (2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023)."
    },
    {
        question: "What is the official circumference of a FIFA-standard football?",
        options: ["64-66 cm", "68-70 cm", "72-74 cm", "76-78 cm"],
        correctAnswer: "68-70 cm",
        difficulty: "hard",
        category: "Rules",
        points: 15,
        explanation: "According to FIFA's Laws of the Game, a size 5 ball must have a circumference between 68-70 cm."
    },
    {
        question: "Which club did Johan Cruyff NOT play for during his career?",
        options: ["Ajax", "Barcelona", "Feyenoord", "Real Madrid"],
        correctAnswer: "Real Madrid",
        difficulty: "hard",
        category: "Players",
        points: 15,
        explanation: "Cruyff famously never played for Real Madrid, playing for Ajax, Barcelona, and briefly Feyenoord."
    },
    {
        question: "In what year was the offside rule first introduced?",
        options: ["1863", "1866", "1886", "1925"],
        correctAnswer: "1866",
        difficulty: "hard",
        category: "History",
        points: 15,
        explanation: "The offside rule was introduced in 1866, requiring three defenders between the attacker and goal."
    },
    {
        question: "Which goalkeeper has the most clean sheets in Premier League history?",
        options: ["David Seaman", "Peter Cech", "Edwin van der Sar", "David de Gea"],
        correctAnswer: "Peter Cech",
        difficulty: "hard",
        category: "Premier League",
        points: 15,
        explanation: "Peter Cech holds the record with 202 clean sheets in the Premier League."
    },
    
    // Expert Questions (SQL-themed for the database workshop)
    {
        question: "In a database of football statistics, which SQL clause would you use to find the top 10 scorers?",
        options: ["WHERE TOP 10", "LIMIT 10", "HAVING 10", "FETCH FIRST 10"],
        correctAnswer: "LIMIT 10",
        difficulty: "expert",
        category: "SQL",
        points: 20,
        explanation: "LIMIT 10 is used in PostgreSQL/MySQL to restrict results to the top 10 rows.",
        sqlQuery: "SELECT player_name, goals FROM players ORDER BY goals DESC LIMIT 10;"
    },
    {
        question: "To find players who scored more than the average goals, which SQL operation would you use?",
        options: ["JOIN", "SUBQUERY", "UNION", "GROUP BY"],
        correctAnswer: "SUBQUERY",
        difficulty: "expert",
        category: "SQL",
        points: 20,
        explanation: "A subquery calculates the average goals, then the main query filters players above it.",
        sqlQuery: "SELECT * FROM players WHERE goals > (SELECT AVG(goals) FROM players);"
    },
    {
        question: "Which SQL JOIN type would return all players even if they have no team assigned?",
        options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "CROSS JOIN"],
        correctAnswer: "LEFT JOIN",
        difficulty: "expert",
        category: "SQL",
        points: 20,
        explanation: "LEFT JOIN returns all rows from the left table (players), with NULLs for unmatched team data.",
        sqlQuery: "SELECT p.name, t.team_name FROM players p LEFT JOIN teams t ON p.team_id = t.id;"
    },
    {
        question: "To count goals per team in a match database, which clause is essential?",
        options: ["ORDER BY", "GROUP BY", "HAVING", "DISTINCT"],
        correctAnswer: "GROUP BY",
        difficulty: "expert",
        category: "SQL",
        points: 20,
        explanation: "GROUP BY aggregates rows by team, allowing COUNT() or SUM() to calculate totals per team.",
        sqlQuery: "SELECT team_id, COUNT(*) as goals FROM goals GROUP BY team_id;"
    },
    {
        question: "Which window function would rank teams by points without gaps in ranking?",
        options: ["ROW_NUMBER()", "RANK()", "DENSE_RANK()", "NTILE()"],
        correctAnswer: "DENSE_RANK()",
        difficulty: "expert",
        category: "SQL",
        points: 20,
        explanation: "DENSE_RANK() assigns consecutive ranks without gaps when values are tied.",
        sqlQuery: "SELECT team_name, points, DENSE_RANK() OVER (ORDER BY points DESC) as rank FROM teams;"
    },
    {
        question: "To find teams that have never lost a match, which SQL approach is most efficient?",
        options: ["LEFT JOIN with NULL check", "NOT EXISTS subquery", "NOT IN subquery", "All are equally efficient"],
        correctAnswer: "NOT EXISTS subquery",
        difficulty: "expert",
        category: "SQL",
        points: 20,
        explanation: "NOT EXISTS is typically most efficient as it stops searching once a match is found.",
        sqlQuery: "SELECT * FROM teams t WHERE NOT EXISTS (SELECT 1 FROM matches m WHERE m.loser_id = t.id);"
    }
];

const createGameTables = async () => {
    console.log('🏗️  Creating Game System Tables...');
    
    // We drop these tables to ensure a clean slate (matching "force: true" behavior)
    // Order matters because of Foreign Keys!
    await pool.query('DROP TABLE IF EXISTS game_answers');
    await pool.query('DROP TABLE IF EXISTS game_sessions');
    await pool.query('DROP TABLE IF EXISTS questions');
    await pool.query('DROP TABLE IF EXISTS users');

    // 1. Users
    await pool.query(`
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            favorite_team VARCHAR(100),
            total_score INT DEFAULT 0,
            games_played INT DEFAULT 0,
            highest_score INT DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    // 2. Questions
    await pool.query(`
        CREATE TABLE questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question TEXT NOT NULL,
            options JSON NOT NULL,
            correct_answer VARCHAR(500) NOT NULL,
            difficulty ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
            category VARCHAR(100) NOT NULL DEFAULT 'general',
            points INT DEFAULT 10,
            explanation TEXT,
            sql_query TEXT,
            is_active BOOLEAN DEFAULT true,
            times_answered INT DEFAULT 0,
            times_correct INT DEFAULT 0,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    // 3. Game Sessions
    await pool.query(`
        CREATE TABLE game_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            score INT DEFAULT 0,
            total_questions INT DEFAULT 0,
            correct_answers INT DEFAULT 0,
            difficulty ENUM('easy', 'medium', 'hard', 'expert', 'mixed') DEFAULT 'mixed',
            status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            time_spent_seconds INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // 4. Game Answers
    await pool.query(`
        CREATE TABLE game_answers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id INT NOT NULL,
            question_id INT NOT NULL,
            user_answer VARCHAR(500) NOT NULL,
            is_correct BOOLEAN NOT NULL,
            points_earned INT DEFAULT 0,
            time_spent_seconds INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
    `);

    console.log('✅ Game Tables created');
};

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...\n');
        
        // 1. Create Tables
        await createGameTables();

        // 2. Create Demo User
        const hashedPassword = await bcrypt.hash('Demo@123!', 10);
        await pool.query(`
            INSERT INTO users (username, email, password, favorite_team) 
            VALUES (?, ?, ?, ?)
        `, ['demo', 'demo@footballiq.com', hashedPassword, 'Manchester United']);
        
        console.log(`✅ Demo user created: demo`);

        // 3. Create Questions
        let created = 0;
        for (const q of footballQuestions) {
            await pool.query(`
                INSERT INTO questions 
                (question, options, correct_answer, difficulty, category, points, explanation, sql_query)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                q.question, 
                JSON.stringify(q.options), // Convert Array to JSON string
                q.correctAnswer, 
                q.difficulty, 
                q.category, 
                q.points, 
                q.explanation,
                q.sqlQuery || null
            ]);
            created++;
        }
        console.log(`✅ Created ${created} questions\n`);

        // 4. Summary
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [qCount] = await pool.query('SELECT COUNT(*) as count FROM questions');
        
        console.log('📊 Database Summary:');
        console.log(`   - Users: ${userCount[0].count}`);
        console.log(`   - Questions: ${qCount[0].count}`);
        console.log('\n✨ Seeding completed successfully!\n');
        
        console.log('🔐 Demo Account:');
        console.log('   Username: demo');
        console.log('   Password: Demo@123!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase, footballQuestions };