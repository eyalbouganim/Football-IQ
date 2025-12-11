# Football-IQ ⚽

An interactive SQL learning game using real football data! Practice aggregation queries (GROUP BY, JOINs, HAVING) on a real database. Built as part of the Databases workshop.

---

## ⚠️ EYAL READ THIS FIRST ⚠️

**The CSV data files are NOT included in this repository!**

**You need to:**
1. **Get the CSV files from Gil** (via Google Drive, USB, or WhatsApp)
2. **Create a `db/` folder** in the project root
3. **Put ALL the CSV files inside the `db/` folder**
4. **Then run `npm run load-data`** in the backend folder to load them into SQLite

**Required CSV files:**
- `players.csv`
- `clubs.csv` 
- `games.csv`
- `competitions.csv`
- `appearances.csv`
- `transfers.csv`
- `game_events.csv`
- `player_valuations.csv`
- `club_games.csv`
- `game_lineups.csv`

**Without these files, the SQL challenges won't work!**

---

## Features

- 🎯 **15 SQL Challenges** - From easy GROUP BY to expert subqueries
- 📊 **Real Football Data** - 10,000+ players, 20,000+ games, transfers & more
- 💻 **Live Query Editor** - Write and execute SQL against real data
- 🏆 **Leaderboard** - Compete with other players
- 🎮 **Trivia Mode** - Football knowledge quiz
- 🔐 **User Authentication** - Track your progress

## Tech Stack

- **Backend:** Node.js, Express.js, SQLite, Sequelize, JWT
- **Frontend:** React 19, Ant Design, React Router
- **Security:** Helmet, CORS, Rate Limiting, bcrypt

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/eyalbouganim/Football-IQ.git
cd Football-IQ

# Install backend
cd backend
npm install

# Install frontend
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
- `game_events.csv`
- `player_valuations.csv`
- `club_games.csv`
- `game_lineups.csv`

Data source: [Transfermarkt Football Data](https://www.kaggle.com/datasets/davidcariboo/player-scores) or ask your team member for the files.

### 3. Setup Database

```bash
cd backend

# Create .env file
echo "NODE_ENV=development
PORT=3001
DB_DIALECT=sqlite
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000" > .env

# Seed user database
npm run seed

# Load football data from CSVs
npm run load-data
```

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

**Demo Account:** `demo` / `Demo@123!`

## SQL Challenges

Practice these SQL concepts with real football data:

| Difficulty | Topics |
|------------|--------|
| Easy | GROUP BY, COUNT, ORDER BY |
| Medium | HAVING, SUM, AVG, multiple aggregates |
| Hard | JOINs with GROUP BY, multi-table queries |
| Expert | Subqueries, CASE statements, window-like queries |

**Example Challenge:**
> Find players who scored more than 10 goals. Show player name and total goals.

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
│   ├── config/          # Database & app config
│   ├── controllers/     # API logic
│   ├── data/            # SQL challenges
│   ├── middleware/      # Auth, validation
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── scripts/         # Seed & data loader
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/  # React components
│       ├── context/     # Auth context
│       └── services/    # API client
├── db/                  # CSV files (gitignored)
└── README.md
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Register user |
| `POST /api/auth/login` | Login |
| `GET /api/sql/challenges` | Get SQL challenges |
| `POST /api/sql/execute` | Run SQL query |
| `POST /api/sql/challenges/:id/submit` | Submit answer |
| `GET /api/sql/schema` | Get database schema |
| `GET /api/sql/leaderboard` | Leaderboard |

## Database Schema

```
players: player_id, name, country_of_citizenship, position, market_value_in_eur, current_club_id
clubs: club_id, name, stadium_name, squad_size, average_age
games: game_id, home_club_id, away_club_id, home_club_goals, away_club_goals, attendance, season
appearances: player_id, game_id, goals, assists, yellow_cards, red_cards, minutes_played
transfers: player_id, from_club_id, to_club_id, transfer_fee, transfer_date
competitions: competition_id, name, country_name, type
```

## Team

Built for the Databases Workshop

## License

MIT
