# Football-IQ ⚽

An interactive SQL learning game using real football data! Practice complex SQL queries, with techniques like aggregation (GROUP BY, JOINs, HAVING) on a real MySQL database. Built as part of the Databases workshop.

---

## ⚠️ DATA SETUP REQUIRED ⚠️

**The CSV data files are NOT included in this repository!**

**You need to:**
1. **Create a `db/` folder** in the project root.
2. **Put ALL the CSV files inside the `db/` folder.**
3. **Configure your MySQL connection** in `.env`.
4. **Run `npm run setup`** to initialize the database and load data.

**Required CSV files:**
- `players.csv`
- `clubs.csv`
- `games.csv`
- `competitions.csv`
- `appearances.csv`
- `transfers.csv`

**Without these files, the SQL challenges won't work!**

---

## Features

- 🎯 **40 SQL Challenges** - 25 quiz challenges + 15 query challenges
- 🇺🇸 **SQL Quiz Mode** - American-style multiple choice with real SQL queries
- ✍️ **SQL Challenge Mode** - Write and execute your own SQL queries
- 📊 **Real Football Data** - 25,000+ players, 20,000+ games, transfers & more
- ⚡ **Optimized Performance** - Indexed MySQL database for fast complex queries
- 💻 **Live Query Editor** - Write and execute SQL against real data with sandbox protection
- 🏆 **Leaderboard** - Compete with other players
- 🔐 **User Authentication** - Track your progress with JWT

## Tech Stack

- **Backend:** Node.js, Express.js, MySQL (mysql2 driver)
- **Frontend:** React 19, Ant Design, React Router
- **Database:** MySQL 8.0+ with raw SQL implementation
- **Security:** Helmet, CORS, Rate Limiting, bcrypt

## Quick Start

### 1. Clone & Install

```bash
git clone [https://github.com/eyalbouganim/Football-IQ.git](https://github.com/eyalbouganim/Football-IQ.git)
cd Football-IQ

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Download Football Data (REQUIRED)

⚠️ **CSV files are not included in the repo.** Download them and place in `db/` folder:

**Required CSV files:**
- `players.csv`
- `clubs.csv`
- `games.csv`
- `competitions.csv`
- `appearances.csv`
- `transfers.csv`

**Data source:** Transfermarkt Football Data or ask your team member for the files.
**Link:** [https://www.kaggle.com/datasets/davidcariboo/player-scores]

### 3. Setup Database

**Prerequisite:** You must have MySQL Server installed and running.

#### Step A: Configure Environment
Create a `.env` file in the `backend` folder:

```bash
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=football_iq
JWT_SECRET=your_super_secret_key
FRONTEND_URL=http://localhost:3000
```

#### Step B: Initialize & Load Data
Run the setup script. This will:
1. Create the schema (Users, Questions, Game Sessions).
2. Load all CSV data into the Football tables.
3. Apply performance indexes.

```bash
cd backend
npm run setup
```
*(Note: This runs `npm run seed` and `npm run load-data` in sequence)*

### 4. Run the App

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 5. Open in Browser
- **App:** http://localhost:3000
- **API:** http://localhost:3001
- **Demo Account:** `demo` / `Demo@123!`

## Performance & Optimization

To ensure the application runs smoothly with over 100,000+ records, we implemented strategic B-Tree Indexes in MySQL.

**Why we chose these indexes:**

### 1. Games & Seasons
- **Index:** `idx_games_date` on `games(date)`
- **Index:** `idx_games_competition_season` on `games(competition_id, season)`
- **Reasoning:** The "Match Feed" and "Results" pages heavily utilize `ORDER BY date DESC`. Without an index, the database would perform a "filesort" (sorting in memory) on 20,000+ rows every time the page loads. The compound index on Competition+Season allows instant filtering for specific league tables.

### 2. Player Search & Filtering
- **Index:** `idx_players_name` on `players(name)`
- **Index:** `idx_players_current_club` on `players(current_club_id)`
- **Reasoning:** The search bar uses `LIKE` queries. While standard B-Trees have limits with wildcards, this index optimizes exact matches and prefix searches. The Club index allows the "Squad View" to load instantly by jumping directly to players belonging to a specific `club_id`.

### 3. Deep Statistical Joins (Appearances)
- **Index:** `idx_appearances_game` on `appearances(game_id)`
- **Index:** `idx_appearances_player` on `appearances(player_id)`
- **Reasoning:** This is the most critical optimization. Calculating "Top Scorers" or "Match Lineups" requires joining the `appearances` table (containing player stats for every match) with `players` and `games`. These Foreign Key indexes allow MySQL to perform fast lookups (EqRef) instead of full table scans (All) during JOIN operations.

### 4. Leaderboards
- **Index:** `idx_users_total_score` on `users(total_score)`
- **Reasoning:** The leaderboard needs to show the top 10 players sorted by score. This index allows the database to retrieve the top 10 pointers immediately without sorting the entire user base.

## SQL Challenges

The game offers two distinct modes to test your SQL skills:

### 🇺🇸 SQL Quiz Mode (25 Challenges)
American-style multiple choice questions! Each challenge shows:
- A football-related question
- The SQL query that answers it
- Four answer options (A, B, C, D)

The query runs against the live database, and you pick the correct answer. Perfect for learning SQL syntax and understanding query results!

### ✍️ SQL Challenge Mode (15 Challenges)
Write your own SQL queries to solve real problems:
- Read the challenge description
- Write a SELECT query
- Test your query with limited runs
- Submit for validation

Practice these SQL concepts with real football data:

| Difficulty | Topics | Points |
|------------|--------|---------|
| **Basic** | GROUP BY, COUNT, ORDER BY, WHERE | 10 pts |
| **Medium** | HAVING, SUM, AVG, multiple aggregates, UNION | 25 pts |
| **Hard** | JOINs with GROUP BY, multi-table queries, subqueries, CASE | 50 pts |

### Example Challenge:
**Find players who scored more than 50 career goals. Show player name and total goals.**

```sql
SELECT player_name, SUM(goals) as total_goals
FROM appearances
GROUP BY player_id, player_name
HAVING total_goals > 50
ORDER BY total_goals DESC
```

## Project Structure

```
Football-IQ/
├── backend/
│   ├── config/          # MySQL Connection
│   ├── controllers/     # API logic
│   ├── models/          # Raw SQL Models
│   ├── routes/          # API routes
│   ├── schema.sql       # Football Data Schema & Indexes
│   ├── scripts/         # CSV Loader & Seeder
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/  # React components
│       └── services/    # API client
├── db/                  # CSV files (gitignored)
└── README.md
```

## Database Schema

### Game System:
- **users:** Authentication & scores
- **questions:** Trivia questions
- **game_sessions:** Tracks user game history
- **game_answers:** Tracks individual answers

### Football Data:
- **players:** player_id, name, position, market_value
- **clubs:** club_id, name, stadium_name
- **games:** game_id, scores, date, season
- **appearances:** stats (goals, cards) linking players to games
- **transfers:** transfer history and fees
- **competitions:** league metadata

## Team
Built for the Databases Workshop
