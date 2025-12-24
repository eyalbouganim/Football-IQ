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

    // Map JS to DB
    static toSnakeCase(str) {
        const map = {
            userId: 'user_id',
            totalQuestions: 'total_questions',
            correctAnswers: 'correct_answers',
            startedAt: 'started_at',
            completedAt: 'completed_at',
            timeSpentSeconds: 'time_spent_seconds',
            difficulty: 'difficulty',
            status: 'status',
            score: 'score'
        };
        return map[str] || str;
    }

    static async create({ userId, difficulty, totalQuestions }) {
        const [result] = await pool.execute(
            `INSERT INTO game_sessions (user_id, difficulty, total_questions, status, score, correct_answers) 
             VALUES (?, ?, ?, 'in_progress', 0, 0)`,
            [userId, difficulty, totalQuestions]
        );
        return GameSession.findById(result.insertId);
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM game_sessions WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        const s = rows[0];
        return new GameSession(s.id, s.user_id, s.score, s.total_questions, s.correct_answers, s.difficulty, s.status, s.started_at, s.completed_at, s.time_spent_seconds);
    }

    static async findOne({ where = {} }) {
        const clauses = [];
        const values = [];
        for (const [key, val] of Object.entries(where)) {
            clauses.push(`${GameSession.toSnakeCase(key)} = ?`);
            values.push(val);
        }
        
        const sql = `SELECT * FROM game_sessions WHERE ${clauses.join(' AND ')} LIMIT 1`;
        const [rows] = await pool.execute(sql, values);
        
        if (rows.length === 0) return null;
        const s = rows[0];
        return new GameSession(s.id, s.user_id, s.score, s.total_questions, s.correct_answers, s.difficulty, s.status, s.started_at, s.completed_at, s.time_spent_seconds);
    }

    static async update(id, data) {
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(data)) {
            fields.push(`${GameSession.toSnakeCase(key)} = ?`);
            values.push(value);
        }

        if (fields.length === 0) return GameSession.findById(id);

        values.push(id);
        await pool.execute(`UPDATE game_sessions SET ${fields.join(', ')} WHERE id = ?`, values);
        return GameSession.findById(id);
    }
    
    // For Leaderboard (Raw output is fine here since it's an aggregation)
    static async findAll({ where = {}, order = [], limit = 10 }) {
        const whereClauses = [];
        const whereValues = [];

        for (const key in where) {
            const dbCol = GameSession.toSnakeCase(key);
            // Handle date range operator manually
            if (typeof where[key] === 'object' && where[key]['[Op.gte]']) {
                whereClauses.push(`${dbCol} >= ?`);
                whereValues.push(where[key]['[Op.gte]']);
            } else {
                whereClauses.push(`${dbCol} = ?`);
                whereValues.push(where[key]);
            }
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const orderString = order.length > 0 ? `ORDER BY ${order.map(o => `${GameSession.toSnakeCase(o[0])} ${o[1]}`).join(', ')}` : '';

        const sql = `SELECT * FROM game_sessions ${whereString} ${orderString} LIMIT ?`;
        const [rows] = await pool.execute(sql, [...whereValues, parseInt(limit)]);

        return rows.map(s => new GameSession(s.id, s.user_id, s.score, s.total_questions, s.correct_answers, s.difficulty, s.status, s.started_at, s.completed_at, s.time_spent_seconds));
    }
}



