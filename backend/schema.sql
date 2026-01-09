-- --------------------------------------------------------
-- User and Game System Tables
-- These tables manage user accounts, game sessions, and questions for the Football IQ application.
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

-- Questions for the quiz game
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

-- Records individual game sessions played by users
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

-- Stores answers given by users for each question within a game session
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
-- Football Dataset Tables
-- These tables store comprehensive football data, typically loaded from external CSV files.

-- Details about various football competitions (e.g., leagues, cups)
CREATE TABLE IF NOT EXISTS competitions (
    competition_id VARCHAR(100) PRIMARY KEY,
    competition_code VARCHAR(100),
    name VARCHAR(255),
    sub_type VARCHAR(100),
    type VARCHAR(100),
    country_id INT,
    country_name VARCHAR(100),
    domestic_league_code VARCHAR(100),
    confederation VARCHAR(100),
    is_major_national_league BOOLEAN,
    url VARCHAR(500)
);

-- Information about football clubs
CREATE TABLE IF NOT EXISTS clubs (
    club_id INT PRIMARY KEY,
    club_code VARCHAR(100),
    name VARCHAR(255),
    domestic_competition_id VARCHAR(100),
    total_market_value BIGINT, -- Total market value of the club's squad
    squad_size INT,
    average_age DECIMAL(4, 1),
    foreigners_number INT,
    foreigners_percentage DECIMAL(5, 2),
    national_team_players INT,
    stadium_name VARCHAR(255),
    stadium_seats INT,
    net_transfer_record VARCHAR(50), -- Net transfer balance, can be positive or negative
    coach_name VARCHAR(255),
    last_season INT,
    url VARCHAR(500),
    FOREIGN KEY (domestic_competition_id) REFERENCES competitions(competition_id)
);

-- Details about individual football players
CREATE TABLE IF NOT EXISTS players (
    player_id INT PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    name VARCHAR(255),
    last_season INT,
    current_club_id INT,
    player_code VARCHAR(100),
    country_of_birth VARCHAR(100),
    city_of_birth VARCHAR(100),
    country_of_citizenship VARCHAR(100), -- Fixes Challenge 1 & 4
    date_of_birth DATE,
    sub_position VARCHAR(50),
    position VARCHAR(50),
    foot VARCHAR(10),
    height_in_cm INT,
    contract_expiration_date DATE,
    agent_name VARCHAR(255),
    image_url VARCHAR(500),
    url VARCHAR(500),
    current_club_domestic_competition_id VARCHAR(100),
    current_club_name VARCHAR(255),
    market_value_in_eur BIGINT,         -- Requires currency cleaning in loader
    highest_market_value_in_eur BIGINT, -- Requires currency cleaning in loader
    FOREIGN KEY (current_club_id) REFERENCES clubs(club_id)
);

-- Records of individual football matches
CREATE TABLE IF NOT EXISTS games (
    game_id INT PRIMARY KEY,
    competition_id VARCHAR(100),
    season INT,
    round VARCHAR(50),
    date DATE,
    home_club_id INT,
    away_club_id INT,
    home_club_goals INT,
    away_club_goals INT,
    home_club_position INT,
    away_club_position INT,
    home_club_manager_name VARCHAR(255),
    away_club_manager_name VARCHAR(255),
    stadium VARCHAR(255),
    attendance INT,
    referee VARCHAR(255),
    url VARCHAR(500),
    home_club_formation VARCHAR(50),
    away_club_formation VARCHAR(50),
    home_club_name VARCHAR(255),
    away_club_name VARCHAR(255),
    aggregate VARCHAR(50),
    competition_type VARCHAR(100),
    FOREIGN KEY (competition_id) REFERENCES competitions(competition_id),
    FOREIGN KEY (home_club_id) REFERENCES clubs(club_id),
    FOREIGN KEY (away_club_id) REFERENCES clubs(club_id)
);

-- Player statistics for each game they appeared in
CREATE TABLE IF NOT EXISTS appearances (
    appearance_id VARCHAR(100) PRIMARY KEY, -- Unique identifier for each player appearance in a game
    game_id INT,
    player_id INT,
    player_club_id INT,
    player_current_club_id INT,
    date DATE,
    player_name VARCHAR(255),
    competition_id VARCHAR(100),
    yellow_cards INT DEFAULT 0,
    red_cards INT DEFAULT 0,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    minutes_played INT DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id),
    FOREIGN KEY (player_club_id) REFERENCES clubs(club_id)
);

-- Records of player transfers between clubs
CREATE TABLE IF NOT EXISTS transfers (
    id INT AUTO_INCREMENT PRIMARY KEY, -- Unique identifier for each transfer record
    player_id INT,
    transfer_date DATE,
    transfer_season VARCHAR(10),
    from_club_id INT,
    to_club_id INT,
    from_club_name VARCHAR(255),
    to_club_name VARCHAR(255),
    transfer_fee BIGINT,       -- Transfer fee in Euros
    market_value_in_eur BIGINT, -- Player's market value at the time of transfer in Euros
    player_name VARCHAR(255),
    FOREIGN KEY (player_id) REFERENCES players(player_id),
    FOREIGN KEY (from_club_id) REFERENCES clubs(club_id),
    FOREIGN KEY (to_club_id) REFERENCES clubs(club_id)
);

-- Detailed events that occurred during a game (e.g., goals, cards, substitutions)
CREATE TABLE IF NOT EXISTS game_events (
    game_event_id VARCHAR(100) PRIMARY KEY,
    date DATE,
    game_id INT,
    minute INT,
    type VARCHAR(50),
    club_id INT,
    player_id INT,
    description TEXT,
    player_in_id INT,
    player_assist_id INT,
    FOREIGN KEY (game_id) REFERENCES games(game_id),
    FOREIGN KEY (player_id) REFERENCES players(player_id)
);

-- --------------------------------------------------------
-- Indexes for Performance Optimization
-- These indexes are crucial for speeding up common queries on the football dataset.

-- Indexes for the 'games' table
CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_home_club_date ON games(home_club_id, date);
CREATE INDEX idx_games_away_club_date ON games(away_club_id, date);
CREATE INDEX idx_games_competition_season ON games(competition_id, season);

-- Indexes for the 'players' table
CREATE INDEX idx_players_current_club ON players(current_club_id);
CREATE INDEX idx_players_name ON players(name);

-- Indexes for the 'appearances' table
CREATE INDEX idx_appearances_game ON appearances(game_id);
CREATE INDEX idx_appearances_player ON appearances(player_id);

-- Indexes for the 'transfers' table
CREATE INDEX idx_transfers_date ON transfers(transfer_date);
CREATE INDEX idx_transfers_player_date ON transfers(player_id, transfer_date);
