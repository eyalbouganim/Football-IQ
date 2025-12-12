const { pool } = require('../config/database');

const findAll = async () => {
    const [rows] = await pool.query('SELECT * FROM Competitions');
    return rows;
};

const findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM Competitions WHERE competition_id = ?', [id]);
    return rows[0];
};

module.exports = { findAll, findById };