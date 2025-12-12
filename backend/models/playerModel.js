const { pool } = require('../config/database');

// Get all players (limit to 100 to avoid crashing frontend with thousands of rows)
const findAll = async (limit = 100) => {
    const [rows] = await pool.query('SELECT * FROM Players LIMIT ?', [limit]);
    return rows;
};

// Get a single player
const findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM Players WHERE player_id = ?', [id]);
    return rows[0];
};

// Get all players belonging to a specific club
const findByClubId = async (clubId) => {
    const [rows] = await pool.query('SELECT * FROM Players WHERE current_club_id = ?', [clubId]);
    return rows;
};

// Search players by name (useful for a search bar)
const searchByName = async (name) => {
    const searchTerm = `%${name}%`;
    const [rows] = await pool.query('SELECT * FROM Players WHERE name LIKE ? LIMIT 20', [searchTerm]);
    return rows;
};

module.exports = { findAll, findById, findByClubId, searchByName };