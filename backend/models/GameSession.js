const { pool } = require('../config/database');

class GameSession {
    constructor(id, userId, score, totalQuestions, correctAnswers, difficulty, status, startedAt, completedAt, timeSpentSeconds) {
        this.id = id;
        this.userId = userId;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.difficulty = difficulty;
        this.status = status;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.timeSpentSeconds = timeSpentSeconds;
    }

    static async create(sessionData) {
        const { userId, difficulty, totalQuestions } = sessionData;
        const [result] = await pool.execute(
            'INSERT INTO game_sessions (user_id, difficulty, total_questions) VALUES (?, ?, ?)',
            [userId, difficulty, totalQuestions]
        );
        return new GameSession(result.insertId, userId, 0, totalQuestions, 0, difficulty, 'in_progress', new Date());
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM game_sessions WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        const s = rows[0];
        return new GameSession(s.id, s.user_id, s.score, s.total_questions, s.correct_answers, s.difficulty, s.status, s.started_at, s.completed_at, s.time_spent_seconds);
    }

    static async findOne({ where }) {
        const whereClauses = [];
        const whereValues = [];
        for (const key in where) {
            whereClauses.push(`${key} = ?`);
            whereValues.push(where[key]);
        }
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const [rows] = await pool.execute(`SELECT * FROM game_sessions ${whereString} LIMIT 1`, whereValues);
        if (rows.length === 0) return null;
        const s = rows[0];
        return new GameSession(s.id, s.user_id, s.score, s.total_questions, s.correct_answers, s.difficulty, s.status, s.started_at, s.completed_at, s.time_spent_seconds);
    }

    static async update(id, updateData) {
        const fields = [];
        const values = [];
        for (const key in updateData) {
            fields.push(`${key} = ?`);
            values.push(updateData[key]);
        }
        if (fields.length === 0) return GameSession.findById(id);

        const sql = `UPDATE game_sessions SET ${fields.join(', ')} WHERE id = ?`;
        values.push(id);

        await pool.execute(sql, values);
        return GameSession.findById(id);
    }

    static async findAll({ where = {}, include = [], order = [], limit = null }) {
        // This is a simplified version and does not support includes.
        // Includes will need to be handled manually in the controller.
        const whereClauses = [];
        const whereValues = [];
        for (const key in where) {
            if (key === 'completedAt') {
                whereClauses.push('completed_at >= ?');
                whereValues.push(where[key]['[Op.gte]']);
            } else {
                whereClauses.push(`${key} = ?`);
                whereValues.push(where[key]);
            }
        }
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const orderString = order.length > 0 ? `ORDER BY ${order.map(o => `${o[0]} ${o[1]}`).join(', ')}` : '';
        const limitString = limit ? 'LIMIT ?' : '';
        const limitValue = limit ? [limit] : [];

        const sql = `SELECT * FROM game_sessions ${whereString} ${orderString} ${limitString}`;
        const [rows] = await pool.execute(sql, [...whereValues, ...limitValue]);
        return rows.map(s => new GameSession(s.id, s.user_id, s.score, s.total_questions, s.correct_answers, s.difficulty, s.status, s.started_at, s.completed_at, s.time_spent_seconds));
    }
}

module.exports = GameSession;

