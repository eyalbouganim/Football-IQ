require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { pool } = require('../config/database');

const DB_FOLDER = path.join(__dirname, '..', '..', 'db');
const SCHEMA_FILE = path.join(__dirname, '..', 'schema.sql');
const BATCH_SIZE = 5000; // Process 5,000 rows per batch

// --- DATA CLEANING HELPERS ---

function cleanCurrency(val) {
    if (!val || val === 'NA' || val === '' || val === 'null') return null;
    let clean = val.toString().replace(/€/g, '').replace(/ /g, '');
    let multiplier = 1;
    if (clean.toLowerCase().endsWith('m')) {
        multiplier = 1000000;
        clean = clean.slice(0, -1);
    } else if (clean.toLowerCase().endsWith('k')) {
        multiplier = 1000;
        clean = clean.slice(0, -1);
    } else if (clean.toLowerCase().endsWith('bn')) {
        multiplier = 1000000000;
        clean = clean.slice(0, -2);
    }
    const number = parseFloat(clean);
    return isNaN(number) ? null : Math.round(number * multiplier);
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

// --- BULK INSERT HELPER ---

async function insertBatch(tableName, columns, rows) {
    if (rows.length === 0) return;

    // Split into chunks to avoid "Packet too large" errors
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const chunk = rows.slice(i, i + BATCH_SIZE);
        // INSERT IGNORE skips rows that violate Foreign Keys or Unique Constraints
        const sql = `INSERT IGNORE INTO ${tableName} (${columns.join(',')}) VALUES ?`;
        
        try {
            await pool.query(sql, [chunk]);
            const progress = Math.min(i + BATCH_SIZE, rows.length);
            process.stdout.write(`   ... inserted ${progress} / ${rows.length} rows\r`);
        } catch (error) {
            console.error(`\n❌ Error in batch ${i} for ${tableName}:`, error.message);
            // We don't throw here to allow valid batches to proceed
        }
    }
    console.log(`   ✅ Finished loading ${rows.length} rows into ${tableName}`);
}

// --- DATA MAPPERS ---

const MAPPERS = {
    competitions: (row) => [
        row.competition_id, row.competition_code, row.name, row.sub_type, row.type,
        cleanInt(row.country_id), row.country_name, row.domestic_league_code,
        row.confederation, row.is_major_national_league === 'true', row.url
    ],
    clubs: (row) => [
        cleanInt(row.club_id), row.club_code, row.name, row.domestic_competition_id,
        cleanCurrency(row.total_market_value), 
        cleanInt(row.squad_size), cleanFloat(row.average_age),
        cleanInt(row.foreigners_number), cleanFloat(row.foreigners_percentage),
        cleanInt(row.national_team_players), row.stadium_name,
        cleanInt(row.stadium_seats), row.net_transfer_record,
        row.coach_name, cleanInt(row.last_season), row.url
    ],
    players: (row) => [
        cleanInt(row.player_id), row.first_name, row.last_name, row.name,
        cleanInt(row.last_season), cleanInt(row.current_club_id), row.player_code,
        row.country_of_birth, row.city_of_birth, row.country_of_citizenship,
        row.date_of_birth || null, row.sub_position, row.position, row.foot,
        cleanInt(row.height_in_cm), row.contract_expiration_date || null,
        row.agent_name, row.image_url, row.url,
        row.current_club_domestic_competition_id, row.current_club_name,
        cleanCurrency(row.market_value_in_eur),        
        cleanCurrency(row.highest_market_value_in_eur)
    ],
    games: (row) => [
        cleanInt(row.game_id), row.competition_id, cleanInt(row.season),
        row.round, row.date || null, cleanInt(row.home_club_id), cleanInt(row.away_club_id),
        cleanInt(row.home_club_goals), cleanInt(row.away_club_goals),
        cleanInt(row.home_club_position), cleanInt(row.away_club_position),
        row.home_club_manager_name, row.away_club_manager_name,
        row.stadium, cleanInt(row.attendance), row.referee, row.url,
        row.home_club_formation, row.away_club_formation,
        row.home_club_name, row.away_club_name, row.aggregate, row.competition_type
    ],
    appearances: (row) => [
        row.appearance_id, cleanInt(row.game_id), cleanInt(row.player_id),
        cleanInt(row.player_club_id), cleanInt(row.player_current_club_id),
        row.date || null, row.player_name, row.competition_id,
        cleanInt(row.yellow_cards), cleanInt(row.red_cards),
        cleanInt(row.goals), cleanInt(row.assists), cleanInt(row.minutes_played)
    ],
    transfers: (row) => [
        cleanInt(row.player_id), row.transfer_date || null, row.transfer_season,
        cleanInt(row.from_club_id), cleanInt(row.to_club_id),
        row.from_club_name, row.to_club_name,
        cleanCurrency(row.transfer_fee),
        cleanCurrency(row.market_value_in_eur),
        row.player_name
    ]
};

// --- MAIN LOGIC ---

async function rebuildSchema() {
    console.log('🏗️  Rebuilding Database Schema...');
    
    // Disable FK checks ONLY for the drop/create phase
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const tables = ['transfers', 'appearances', 'game_events', 'games', 'players', 'clubs', 'competitions'];
    for (const table of tables) {
        await pool.query(`DROP TABLE IF EXISTS ${table}`);
    }

    if (!fs.existsSync(SCHEMA_FILE)) throw new Error(`Schema file not found at ${SCHEMA_FILE}`);
    
    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
    const queries = schemaSql.split(';').filter(query => query.trim().length > 0);

    for (const query of queries) {
        if (query.trim()) await pool.query(query);
    }
    
    // Re-enable FK checks immediately so data loading is STRICT
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Schema created successfully!');
}

async function loadCSV(filename) {
    const filepath = path.join(DB_FOLDER, filename);
    if (!fs.existsSync(filepath)) {
        console.warn(`⚠️  File not found: ${filename}`);
        return [];
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    return parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });
}

async function loadFootballData() {
    try {
        console.log(`📂 DB Target: ${DB_FOLDER}`);
        console.log('🚀 STARTING FULL & FAST DATA LOAD...');
        console.log('   (Foreign Keys are ENFORCED. Invalid rows will be skipped.)\n');
        
        await rebuildSchema();

        // 1. Competitions
        console.log('📊 Processing Competitions...');
        const competitions = await loadCSV('competitions.csv');
        await insertBatch('competitions', 
            ['competition_id', 'competition_code', 'name', 'sub_type', 'type', 'country_id', 'country_name', 'domestic_league_code', 'confederation', 'is_major_national_league', 'url'], 
            competitions.map(MAPPERS.competitions)
        );

        // 2. Clubs
        console.log('📊 Processing Clubs...');
        const clubs = await loadCSV('clubs.csv');
        await insertBatch('clubs', 
            ['club_id', 'club_code', 'name', 'domestic_competition_id', 'total_market_value', 'squad_size', 'average_age', 'foreigners_number', 'foreigners_percentage', 'national_team_players', 'stadium_name', 'stadium_seats', 'net_transfer_record', 'coach_name', 'last_season', 'url'],
            clubs.map(MAPPERS.clubs)
        );

        // 3. Players
        console.log('📊 Processing Players...');
        const players = await loadCSV('players.csv');
        await insertBatch('players', 
            ['player_id', 'first_name', 'last_name', 'name', 'last_season', 'current_club_id', 'player_code', 'country_of_birth', 'city_of_birth', 'country_of_citizenship', 'date_of_birth', 'sub_position', 'position', 'foot', 'height_in_cm', 'contract_expiration_date', 'agent_name', 'image_url', 'url', 'current_club_domestic_competition_id', 'current_club_name', 'market_value_in_eur', 'highest_market_value_in_eur'],
            players.map(MAPPERS.players)
        );

        // 4. Games
        console.log('📊 Processing Games...');
        const games = await loadCSV('games.csv');
        await insertBatch('games',
            ['game_id', 'competition_id', 'season', 'round', 'date', 'home_club_id', 'away_club_id', 'home_club_goals', 'away_club_goals', 'home_club_position', 'away_club_position', 'home_club_manager_name', 'away_club_manager_name', 'stadium', 'attendance', 'referee', 'url', 'home_club_formation', 'away_club_formation', 'home_club_name', 'away_club_name', 'aggregate', 'competition_type'],
            games.map(MAPPERS.games)
        );

        // 5. Appearances
        console.log('📊 Processing Appearances...');
        const appearances = await loadCSV('appearances.csv');
        await insertBatch('appearances',
            ['appearance_id', 'game_id', 'player_id', 'player_club_id', 'player_current_club_id', 'date', 'player_name', 'competition_id', 'yellow_cards', 'red_cards', 'goals', 'assists', 'minutes_played'],
            appearances.map(MAPPERS.appearances)
        );

        // 6. Transfers
        console.log('📊 Processing Transfers...');
        const transfers = await loadCSV('transfers.csv');
        await insertBatch('transfers',
            ['player_id', 'transfer_date', 'transfer_season', 'from_club_id', 'to_club_id', 'from_club_name', 'to_club_name', 'transfer_fee', 'market_value_in_eur', 'player_name'],
            transfers.map(MAPPERS.transfers)
        );

        console.log('\n🎉 FULL Data Load Complete!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ CRITICAL ERROR:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    loadFootballData();
}

module.exports = { loadFootballData };
