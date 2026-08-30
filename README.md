# Civic-Raid

A gamified civic engagement API built with **Node.js/Express** and **Rust**. Users can report city road problems, propose solutions, upvote solutions, and earn XP/levels through community participation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API Server | Node.js + Express |
| Database | MongoDB + Mongoose |
| Gamification Engine | Rust (stdin/stdout JSON IPC) |
| Authentication | JWT + bcrypt |

## How Node.js and Rust Talk to Each Other

```
Client  ──HTTP──>  Node.js  ──stdin──>  Rust Binary
                         <──stdout──
```

1. Node.js spawns the Rust binary as a child process
2. Node.js writes a JSON payload to Rust's **stdin**
3. Rust reads from stdin, performs calculations (XP, level)
4. Rust writes the result JSON to **stdout**
5. Node.js reads stdout, parses the result, updates MongoDB

This approach keeps Rust focused on pure computation while Node.js handles HTTP and database operations.

## Project Structure

```
Civic-Raid/
├── Models/
│   ├── citySchema.js        # City/road problem schema
│   ├── solutionSchema.js    # Solution schema with upvote tracking
│   └── userSchema.js        # User schema with XP, level, impact_score
├── Routing/
│   ├── city.js              # City CRUD routes
│   ├── sol.js               # Solution CRUD routes
│   └── user.js              # Auth (signup/login) + user routes
├── Middleware/
│   └── auth.js              # JWT authentication middleware
├── src/
│   └── main.rs              # Rust gamification engine
├── server.js                # Express server + Rust IPC helper
├── Cargo.toml               # Rust dependencies
├── package.json             # Node.js dependencies
└── .env                     # Environment variables (MONGO_URL, JWT_SECRET)
```

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/signup` | Create account (returns JWT) |
| POST | `/login` | Login (returns JWT) |

### Users
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/all-users` | List all users |
| GET | `/user-by-level/:usl` | Filter users by level |

### Cities
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/city-details` | Report a road problem |
| GET | `/all-cities` | List all reported cities |
| GET | `/city-search?city_name=&road_name=` | Search by city/road |

### Solutions
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/solution` | Submit a solution |
| GET | `/all-solutions` | List all solutions |
| GET | `/solution-search?city_id=` | Search solutions by city |
| PUT | `/solution-update/:sid` | Update a solution |

### Gamification
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/upvote/:solutionId` | Upvote a solution (+10 XP via Rust) |
| POST | `/impact/:userId` | Recalculate impact score via Rust |
| GET | `/leaderboard` | Top 10 users by XP |

## Gamification Rules

| Action | Effect |
|--------|--------|
| Upvote a solution | Author gains 10 XP |
| Every 100 XP | Author levels up |
| Each solution authored | +1 impact_score |
| Duplicate upvote | Blocked (same user can't upvote twice) |
| Self upvote | Blocked |

## Setup

### Prerequisites
- Node.js (v18+)
- Rust toolchain
- MongoDB instance

### Install Dependencies
```bash
# Node.js
npm install

# Rust
cargo build --release
```

### Environment Variables
Create a `.env` file:
```
MONGO_URL=mongodb://localhost:27017/civic-raid
JWT_SECRET=your-secret-key-here
```

### Run
```bash
npm start
```

## If you like this project, just star and follow my GitHub
https://github.com/Lavish09-Mehra
