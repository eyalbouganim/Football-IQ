const { pool } = require('../config/database');

class Question {
    constructor(id, question, options, correctAnswer, difficulty, category, points, explanation, sqlQuery, isActive, timesAnswered, timesCorrect) {
        this.id = id;
        this.question = question;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.difficulty = difficulty;
        this.category = category;
        this.points = points;
        this.explanation = explanation;
        this.sqlQuery = sqlQuery;
        this.isActive = isActive;
        this.timesAnswered = timesAnswered;
        this.timesCorrect = timesCorrect;
    }

    // Helper: Convert "isActive" -> "is_active" for DB queries
    static toSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    static async create(questionData) {
        const { question, options, correctAnswer, difficulty, category, points, explanation, sqlQuery } = questionData;
        const [result] = await pool.execute(
            'INSERT INTO questions (question, options, correct_answer, difficulty, category, points, explanation, sql_query) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [question, JSON.stringify(options), correctAnswer, difficulty, category, points, explanation, sqlQuery]
        );
        return new Question(result.insertId, question, options, correctAnswer, difficulty, category, points, explanation, sqlQuery, true, 0, 0);
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM questions WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        const q = rows[0];
        // Note: we read snake_case from DB and pass to constructor
        return new Question(q.id, q.question, JSON.parse(q.options), q.correct_answer, q.difficulty, q.category, q.points, q.explanation, q.sql_query, q.is_active, q.times_answered, q.times_correct);
    }

    static async getAll() {
        const [rows] = await pool.execute('SELECT * FROM questions');
        return rows.map(q => new Question(q.id, q.question, JSON.parse(q.options), q.correct_answer, q.difficulty, q.category, q.points, q.explanation, q.sql_query, q.is_active, q.times_answered, q.times_correct));
    }

    static async findAndCountAll({ where = {}, limit = 20, offset = 0, order = [['createdAt', 'DESC']] }) {
        const whereClauses = [];
        const whereValues = [];
        
        // FIX: Convert keys like 'isActive' to 'is_active'
        for (const key in where) {
            const dbKey = Question.toSnakeCase(key);
            whereClauses.push(`${dbKey} = ?`);
            whereValues.push(where[key]);
        }
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // FIX: Ensure order keys are also safe (though usually createdAt is fine)
        const orderString = order.map(o => `${o[0]} ${o[1]}`).join(', ');

        const countSql = `SELECT COUNT(*) as count FROM questions ${whereString}`;
        const [countRows] = await pool.execute(countSql, whereValues);
        const count = countRows[0].count;

        const sql = `SELECT * FROM questions ${whereString} ORDER BY ${orderString} LIMIT ? OFFSET ?`;
        const [rows] = await pool.execute(sql, [...whereValues, limit, offset]);

        const questions = rows.map(q => new Question(q.id, q.question, JSON.parse(q.options), q.correct_answer, q.difficulty, q.category, q.points, q.explanation, q.sql_query, q.is_active, q.times_answered, q.times_correct));
        return { rows: questions, count };
    }

    static async getCategories() {
        // FIX: 'isActive' -> 'is_active'
        const [rows] = await pool.execute('SELECT DISTINCT category FROM questions WHERE is_active = true');
        return rows.map(r => r.category);
    }

    static async findAll({ where = {}, order = null, limit = null }) {
        const whereClauses = [];
        const whereValues = [];
        
        // FIX: Convert keys like 'difficulty' (ok) or 'isActive' (needs fix)
        for (const key in where) {
            const dbKey = Question.toSnakeCase(key);
            whereClauses.push(`${dbKey} = ?`);
            whereValues.push(where[key]);
        }
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        let orderString = '';
        if (order === 'random') {
            orderString = 'ORDER BY RAND()';
        } else if (order && order.length > 0) {
            orderString = `ORDER BY ${order.map(o => `${o[0]} ${o[1]}`).join(', ')}`;
        }
        
        const limitString = limit ? 'LIMIT ?' : '';
        const limitValue = limit ? [limit] : [];

        const sql = `SELECT * FROM questions ${whereString} ${orderString} ${limitString}`;
        const [rows] = await pool.execute(sql, [...whereValues, ...limitValue]);
        return rows.map(q => new Question(q.id, q.question, JSON.parse(q.options), q.correct_answer, q.difficulty, q.category, q.points, q.explanation, q.sql_query, q.is_active, q.times_answered, q.times_correct));
    }

    // New helper: Find random questions for the game
    static async findRandom(limit = 10, difficulty = 'medium') {
        let query = 'SELECT * FROM questions WHERE is_active = true';
        const params = [];

        if (difficulty !== 'mixed') {
            query += ' AND difficulty = ?';
            params.push(difficulty);
        }

        query += ' ORDER BY RAND() LIMIT ?';
        params.push(limit);

        const [rows] = await pool.execute(query, params);
        return rows.map(q => new Question(q.id, q.question, JSON.parse(q.options), q.correct_answer, q.difficulty, q.category, q.points, q.explanation, q.sql_query, q.is_active, q.times_answered, q.times_correct));
    }

    static async update(id, updateData) {
        const fields = [];
        const values = [];
        
        // FIX: Map updates to DB column names
        for (const key in updateData) {
            const dbKey = Question.toSnakeCase(key);
            fields.push(`${dbKey} = ?`);
            values.push(updateData[key]);
        }
        
        if (fields.length === 0) return Question.findById(id);

        const sql = `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`;
        values.push(id);

        await pool.execute(sql, values);
        return Question.findById(id);
    }
}

module.exports = Question;


