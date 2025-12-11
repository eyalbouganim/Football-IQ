# Football-IQ ⚽

An interactive trivia game to test your knowledge about football with SQL-themed questions! Built as part of the Databases workshop.

## Features

- 🎮 **Interactive Quiz Game** - Test your football knowledge across multiple difficulty levels
- 🏆 **Leaderboard** - Compete with other players and track your rankings
- 📊 **Statistics** - Track your progress, high scores, and game history
- 🔐 **User Authentication** - Secure registration and login system
- 💾 **Persistent Data** - PostgreSQL database for reliable data storage
- 🎯 **SQL Questions** - Expert mode includes SQL-themed football questions

## Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API server
- **PostgreSQL** - Relational database
- **Sequelize** - ORM for database operations
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Helmet** - Security headers
- **Rate Limiting** - API protection

### Frontend
- **React 19** - UI framework
- **Ant Design** - Component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Football-IQ
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE football_iq;
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=football_iq
# DB_USER=postgres
# DB_PASSWORD=your_password
# JWT_SECRET=your_secret_key

# Seed the database with questions
npm run seed

# Start the server
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## Demo Account

After seeding the database, you can use:
- **Username:** demo
- **Password:** Demo@123!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Game
- `POST /api/game/start` - Start new game session (protected)
- `POST /api/game/:sessionId/answer` - Submit answer (protected)
- `POST /api/game/:sessionId/end` - End game session (protected)
- `GET /api/game/stats` - Get user statistics (protected)
- `GET /api/game/leaderboard` - Get leaderboard

### Questions
- `GET /api/questions` - Get questions list
- `GET /api/questions/categories` - Get available categories
- `GET /api/questions/difficulties` - Get difficulty levels

### Health
- `GET /api/health` - Health check with database status
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

## Project Structure

```
Football-IQ/
├── backend/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Sequelize models
│   ├── routes/           # API routes
│   ├── scripts/          # Database seeds
│   └── server.js         # Entry point
├── frontend/
│   ├── public/           # Static files
│   └── src/
│       ├── components/   # React components
│       ├── context/      # React context
│       ├── services/     # API services
│       └── App.js        # Main component
└── README.md
```

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=football_iq
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=http://localhost:3000
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use strong JWT_SECRET
3. Configure production database
4. Set up proper rate limiting
5. Enable HTTPS

### Frontend
1. Build production bundle: `npm run build`
2. Serve static files via CDN or web server
3. Configure environment variables

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
