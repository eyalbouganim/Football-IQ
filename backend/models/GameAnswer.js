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

    static toSnakeCase(str) {
        const map = {
            sessionId: 'session_id',
            questionId: 'question_id',
            userAnswer: 'user_answer',
            isCorrect: 'is_correct',
            pointsEarned: 'points_earned',
            timeSpentSeconds: 'time_spent_seconds'
        };
        return map[str] || str;
    }

    static async create(data) {
        const { sessionId, questionId, userAnswer, isCorrect, pointsEarned, timeSpentSeconds } = data;
        const [result] = await pool.execute(
            `INSERT INTO game_answers (session_id, question_id, user_answer, is_correct, points_earned, time_spent_seconds) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sessionId, questionId, userAnswer, isCorrect, pointsEarned, timeSpentSeconds]
        );
        return new GameAnswer(result.insertId, sessionId, questionId, userAnswer, isCorrect, pointsEarned, timeSpentSeconds);
    }
    
    static async findOne({ where = {} }) {
        const clauses = [];
        const values = [];
        for (const [key, val] of Object.entries(where)) {
            clauses.push(`${GameAnswer.toSnakeCase(key)} = ?`);
            values.push(val);
        }
        
        const sql = `SELECT * FROM game_answers WHERE ${clauses.join(' AND ')} LIMIT 1`;
        const [rows] = await pool.execute(sql, values);
        
        if (rows.length === 0) return null;
        const a = rows[0];
        return new GameAnswer(a.id, a.session_id, a.question_id, a.user_answer, a.is_correct, a.points_earned, a.time_spent_seconds);
    }
}



