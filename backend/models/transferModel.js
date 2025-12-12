const { pool } = require('../config/database');

// Get latest transfers (global)
const getLatestTransfers = async (limit = 20) => {
    // Join with Club names for better readability
    const query = `
        SELECT t.*, p.name as player_name, 
               c_from.name as from_club_name, 
               c_to.name as to_club_name
        FROM Transfers t
        JOIN Players p ON t.player_id = p.player_id
        LEFT JOIN Clubs c_from ON t.from_club_id = c_from.club_id
        LEFT JOIN Clubs c_to ON t.to_club_id = c_to.club_id
        ORDER BY t.transfer_date DESC
        LIMIT ?
    `;
    const [rows] = await pool.query(query, [limit]);
    return rows;
};

// Get transfer history for a specific player
const findByPlayerId = async (playerId) => {
    const [rows] = await pool.query('SELECT * FROM Transfers WHERE player_id = ? ORDER BY transfer_date DESC', [playerId]);
    return rows;
};

module.exports = { getLatestTransfers, findByPlayerId };