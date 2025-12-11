require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { sequelize } = require('../config/database');

const DB_FOLDER = path.join(__dirname, '..', '..', 'db');

async function createTables() {
    // Drop tables in correct order (respecting dependencies)
    await sequelize.query('DROP TABLE IF EXISTS appearances');
    await sequelize.query('DROP TABLE IF EXISTS game_events');
    await sequelize.query('DROP TABLE IF EXISTS transfers');
    await sequelize.query('DROP TABLE IF EXISTS player_valuations');
    await sequelize.query('DROP TABLE IF EXISTS games');
    await sequelize.query('DROP TABLE IF EXISTS players');
    await sequelize.query('DROP TABLE IF EXISTS clubs');
    await sequelize.query('DROP TABLE IF EXISTS competitions');

    // Create competitions table
    await sequelize.query(`
        CREATE TABLE competitions (
            competition_id TEXT PRIMARY KEY,
            competition_code TEXT,
            name TEXT,
            sub_type TEXT,
            type TEXT,
            country_id INTEGER,
            country_name TEXT,
            domestic_league_code TEXT,
            confederation TEXT,
            is_major_national_league TEXT
        )
    `);

    // Create clubs table
    await sequelize.query(`
        CREATE TABLE clubs (
            club_id INTEGER PRIMARY KEY,
            club_code TEXT,
            name TEXT,
            domestic_competition_id TEXT,
            total_market_value TEXT,
            squad_size INTEGER,
            average_age REAL,
            foreigners_number INTEGER,
            foreigners_percentage REAL,
            national_team_players INTEGER,
            stadium_name TEXT,
            stadium_seats INTEGER,
            net_transfer_record TEXT,
            coach_name TEXT,
            last_season INTEGER
        )
    `);

    // Create players table
    await sequelize.query(`
        CREATE TABLE players (
            player_id INTEGER PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            name TEXT,
            last_season INTEGER,
            current_club_id INTEGER,
            player_code TEXT,
            country_of_birth TEXT,
            city_of_birth TEXT,
            country_of_citizenship TEXT,
            date_of_birth TEXT,
            sub_position TEXT,
            position TEXT,
            foot TEXT,
            height_in_cm INTEGER,
            contract_expiration_date TEXT,
            agent_name TEXT,
            image_url TEXT,
            current_club_domestic_competition_id TEXT,
            current_club_name TEXT,
            market_value_in_eur INTEGER,
            highest_market_value_in_eur INTEGER
        )
    `);

    // Create games table
    await sequelize.query(`
        CREATE TABLE games (
            game_id INTEGER PRIMARY KEY,
            competition_id TEXT,
            season INTEGER,
            round TEXT,
            date TEXT,
            home_club_id INTEGER,
            away_club_id INTEGER,
            home_club_goals INTEGER,
            away_club_goals INTEGER,
            home_club_position INTEGER,
            away_club_position INTEGER,
            home_club_manager_name TEXT,
            away_club_manager_name TEXT,
            stadium TEXT,
            attendance INTEGER,
            referee TEXT,
            home_club_formation TEXT,
            away_club_formation TEXT,
            home_club_name TEXT,
            away_club_name TEXT,
            aggregate TEXT,
            competition_type TEXT
        )
    `);

    // Create appearances table
    await sequelize.query(`
        CREATE TABLE appearances (
            appearance_id TEXT PRIMARY KEY,
            game_id INTEGER,
            player_id INTEGER,
            player_club_id INTEGER,
            player_current_club_id INTEGER,
            date TEXT,
            player_name TEXT,
            competition_id TEXT,
            yellow_cards INTEGER,
            red_cards INTEGER,
            goals INTEGER,
            assists INTEGER,
            minutes_played INTEGER
        )
    `);

    // Create game_events table
    await sequelize.query(`
        CREATE TABLE game_events (
            game_event_id TEXT PRIMARY KEY,
            date TEXT,
            game_id INTEGER,
            minute INTEGER,
            type TEXT,
            club_id INTEGER,
            player_id INTEGER,
            description TEXT,
            player_in_id INTEGER,
            player_assist_id INTEGER
        )
    `);

    // Create transfers table
    await sequelize.query(`
        CREATE TABLE transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            transfer_date TEXT,
            transfer_season TEXT,
            from_club_id INTEGER,
            to_club_id INTEGER,
            from_club_name TEXT,
            to_club_name TEXT,
            transfer_fee REAL,
            market_value_in_eur REAL,
            player_name TEXT
        )
    `);

    // Create indexes
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_players_club ON players(current_club_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_players_country ON players(country_of_citizenship)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_players_position ON players(position)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_appearances_player ON appearances(player_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_appearances_game ON appearances(game_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_games_competition ON games(competition_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_games_season ON games(season)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_transfers_player ON transfers(player_id)');
}

async function loadCSV(filename) {
    const filepath = path.join(DB_FOLDER, filename);
    if (!fs.existsSync(filepath)) {
        console.log(`⚠️  File not found: ${filename}`);
        return [];
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        cast: (value, context) => {
            if (value === '' || value === 'NA' || value === 'null') return null;
            return value;
        }
    });
    return records;
}

function cleanValue(val, type = 'text') {
    if (val === null || val === undefined || val === '' || val === 'NA') return null;
    if (type === 'integer') {
        const parsed = parseInt(val);
        return isNaN(parsed) ? null : parsed;
    }
    if (type === 'real') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
    }
    return val;
}

async function loadFootballData() {
    console.log('🏈 Loading Football Database...\n');
    
    try {
        // Create tables
        console.log('📋 Creating tables...');
        await createTables();
        console.log('✅ Tables created\n');

        // Load competitions
        console.log('📊 Loading competitions...');
        const competitions = await loadCSV('competitions.csv');
        let compCount = 0;
        for (const row of competitions.slice(0, 500)) {
            try {
                await sequelize.query(`
                    INSERT OR IGNORE INTO competitions (competition_id, competition_code, name, sub_type, type, country_id, country_name, domestic_league_code, confederation, is_major_national_league)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, {
                    replacements: [
                        row.competition_id, row.competition_code, row.name, row.sub_type, row.type,
                        cleanValue(row.country_id, 'integer'), row.country_name, row.domestic_league_code,
                        row.confederation, row.is_major_national_league
                    ]
                });
                compCount++;
            } catch (e) {}
        }
        console.log(`✅ Loaded ${compCount} competitions`);

        // Load clubs
        console.log('📊 Loading clubs...');
        const clubs = await loadCSV('clubs.csv');
        let clubCount = 0;
        for (const row of clubs.slice(0, 2000)) {
            try {
                await sequelize.query(`
                    INSERT OR IGNORE INTO clubs (club_id, club_code, name, domestic_competition_id, squad_size, average_age, foreigners_number, foreigners_percentage, national_team_players, stadium_name, stadium_seats, coach_name, last_season)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, {
                    replacements: [
                        cleanValue(row.club_id, 'integer'), row.club_code, row.name, row.domestic_competition_id,
                        cleanValue(row.squad_size, 'integer'), cleanValue(row.average_age, 'real'),
                        cleanValue(row.foreigners_number, 'integer'), cleanValue(row.foreigners_percentage, 'real'),
                        cleanValue(row.national_team_players, 'integer'), row.stadium_name,
                        cleanValue(row.stadium_seats, 'integer'), row.coach_name, cleanValue(row.last_season, 'integer')
                    ]
                });
                clubCount++;
            } catch (e) {}
        }
        console.log(`✅ Loaded ${clubCount} clubs`);

        // Load players
        console.log('📊 Loading players...');
        const players = await loadCSV('players.csv');
        let playerCount = 0;
        for (const row of players.slice(0, 10000)) {
            try {
                await sequelize.query(`
                    INSERT OR IGNORE INTO players (player_id, first_name, last_name, name, last_season, current_club_id, player_code, country_of_birth, city_of_birth, country_of_citizenship, date_of_birth, sub_position, position, foot, height_in_cm, current_club_domestic_competition_id, current_club_name, market_value_in_eur, highest_market_value_in_eur)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, {
                    replacements: [
                        cleanValue(row.player_id, 'integer'), row.first_name, row.last_name, row.name,
                        cleanValue(row.last_season, 'integer'), cleanValue(row.current_club_id, 'integer'),
                        row.player_code, row.country_of_birth, row.city_of_birth, row.country_of_citizenship,
                        row.date_of_birth, row.sub_position, row.position, row.foot,
                        cleanValue(row.height_in_cm, 'integer'), row.current_club_domestic_competition_id,
                        row.current_club_name, cleanValue(row.market_value_in_eur, 'integer'),
                        cleanValue(row.highest_market_value_in_eur, 'integer')
                    ]
                });
                playerCount++;
            } catch (e) {}
        }
        console.log(`✅ Loaded ${playerCount} players`);

        // Load games
        console.log('📊 Loading games...');
        const games = await loadCSV('games.csv');
        let gameCount = 0;
        for (const row of games.slice(0, 20000)) {
            try {
                await sequelize.query(`
                    INSERT OR IGNORE INTO games (game_id, competition_id, season, round, date, home_club_id, away_club_id, home_club_goals, away_club_goals, home_club_position, away_club_position, home_club_manager_name, away_club_manager_name, stadium, attendance, referee, home_club_formation, away_club_formation, home_club_name, away_club_name, aggregate, competition_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, {
                    replacements: [
                        cleanValue(row.game_id, 'integer'), row.competition_id, cleanValue(row.season, 'integer'),
                        row.round, row.date, cleanValue(row.home_club_id, 'integer'),
                        cleanValue(row.away_club_id, 'integer'), cleanValue(row.home_club_goals, 'integer'),
                        cleanValue(row.away_club_goals, 'integer'), cleanValue(row.home_club_position, 'integer'),
                        cleanValue(row.away_club_position, 'integer'), row.home_club_manager_name,
                        row.away_club_manager_name, row.stadium, cleanValue(row.attendance, 'integer'),
                        row.referee, row.home_club_formation, row.away_club_formation,
                        row.home_club_name, row.away_club_name, row.aggregate, row.competition_type
                    ]
                });
                gameCount++;
            } catch (e) {}
        }
        console.log(`✅ Loaded ${gameCount} games`);

        // Load appearances
        console.log('📊 Loading appearances (this may take a minute)...');
        const appearances = await loadCSV('appearances.csv');
        let appCount = 0;
        for (const row of appearances.slice(0, 50000)) {
            try {
                await sequelize.query(`
                    INSERT OR IGNORE INTO appearances (appearance_id, game_id, player_id, player_club_id, player_current_club_id, date, player_name, competition_id, yellow_cards, red_cards, goals, assists, minutes_played)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, {
                    replacements: [
                        row.appearance_id, cleanValue(row.game_id, 'integer'),
                        cleanValue(row.player_id, 'integer'), cleanValue(row.player_club_id, 'integer'),
                        cleanValue(row.player_current_club_id, 'integer'), row.date, row.player_name,
                        row.competition_id, cleanValue(row.yellow_cards, 'integer'),
                        cleanValue(row.red_cards, 'integer'), cleanValue(row.goals, 'integer'),
                        cleanValue(row.assists, 'integer'), cleanValue(row.minutes_played, 'integer')
                    ]
                });
                appCount++;
                if (appCount % 10000 === 0) console.log(`   ... ${appCount} appearances loaded`);
            } catch (e) {}
        }
        console.log(`✅ Loaded ${appCount} appearances`);

        // Load transfers
        console.log('📊 Loading transfers...');
        const transfers = await loadCSV('transfers.csv');
        let transferCount = 0;
        for (const row of transfers.slice(0, 20000)) {
            try {
                await sequelize.query(`
                    INSERT INTO transfers (player_id, transfer_date, transfer_season, from_club_id, to_club_id, from_club_name, to_club_name, transfer_fee, market_value_in_eur, player_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, {
                    replacements: [
                        cleanValue(row.player_id, 'integer'), row.transfer_date, row.transfer_season,
                        cleanValue(row.from_club_id, 'integer'), cleanValue(row.to_club_id, 'integer'),
                        row.from_club_name, row.to_club_name, cleanValue(row.transfer_fee, 'real'),
                        cleanValue(row.market_value_in_eur, 'real'), row.player_name
                    ]
                });
                transferCount++;
            } catch (e) {}
        }
        console.log(`✅ Loaded ${transferCount} transfers`);

        console.log('\n🎉 Football database loaded successfully!\n');

        // Print stats
        const [playerStats] = await sequelize.query('SELECT COUNT(*) as count FROM players');
        const [clubStats] = await sequelize.query('SELECT COUNT(*) as count FROM clubs');
        const [gameStats] = await sequelize.query('SELECT COUNT(*) as count FROM games');
        const [appStats] = await sequelize.query('SELECT COUNT(*) as count FROM appearances');
        const [compStats] = await sequelize.query('SELECT COUNT(*) as count FROM competitions');

        console.log('📊 Database Statistics:');
        console.log(`   Competitions: ${compStats[0].count}`);
        console.log(`   Clubs: ${clubStats[0].count}`);
        console.log(`   Players: ${playerStats[0].count}`);
        console.log(`   Games: ${gameStats[0].count}`);
        console.log(`   Appearances: ${appStats[0].count}`);

    } catch (error) {
        console.error('❌ Error loading data:', error);
        throw error;
    }
}

if (require.main === module) {
    loadFootballData()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { loadFootballData };
