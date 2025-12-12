// models/clubModel.js
const { pool } = require('../config/database');

const findAll = async () => {
    const [rows] = await pool.query('SELECT * FROM Clubs');
    return rows; // Returns raw JSON objects, which is fine!
};

const findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM Clubs WHERE club_id = ?', [id]);
    return rows[0];
};

module.exports = { findAll, findById };