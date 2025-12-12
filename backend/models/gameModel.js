const { pool } = require('../config/database');

const findAll = async (limit = 50) => {
    // Ordering by date usually makes sense for games
    const [rows] = await pool.query('SELECT * FROM Games ORDER BY date DESC LIMIT ?', [limit]);
    return rows;
};

const findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM Games WHERE game_id = ?', [id]);
    return rows[0];
};

// Get all games for a specific club (both Home and Away games)
const findByClubId = async (clubId) => {
    const query = `
        SELECT * FROM Games 
        WHERE home_club_id = ? OR away_club_id = ? 
        ORDER BY date DESC
    `;
    const [rows] = await pool.query(query, [clubId, clubId]);
    return rows;
};

// Get games by season and competition
const findBySeason = async (competitionId, season) => {
    const [rows] = await pool.query(
        'SELECT * FROM Games WHERE competition_id = ? AND season = ?', 
        [competitionId, season]
    );
    return rows;
};

module.exports = { findAll, findById, findByClubId, findBySeason };