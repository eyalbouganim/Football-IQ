const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
    constructor(id, username, email, password, favoriteTeam, totalScore, gamesPlayed, highestScore, isActive) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.favoriteTeam = favoriteTeam;
        this.totalScore = totalScore;
        this.gamesPlayed = gamesPlayed;
        this.highestScore = highestScore;
        this.isActive = isActive;
    }

    // Helper to map JS fields to DB columns
    static toSnakeCase(str) {
        const map = {
            favoriteTeam: 'favorite_team',
            totalScore: 'total_score',
            gamesPlayed: 'games_played',
            highestScore: 'highest_score',
            isActive: 'is_active',
            userId: 'id'
        };
        return map[str] || str;
    }

    async validatePassword(password) {
        return bcrypt.compare(password, this.password);
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            favoriteTeam: this.favoriteTeam,
            totalScore: this.totalScore,
            gamesPlayed: this.gamesPlayed,
            highestScore: this.highestScore,
            isActive: this.isActive,
        };
    }

    static async create(userData) {
        const { username, email, password, favoriteTeam } = userData;
        const hashedPassword = await bcrypt.hash(password, 12);
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password, favorite_team) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, favoriteTeam]
        );
        return new User(result.insertId, username, email, hashedPassword, favoriteTeam, 0, 0, 0, true);
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        const u = rows[0];
        return new User(u.id, u.username, u.email, u.password, u.favorite_team, u.total_score, u.games_played, u.highest_score, u.is_active);
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return null;
        const u = rows[0];
        return new User(u.id, u.username, u.email, u.password, u.favorite_team, u.total_score, u.games_played, u.highest_score, u.is_active);
    }

    static async findByUsername(username) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return null;
        const u = rows[0];
        return new User(u.id, u.username, u.email, u.password, u.favorite_team, u.total_score, u.games_played, u.highest_score, u.is_active);
    }

    static async update(id, updateData) {
        const fields = [];
        const values = [];
        
        for (const key in updateData) {
            if (key === 'password') {
                const hashedPassword = await bcrypt.hash(updateData[key], 12);
                fields.push('password = ?');
                values.push(hashedPassword);
            } else {
                // FIXED: Automatically convert camelCase key to snake_case column
                const dbCol = User.toSnakeCase(key);
                fields.push(`${dbCol} = ?`);
                values.push(updateData[key]);
            }
        }

        if (fields.length === 0) return User.findById(id);

        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        values.push(id);

        await pool.execute(sql, values);
        return User.findById(id);
    }

    static async findAll({ where = {}, order = [], limit = null }) {
        const whereClauses = [];
        const whereValues = [];
        
        for (const key in where) {
            // Map query keys (gamesPlayed) to DB columns (games_played)
            const dbCol = User.toSnakeCase(key);
            let value = where[key];
            
            // Handle special operators like { '[Op.gt]': 0 }
            if (typeof value === 'object' && value !== null && '[Op.gt]' in value) {
                whereClauses.push(`${dbCol} > ?`);
                whereValues.push(value['[Op.gt]']);
            } else {
                // Convert booleans to 1/0 for MySQL
                if (typeof value === 'boolean') {
                    value = value ? 1 : 0;
                }
                whereClauses.push(`${dbCol} = ?`);
                whereValues.push(value);
            }
        }
        
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        // Handle order mapping (e.g. [['highestScore', 'DESC']])
        const orderString = order.length > 0 
            ? `ORDER BY ${order.map(o => `${User.toSnakeCase(o[0])} ${o[1]}`).join(', ')}` 
            : '';
            
        const limitString = limit ? `LIMIT ${parseInt(limit)}` : '';

        const sql = `SELECT * FROM users ${whereString} ${orderString} ${limitString}`;
        const [rows] = await pool.execute(sql, whereValues);
        
        return rows.map(u => new User(u.id, u.username, u.email, u.password, u.favorite_team, u.total_score, u.games_played, u.highest_score, u.is_active));
    }
}

module.exports = User;


