require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { pool } = require('../config/database'); // Using the pool, NOT sequelize

const DB_FOLDER = path.join(__dirname, '..', '..', 'db');

// Helper: Convert "€1.50m" -> 1500000
function cleanCurrency(val) {
    if (!val || val === 'NA' || val === '' || val === 'null') return null;
    
    // Remove symbols and spaces
    let clean = val.toString().replace(/€/g, '').replace(/ /g, '');
    
    let multiplier = 1;
    if (clean.toLowerCase().endsWith('m')) {
        multiplier = 1000000;
        clean = clean.slice(0, -1); // Remove 'm'
    } else if (clean.toLowerCase().endsWith('k')) {
        multiplier = 1000;
        clean = clean.slice(0, -1); // Remove 'k'
    } else if (clean.toLowerCase().endsWith('bn')) {
        multiplier = 1000000000;
        clean = clean.slice(0, -2); // Remove 'bn'
    }

    const number = parseFloat(clean);
    if (isNaN(number)) return null;

    return Math.round(number * multiplier);
}

function cleanInt(val) {
    if (!val || val === 'NA' || val === '') return null;
    const num = parseInt(val);
    return isNaN(num) ? null : num;
}

function cleanFloat(val) {
    if (!val || val === 'NA' || val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
}

async function createTables() {
    console.log('🏗️  Rebuilding Database Schema (Raw SQL)...');

    const tables = [
        'transfers', 'appearances', 'game_events', 'games', 
        'players', 'clubs', 'competitions'
    ];

    // 1. Drop existing tables (order matters for foreign keys)
    for (const table of tables) {
        await pool.query(`DROP TABLE IF EXISTS ${table}`);
    }

    // 2. Create Competitions
    await pool.query(`
        CREATE TABLE competitions (
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
        )
    `);

    // 3. Create Clubs (with BIGINT for market value)
    await pool.query(`
        CREATE TABLE clubs (
            club_id INT PRIMARY KEY,
            club_code VARCHAR(100),
            name VARCHAR(255),
            domestic_competition_id VARCHAR(100),
            total_market_value BIGINT,
            squad_size INT,
            average_age DECIMAL(4, 1),
            foreigners_number INT,
            foreigners_percentage DECIMAL(5, 2),
            national_team_players INT,
            stadium_name VARCHAR(255),
            stadium_seats INT,
            net_transfer_record VARCHAR(50),
            coach_name VARCHAR(255),
            last_season INT,
            url VARCHAR(500),
            FOREIGN KEY (domestic_competition_id) REFERENCES competitions(competition_id)
        )
    `);

    // 4. Create Players (Correct fields & BIGINT values)
    await pool.query(`
        CREATE TABLE players (
            player_id INT PRIMARY KEY,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            name VARCHAR(255),
            last_season INT,
            current_club_id INT,
            player_code VARCHAR(100),
            country_of_birth VARCHAR(100),
            city_of_birth VARCHAR(100),
            country_of_citizenship VARCHAR(100),
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
            market_value_in_eur BIGINT,
            highest_market_value_in_eur BIGINT,
            FOREIGN KEY (current_club_id) REFERENCES clubs(club_id)
        )
    `);

    // 5. Create Games
    await pool.query(`
        CREATE TABLE games (
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
        )
    `);

    // 6. Create Appearances
    await pool.query(`
        CREATE TABLE appearances (
            appearance_id VARCHAR(100) PRIMARY KEY,
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
        )
    `);

    // 7. Create Transfers
    await pool.query(`
        CREATE TABLE transfers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            player_id INT,
            transfer_date DATE,
            transfer_season VARCHAR(10),
            from_club_id INT,
            to_club_id INT,
            from_club_name VARCHAR(255),
            to_club_name VARCHAR(255),
            transfer_fee BIGINT,
            market_value_in_eur BIGINT,
            player_name VARCHAR(255),
            FOREIGN KEY (player_id) REFERENCES players(player_id),
            FOREIGN KEY (from_club_id) REFERENCES clubs(club_id),
            FOREIGN KEY (to_club_id) REFERENCES clubs(club_id)
        )
    `);
    
    // 8. Create Game Events (Optional)
    await pool.query(`
        CREATE TABLE game_events (
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
        )
    `);

    console.log('✅ Schema created successfully!');
}

async function loadCSV(filename) {
    const filepath = path.join(DB_FOLDER, filename);
    if (!fs.existsSync(filepath)) {
        console.warn(`⚠️  File not found: ${filename}`);
        return [];
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    return parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true
    });
}

async function loadFootballData() {
    try {
        await createTables();

        // --- 1. Competitions ---
        console.log('📊 Loading Competitions...');
        const competitions = await loadCSV('competitions.csv');
        for (const row of competitions) {
            await pool.query(`
                INSERT IGNORE INTO competitions 
                (competition_id, competition_code, name, sub_type, type, country_id, country_name, domestic_league_code, confederation, is_major_national_league, url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                row.competition_id, row.competition_code, row.name, row.sub_type, row.type,
                cleanInt(row.country_id), row.country_name, row.domestic_league_code,
                row.confederation, row.is_major_national_league === 'true', row.url
            ]);
        }

        // --- 2. Clubs ---
        console.log('📊 Loading Clubs...');
        const clubs = await loadCSV('clubs.csv');
        for (const row of clubs) {
            await pool.query(`
                INSERT IGNORE INTO clubs 
                (club_id, club_code, name, domestic_competition_id, total_market_value, squad_size, average_age, foreigners_number, foreigners_percentage, national_team_players, stadium_name, stadium_seats, net_transfer_record, coach_name, last_season, url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                cleanInt(row.club_id), row.club_code, row.name, row.domestic_competition_id,
                cleanCurrency(row.total_market_value), // CLEANING CURRENCY HERE
                cleanInt(row.squad_size), cleanFloat(row.average_age),
                cleanInt(row.foreigners_number), cleanFloat(row.foreigners_percentage),
                cleanInt(row.national_team_players), row.stadium_name,
                cleanInt(row.stadium_seats), row.net_transfer_record,
                row.coach_name, cleanInt(row.last_season), row.url
            ]);
        }

        // --- 3. Players ---
        console.log('📊 Loading Players (Top 10,000)...');
        const players = await loadCSV('players.csv');
        // Limit to 10k to prevent timeout on free tiers, remove slice if on powerful DB
        let pCount = 0;
        for (const row of players.slice(0, 10000)) {
            await pool.query(`
                INSERT IGNORE INTO players 
                (player_id, first_name, last_name, name, last_season, current_club_id, player_code, country_of_birth, city_of_birth, country_of_citizenship, date_of_birth, sub_position, position, foot, height_in_cm, contract_expiration_date, agent_name, image_url, url, current_club_domestic_competition_id, current_club_name, market_value_in_eur, highest_market_value_in_eur)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                cleanInt(row.player_id), row.first_name, row.last_name, row.name,
                cleanInt(row.last_season), cleanInt(row.current_club_id), row.player_code,
                row.country_of_birth, row.city_of_birth, row.country_of_citizenship,
                row.date_of_birth || null, row.sub_position, row.position, row.foot,
                cleanInt(row.height_in_cm), row.contract_expiration_date || null,
                row.agent_name, row.image_url, row.url,
                row.current_club_domestic_competition_id, row.current_club_name,
                cleanCurrency(row.market_value_in_eur),        // CLEANING
                cleanCurrency(row.highest_market_value_in_eur) // CLEANING
            ]);
            pCount++;
            if (pCount % 2000 === 0) console.log(`   ... ${pCount} players inserted`);
        }

        // --- 4. Games ---
        console.log('📊 Loading Games...');
        const games = await loadCSV('games.csv');
        let gCount = 0;
        for (const row of games) {
            await pool.query(`
                INSERT IGNORE INTO games 
                (game_id, competition_id, season, round, date, home_club_id, away_club_id, home_club_goals, away_club_goals, home_club_position, away_club_position, home_club_manager_name, away_club_manager_name, stadium, attendance, referee, url, home_club_formation, away_club_formation, home_club_name, away_club_name, aggregate, competition_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                cleanInt(row.game_id), row.competition_id, cleanInt(row.season),
                row.round, row.date || null, cleanInt(row.home_club_id), cleanInt(row.away_club_id),
                cleanInt(row.home_club_goals), cleanInt(row.away_club_goals),
                cleanInt(row.home_club_position), cleanInt(row.away_club_position),
                row.home_club_manager_name, row.away_club_manager_name,
                row.stadium, cleanInt(row.attendance), row.referee, row.url,
                row.home_club_formation, row.away_club_formation,
                row.home_club_name, row.away_club_name, row.aggregate, row.competition_type
            ]);
            gCount++;
        }

        // --- 5. Appearances ---
        console.log('📊 Loading Appearances (Top 20,000)...');
        const appearances = await loadCSV('appearances.csv');
        let aCount = 0;
        for (const row of appearances.slice(0, 20000)) {
            await pool.query(`
                INSERT IGNORE INTO appearances 
                (appearance_id, game_id, player_id, player_club_id, player_current_club_id, date, player_name, competition_id, yellow_cards, red_cards, goals, assists, minutes_played)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                row.appearance_id, cleanInt(row.game_id), cleanInt(row.player_id),
                cleanInt(row.player_club_id), cleanInt(row.player_current_club_id),
                row.date || null, row.player_name, row.competition_id,
                cleanInt(row.yellow_cards), cleanInt(row.red_cards),
                cleanInt(row.goals), cleanInt(row.assists), cleanInt(row.minutes_played)
            ]);
            aCount++;
            if (aCount % 5000 === 0) console.log(`   ... ${aCount} appearances inserted`);
        }

        // --- 6. Transfers ---
        console.log('📊 Loading Transfers...');
        const transfers = await loadCSV('transfers.csv');
        let tCount = 0;
        for (const row of transfers) {
            await pool.query(`
                INSERT INTO transfers 
                (player_id, transfer_date, transfer_season, from_club_id, to_club_id, from_club_name, to_club_name, transfer_fee, market_value_in_eur, player_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                cleanInt(row.player_id), row.transfer_date || null, row.transfer_season,
                cleanInt(row.from_club_id), cleanInt(row.to_club_id),
                row.from_club_name, row.to_club_name,
                cleanCurrency(row.transfer_fee),        // CLEANING
                cleanCurrency(row.market_value_in_eur), // CLEANING
                row.player_name
            ]);
            tCount++;
        }

        console.log(`\n🎉 Data Load Complete!`);
        console.log(`   Players: ${pCount}`);
        console.log(`   Games: ${gCount}`);
        console.log(`   Appearances: ${aCount}`);
        console.log(`   Transfers: ${tCount}`);
        
        process.exit(0);

    } catch (error) {
        console.error('❌ Error loading data:', error);
        process.exit(1);
    }
}

// Run
if (require.main === module) {
    loadFootballData();
}

module.exports = { loadFootballData };