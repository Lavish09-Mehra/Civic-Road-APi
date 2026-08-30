<h1 align="center">Civic-Raid</h1>

<p align="center">
  <b>A Gamified Civic Engagement API</b><br>
  <i>Node.js + Express + MongoDB + Rust</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge" />
</p>

---

## What is Civic-Raid?

Civic-Raid is a **REST API** where citizens report road problems in their cities, propose solutions, and the community upvotes the best ones. The twist? **Gamification powered by Rust** — every upvote earns the solution author **10 XP**, and every **100 XP** unlocks a new level.

The key highlight is the **hybrid architecture**: Node.js handles HTTP and database operations, while a compiled **Rust binary** handles all gamification math through stdin/stdout JSON communication.

---

## Why Rust + Node.js?

| Concern | Handled By | Why |
|---------|-----------|-----|
| HTTP Routes | Node.js + Express | Fast development, rich ecosystem |
| Database | MongoDB + Mongoose | Flexible schema, easy prototyping |
| Gamification Math | Rust Binary | Blazing fast, memory safe, zero runtime cost |
| Authentication | JWT + bcrypt | Industry standard, secure |

> Rust is called as a **child process** via stdin/stdout — no FFI, no native bindings, just clean JSON IPC.

---

## Architecture

```
                        ┌─────────────────────────────────────────┐
                        │              CLIENT (Postman/cURL)       │
                        └──────────────────┬──────────────────────┘
                                           │ HTTP Request
                                           ▼
                        ┌─────────────────────────────────────────┐
                        │         NODE.JS / EXPRESS SERVER         │
                        │                                         │
                        │  ┌─────────┐  ┌─────────┐  ┌────────┐  │
                        │  │  Auth   │  │ Routes  │  │Mongoose│  │
                        │  │ (JWT)   │  │(REST)   │  │ (DB)   │  │
                        │  └────┬────┘  └────┬────┘  └───┬────┘  │
                        │       │            │           │        │
                        └───────┼────────────┼───────────┼────────┘
                                │            │           │
                                ▼            ▼           ▼
                           ┌────────┐  ┌──────────┐  ┌─────────┐
                           │bcrypt │  │callRust()│  │MongoDB  │
                           │hashing│  │  spawn() │  │         │
                           └────────┘  └────┬─────┘  └─────────┘
                                            │ stdin (JSON)
                                            ▼
                        ┌─────────────────────────────────────────┐
                        │           RUST GAMIFICATION ENGINE       │
                        │                                         │
                        │  stdin ──▶ Parse JSON ──▶ Calculate     │
                        │                          XP / Level     │
                        │           Serialize ──▶ stdout          │
                        └─────────────────────────────────────────┘
```

---

## How Node.js Talks to Rust (Step by Step)

This is the core architectural decision in this project. Here's exactly what happens:

### Step 1: Node.js Spawns Rust Binary
```javascript
const child = spawn('target/release/Civic-Raid.exe', [], {
    stdio: ['pipe', 'pipe', 'pipe']
});
```

### Step 2: Node.js Sends JSON to Rust's stdin
```javascript
child.stdin.write(JSON.stringify({
    action: "upvote",
    user: { id: "abc123", xp: 50, level: 1, impact_score: 3 },
    solution_count: 5
}));
child.stdin.end();
```

### Step 3: Rust Reads stdin, Calculates, Writes to stdout
```rust
// Rust reads from stdin
io::stdin().read_to_string(&mut input);

// Parses the JSON
let mut request: ActionRequest = serde_json::from_str(&input);

// Calculates new XP and level
user.xp += 10;
user.level = (user.xp / 100) + 1;

// Writes result to stdout
println!("{}", serde_json::to_string(&result));
```

### Step 4: Node.js Reads Rust's stdout
```javascript
child.stdout.on('data', (data) => {
    stdout += data.toString();
});
// stdout = '{"id":"abc123","xp":60,"level":1,"impact_score":3}'
```

### Step 5: Node.js Updates MongoDB
```javascript
await User.findByIdAndUpdate(id, { XP: result.xp, level: result.level });
```

---

## Project Structure

```
Civic-Raid/
│
├── Models/                    # Mongoose schemas (database models)
│   ├── citySchema.js          # City + road problem data
│   ├── solutionSchema.js      # Solutions with upvote tracking
│   └── userSchema.js          # Users with XP, level, impact_score
│
├── Routing/                   # Express route handlers
│   ├── city.js                # POST/GET city problems
│   ├── sol.js                 # POST/GET/PUT solutions
│   └── user.js                # Signup, login, user queries
│
├── Middleware/
│   └── auth.js                # JWT token verification
│
├── src/
│   └── main.rs                # Rust gamification engine
│
├── server.js                  # Express app + Rust IPC bridge
├── Cargo.toml                 # Rust dependencies (serde, serde_json)
├── package.json               # Node dependencies (express, mongoose, jwt, bcrypt)
└── .env                       # MONGO_URL, JWT_SECRET
```

---

## API Endpoints

### Authentication

| Method | Route | Body | Response |
|--------|-------|------|----------|
| `POST` | `/signup` | `{ username, email, password, contact_number }` | `{ token, user }` |
| `POST` | `/login` | `{ email, password }` | `{ token, user }` |

### Users

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/all-users` | List all users |
| `GET` | `/user-by-level/:usl` | Filter by level |

### Cities

| Method | Route | Body / Query | Description |
|--------|-------|-------------|-------------|
| `POST` | `/city-details` | `{ user_id, city_name, state, country, road_details, problem, threat }` | Report a problem |
| `GET` | `/all-cities` | — | List all |
| `GET` | `/city-search` | `?city_name=&road_name=` | Search |

### Solutions

| Method | Route | Body / Query | Description |
|--------|-------|-------------|-------------|
| `POST` | `/solution` | `{ user_id, city_id, solution, expected_cost }` | Submit solution |
| `GET` | `/all-solutions` | — | List all |
| `GET` | `/solution-search` | `?city_id=` | Filter by city |
| `PUT` | `/solution-update/:sid` | `{ solution, expected_cost }` | Update |

### Gamification

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/upvote/:solutionId` | Yes | Upvote → Rust adds 10 XP |
| `POST` | `/impact/:userId` | Yes | Recalculate impact score |
| `GET` | `/leaderboard` | No | Top 10 users by XP |

---

## Request & Response Examples

### Signup
```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@test.com","password":"123456","contact_number":"9876543210"}'
```
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "6654a1b2c3d4e5f6a7b8c9d0",
    "username": "john",
    "email": "john@test.com",
    "XP": 0,
    "level": 1,
    "impact_score": 0
  }
}
```

### Upvote (Protected Route)
```bash
curl -X POST http://localhost:3000/upvote/6654a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```
```json
{
  "message": "Upvote processed",
  "upvotes": 5,
  "user": {
    "XP": 60,
    "level": 1
  },
  "rust_result": {
    "id": "6654a1b2c3d4e5f6a7b8c9d0",
    "xp": 60,
    "level": 1,
    "impact_score": 3
  }
}
```

### Leaderboard
```bash
curl http://localhost:3000/leaderboard
```
```json
{
  "leaderboard": [
    { "rank": 1, "username": "alice", "XP": 250, "level": 3, "impact_score": 12 },
    { "rank": 2, "username": "bob",   "XP": 180, "level": 2, "impact_score": 8 },
    { "rank": 3, "username": "carol", "XP": 120, "level": 2, "impact_score": 5 }
  ]
}
```

---

## Rust Gamification Engine

The Rust binary in `src/main.rs` handles two actions:

### Upvote Action
```
Input:  { "action": "upvote", "user": { "xp": 50, ... } }
Logic:  xp += 10; level = (xp / 100) + 1;
Output: { "xp": 60, "level": 1, ... }
```

### Impact Action
```
Input:  { "action": "impact", "solution_count": 7 }
Logic:  impact_score = solution_count;
Output: { "impact_score": 7, ... }
```

### Level Thresholds

| XP Range | Level |
|----------|-------|
| 0 - 99 | 1 |
| 100 - 199 | 2 |
| 200 - 299 | 3 |
| 300 - 399 | 4 |
| ... | ... |

---

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) toolchain
- [MongoDB](https://www.mongodb.com/) instance (local or Atlas)

### 1. Clone & Install
```bash
git clone https://github.com/Lavish09-Mehra/Civic-Road-APi.git
cd Civic-Road-APi
npm install
```

### 2. Build Rust Binary
```bash
cargo build --release
```

### 3. Configure Environment
Create `.env` file:
```env
MONGO_URL=mongodb://localhost:27017/civic-raid
JWT_SECRET=your-super-secret-key
```

### 4. Start Server
```bash
npm start
# Server listening at http://localhost:3000
```

### 5. Test the Rust Binary Directly
```bash
echo '{"action":"upvote","user":{"id":"test","xp":95,"level":1,"impact_score":0}}' | ./target/release/Civic-Raid
# Output: {"id":"test","xp":105,"level":2,"impact_score":0}
```

---

## License

ISC

---

<p align="center">
  If you like this project, just <b>star</b> and <b>follow</b> my GitHub<br>
  <a href="https://github.com/Lavish09-Mehra">github.com/Lavish09-Mehra</a>
</p>
