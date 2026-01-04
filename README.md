npm install
```

### 2. Download Football Data (REQUIRED)

⚠️ **CSV files are not included in the repo.** Download them and place in `db/` folder:

**Required CSV files:**
* `players.csv`
* `clubs.csv`
* `games.csv`
* `competitions.csv`
* `appearances.csv`
* `transfers.csv`

**Data source:** Transfermarkt Football Data or ask your team member for the files.

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

* **App:** http://localhost:3000
* **API:** http://localhost:3001
* **Demo Account:** `demo` / `Demo@123!`

## Performance & Optimization

To ensure the application runs smoothly with over 50,000+ records, we implemented strategic B-Tree Indexes in MySQL.

**Why we chose these indexes:**

### 1. Games & Seasons
* **Index:** `idx_games_date` on `games(date)`
* **Index:** `idx_games_competition_season` on `games(competition_id, season)`
* **Reasoning:** The "Match Feed" and "Results" pages heavily utilize `ORDER BY date DESC`. Without an index, the database would perform a "filesort" (sorting in memory) on 20,000+ rows every time the page loads. The compound index on Competition+Season allows instant filtering for specific league tables.

### 2. Player Search & Filtering
* **Index:** `idx_players_name` on `players(name)`
* **Index:** `idx_players_current_club` on `players(current_club_id)`
* **Reasoning:** The search bar uses `LIKE` queries. While standard B-Trees have limits with wildcards, this index optimizes exact matches and prefix searches. The Club index allows the "Squad View" to load instantly by jumping directly to players belonging to a specific `club_id`.

### 3. Deep Statistical Joins (Appearances)
* **Index:** `idx_appearances_game` on `appearances(game_id)`
* **Index:** `idx_appearances_player` on `appearances(player_id)`
* **Reasoning:** This is the most critical optimization. Calculating "Top Scorers" or "Match Lineups" requires joining the `appearances` table (containing player stats for every match) with `players` and `games`. These Foreign Key indexes allow MySQL to perform fast lookups (EqRef) instead of full table scans (All) during JOIN operations.

### 4. Leaderboards
* **Index:** `idx_users_total_score` on `users(total_score)`
* **Reasoning:** The leaderboard needs to show the top 10 players sorted by score. This index allows the database to retrieve the top 10 pointers immediately without sorting the entire user base.

## SQL Challenges

Practice these SQL concepts with real football data:

| Difficulty | Topics |
|------------|--------|
| **Easy** | GROUP BY, COUNT, ORDER BY |
| **Medium** | HAVING, SUM, AVG, multiple aggregates |
| **Hard** | JOINs with GROUP BY, multi-table queries |
| **Expert** | Subqueries, CASE statements, window-like queries |

### Example Challenge:
**Find players who scored more than 10 goals. Show player name and total goals.**

```sql
SELECT player_name, SUM(goals) as total_goals 
FROM appearances 
GROUP BY player_id, player_name 
HAVING SUM(goals) > 10
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
* **users:** Authentication & scores
* **questions:** Trivia questions
* **game_sessions:** Tracks user game history
* **game_answers:** Tracks individual answers

### Football Data:
* **players:** player_id, name, position, market_value
* **clubs:** club_id, name, stadium_name
* **games:** game_id, scores, date, season
* **appearances:** stats (goals, cards) linking players to games
* **transfers:** transfer history and fees
* **competitions:** league metadata

## Team
Built for the Databases Workshop
