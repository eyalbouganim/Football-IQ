const { pool } = require('../config/database');

class GameAnswer {
    constructor(id, sessionId, questionId, userAnswer, isCorrect, pointsEarned, timeSpentSeconds) {
        this.id = id;
        this.sessionId = sessionId;
        this.questionId = questionId;
        this.userAnswer = userAnswer;
        this.isCorrect = isCorrect;
        this.pointsEarned = pointsEarned;
        this.timeSpentSeconds = timeSpentSeconds;
    }

    static async create(answerData) {
        const { sessionId, questionId, userAnswer, isCorrect, pointsEarned, timeSpentSeconds } = answerData;
        const [result] = await pool.execute(
            'INSERT INTO game_answers (session_id, question_id, user_answer, is_correct, points_earned, time_spent_seconds) VALUES (?, ?, ?, ?, ?, ?)',
            [sessionId, questionId, userAnswer, isCorrect, pointsEarned, timeSpentSeconds]
        );
        return new GameAnswer(result.insertId, sessionId, questionId, userAnswer, isCorrect, pointsEarned, timeSpentSeconds);
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM game_answers WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        const a = rows[0];
        return new GameAnswer(a.id, a.session_id, a.question_id, a.user_answer, a.is_correct, a.points_earned, a.time_spent_seconds);
    }

    static async findOne({ where }) {
        const whereClauses = [];
        const whereValues = [];
        for (const key in where) {
            whereClauses.push(`${key} = ?`);
            whereValues.push(where[key]);
        }
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const [rows] = await pool.execute(`SELECT * FROM game_answers ${whereString} LIMIT 1`, whereValues);
        if (rows.length === 0) return null;
        const a = rows[0];
        return new GameAnswer(a.id, a.session_id, a.question_id, a.user_answer, a.is_correct, a.points_earned, a.time_spent_seconds);
    }
}

module.exports = GameAnswer;
