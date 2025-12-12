-- --------------------------------------------------------
-- 1. USER & GAME SYSTEM (Existing)
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
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
);

CREATE TABLE IF NOT EXISTS questions (
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
);

CREATE TABLE IF NOT EXISTS game_sessions (
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
);

CREATE TABLE IF NOT EXISTS game_answers (
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
);

-- --------------------------------------------------------
-- 2. FOOTBALL DATASET
-- --------------------------------------------------------

-- 2.1 Competitions
CREATE TABLE IF NOT EXISTS competitions (
    competition_id INT PRIMARY KEY,
    competition_code VARCHAR(50),
    name VARCHAR(255),
    sub_type VARCHAR(100),
    type VARCHAR(100),
    country_name VARCHAR(100),
    url VARCHAR(500) -- Optional: often useful if dataset has links
);

-- 2.2 Clubs
CREATE TABLE IF NOT EXISTS clubs (
    club_id INT PRIMARY KEY,
    club_code VARCHAR(100),
    name VARCHAR(255),
    domestic_competition_id INT,
    total_market_value VARCHAR(50), -- VARCHAR because dataset usually has symbols like '€1.2m'
    squad_size INT,
    average_age DECIMAL(4, 1),      -- Changed to DECIMAL for precision (e.g. 25.4)
    stadium_name VARCHAR(255),
    stadium_seats INT,
    coach_name VARCHAR(255),
    FOREIGN KEY (domestic_competition_id) REFERENCES competitions(competition_id)
);

-- 2.3 Players
CREATE TABLE IF NOT EXISTS players (
    player_id INT PRIMARY KEY,
    name VARCHAR(255),
    current_club_id INT,
    country_of_birth VARCHAR(100),
    date_of_birth DATE,
    position VARCHAR(50),
    foot VARCHAR(10),
    agent_name VARCHAR(255),
    market_value_in_eur VARCHAR(50), -- VARCHAR to handle dataset formatting
    FOREIGN KEY (current_club_id) REFERENCES clubs(club_id)
);

-- 2.4 Games
CREATE TABLE IF NOT EXISTS games (
    game_id INT PRIMARY KEY,
    competition_id INT,
    season VARCHAR(10),     -- e.g., "2023", "22/23"
    round VARCHAR(50),      -- e.g., "Matchday 1"
    date DATE,
    home_club_id INT,
    away_club_id INT,
    home_club_goals INT,
    away_club_goals INT,
    stadium VARCHAR(255),
    attendance INT,
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id),
    FOREIGN KEY (home_club_id) REFERENCES clubs(club_id),
    FOREIGN KEY (away_club_id) REFERENCES clubs(club_id)
);

-- 2.5 Appearances (Player Stats in a Game)
CREATE TABLE IF NOT EXISTS appearances (
    appearance_id VARCHAR(100) PRIMARY KEY, -- Datasets often use a string key like 'gameID_playerID'
    game_id INT,
    player_id INT,
    player_club_id INT,
    yellow_cards INT DEFAULT 0,
    red_cards INT DEFAULT 0,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    minutes_played INT DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id),
    FOREIGN KEY (player_club_id) REFERENCES clubs(club_id)
);

-- 2.6 Transfers
CREATE TABLE IF NOT EXISTS transfers (
    player_id INT,
    transfer_date DATE,
    transfer_season VARCHAR(10),
    from_club_id INT,
    to_club_id INT,
    transfer_fee VARCHAR(50),      -- VARCHAR because "Free transfer", "loan", or "€50m"
    market_value_in_eur VARCHAR(50),
    FOREIGN KEY (player_id) REFERENCES players(player_id),
    FOREIGN KEY (from_club_id) REFERENCES clubs(club_id),
    FOREIGN KEY (to_club_id) REFERENCES clubs(club_id)
);