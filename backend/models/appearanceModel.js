const { pool } = require('../config/database');

// Get all stats/appearances for a specific game (e.g. for a Match Detail page)
const findByGameId = async (gameId) => {
    // We join with Players to get the name of the person who played
    const query = `
        SELECT a.*, p.name as player_name 
        FROM Appearances a
        JOIN Players p ON a.player_id = p.player_id
        WHERE a.game_id = ?
    `;
    const [rows] = await pool.query(query, [gameId]);
    return rows;
};

// Get all stats for a specific player (e.g. "Total goals this season")
const findByPlayerId = async (playerId) => {
    const [rows] = await pool.query('SELECT * FROM Appearances WHERE player_id = ?', [playerId]);
    return rows;
};

module.exports = { findByGameId, findByPlayerId };