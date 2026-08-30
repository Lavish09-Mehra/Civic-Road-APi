// =============================================
// Civic-Raid Server
// Node.js/Express API + Rust Gamification Engine
// =============================================
//
// HOW IT WORKS:
// This server handles HTTP requests via Express and MongoDB.
// For gamification calculations (XP, levels), it calls a Rust
// binary through stdin/stdout JSON communication.
//
// FLOW:
// 1. Client sends POST /upvote/:solutionId
// 2. Node.js looks up the solution and user from MongoDB
// 3. Node.js spawns the Rust binary as a child process
// 4. Node.js sends user data as JSON through Rust's stdin
// 5. Rust reads from stdin, calculates new XP/level
// 6. Rust writes result JSON to stdout
// 7. Node.js reads Rust's stdout, parses the result
// 8. Node.js updates MongoDB with new XP/level values
//

import express from 'express'
const app = express();
app.use(express.json());

import 'dotenv/config';
import mongoose from 'mongoose';

// child_process.spawn is used to launch the Rust binary
// path helps us find the binary in the target/release folder
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

import { user } from './Routing/user.js';
import { city } from './Routing/city.js';
import { sol } from './Routing/sol.js';
import { auth } from './Middleware/auth.js';

// ES Module __dirname workaround
// In ES modules, __dirname is not available by default
// We reconstruct it using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================
// Rust Gamification Helper - How Node Talks to Rust
// =============================================
//
// The Rust binary is a separate process. We communicate with it
// using stdin (we write JSON to it) and stdout (it writes back).
//
// Think of it like a function call:
//   - Node.js is the caller
//   - Rust binary is the function
//   - stdin/stdout is how arguments and return values travel
//
// Example:
//   Node sends:  {"action":"upvote","user":{"id":"abc","xp":50,...}}
//   Rust sends:  {"id":"abc","xp":60,"level":1,"impact_score":3}
//
function callRust(payload) {
    return new Promise((resolve, reject) => {
        // Build path to the compiled Rust binary
        // On Windows it's .exe, on Linux/Mac it's just the binary name
        const rustBin = path.join(__dirname, 'target', 'release', 'Civic-Raid.exe');

        // Spawn the Rust process with piped stdin/stdout
        // 'pipe' means we can write to child.stdin and read from child.stdout
        const child = spawn(rustBin, [], { stdio: ['pipe', 'pipe', 'pipe'] });

        // Buffers to collect data chunks from Rust
        let stdout = '';
        let stderr = '';

        // Rust writes its result to stdout in chunks
        // We accumulate all chunks into a single string
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        // If Rust writes to stderr, we collect it for error reporting
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        // 'close' fires when Rust process finishes
        // exit code 0 means success
        child.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(
                    `Rust process exited with code ${code}: ${stderr}`
                ));
            }
            try {
                // Parse the JSON that Rust wrote to stdout
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (e) {
                reject(new Error(`Failed to parse Rust output: ${stdout}`));
            }
        });

        // Handle process spawn errors (e.g., binary not found)
        child.on('error', (err) => {
            reject(err);
        });

        // Send the payload to Rust via stdin
        // This is like calling: function(payload) in Rust
        child.stdin.write(JSON.stringify(payload));
        child.stdin.end(); // Signal that we're done writing
    });
}

// =============================================
// MongoDB Connection
// =============================================
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        app.listen(3000, () => {
            console.log("Server listening at http://localhost:3000");
        });
    })
    .catch((err) => {
        console.error(err);
    })

// =============================================
// Routes
// =============================================

app.get('/', (req, res) => {
    res.end("I am UP Boss..");
});

// =============================================
// Upvote Route - The Core Node <-> Rust Flow
// =============================================
//
// This route demonstrates the full cycle:
// 1. Validate request
// 2. Check if user already upvoted (prevent duplicates)
// 3. Save upvote to database
// 4. Call Rust to recalculate XP and level
// 5. Update database with Rust's result
//
app.post('/upvote/:solutionId', auth, async (req, res) => {
    try {
        const { User } = await import('./Models/userSchema.js');
        const { Solution } = await import('./Models/solutionSchema.js');

        const solution = await Solution.findById(req.params.solutionId);
        if (!solution) {
            return res.status(404).json({ message: 'Solution not found' });
        }

        // The upvoter is the authenticated user (from JWT token)
        const upvoterId = req.user.id;

        // Prevent users from upvoting their own solutions
        if (solution.user_id.toString() === upvoterId) {
            return res.status(400).json({
                message: 'You cannot upvote your own solution'
            });
        }

        // Check if this user already upvoted this solution
        // upvoted_by is an array of user IDs stored in MongoDB
        if (solution.upvoted_by.includes(upvoterId)) {
            return res.status(400).json({
                message: 'You have already upvoted this solution'
            });
        }

        // Record the upvote
        solution.upvoted_by.push(upvoterId);
        solution.upvote_count += 1;
        await solution.save();

        // Get the solution author (the one who gets XP)
        const authorData = await User.findById(solution.user_id);
        if (!authorData) {
            return res.status(404).json({ message: 'Solution author not found' });
        }

        // Count total solutions by this author for impact score
        const solutionCount = await Solution.countDocuments({
            user_id: authorData._id
        });

        // =============================================
        // Call Rust Binary via stdin/stdout
        // =============================================
        // We send the author's current stats to Rust
        // Rust calculates new XP (+10 per upvote) and new level
        // Rust sends back the updated stats
        //
        const result = await callRust({
            action: 'upvote',
            user: {
                id: authorData._id.toString(),
                xp: authorData.XP,
                level: authorData.level,
                impact_score: authorData.impact_score
            },
            solution_count: solutionCount
        });

        // Update the author's stats in MongoDB with Rust's result
        const updatedUser = await User.findByIdAndUpdate(
            authorData._id,
            { XP: result.xp, level: result.level },
            { new: true }
        );

        return res.status(200).json({
            message: 'Upvote processed',
            upvotes: solution.upvote_count,
            user: updatedUser,
            rust_result: result
        });
    }
    catch (err) {
        return res.status(500).json({
            message: 'oops.. something went wrong',
            error: err.message
        });
    }
});

// =============================================
// Impact Score Route - Another Rust Calculation
// =============================================
// Recalculates a user's impact_score based on
// how many solutions they've authored
//
app.post('/impact/:userId', auth, async (req, res) => {
    try {
        const { User } = await import('./Models/userSchema.js');
        const { Solution } = await import('./Models/solutionSchema.js');

        const userData = await User.findById(req.params.userId);
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        const solutionCount = await Solution.countDocuments({
            user_id: userData._id
        });

        // Call Rust to calculate impact_score
        const result = await callRust({
            action: 'impact',
            user: {
                id: userData._id.toString(),
                xp: userData.XP,
                level: userData.level,
                impact_score: userData.impact_score
            },
            solution_count: solutionCount
        });

        const updatedUser = await User.findByIdAndUpdate(
            userData._id,
            { impact_score: result.impact_score },
            { new: true }
        );

        return res.status(200).json({
            message: 'Impact score updated',
            user: updatedUser,
            rust_result: result
        });
    }
    catch (err) {
        return res.status(500).json({
            message: 'oops.. something went wrong',
            error: err.message
        });
    }
});

// =============================================
// Leaderboard Route - Top Users by XP
// =============================================
// Returns users ranked by XP, level, and impact_score
// Useful for gamification features like top contributors
//
app.get('/leaderboard', async (req, res) => {
    try {
        const { User } = await import('./Models/userSchema.js');

        // Get top 10 users sorted by XP descending
        const leaderboard = await User.find()
            .select('username XP level impact_score')
            .sort({ XP: -1 })
            .limit(10);

        if (leaderboard.length === 0) {
            return res.status(404).json({
                message: 'No users found for leaderboard'
            });
        }

        // Add rank number to each user
        const ranked = leaderboard.map((u, index) => ({
            rank: index + 1,
            username: u.username,
            XP: u.XP,
            level: u.level,
            impact_score: u.impact_score
        }));

        return res.status(200).json({
            leaderboard: ranked
        });
    }
    catch (err) {
        return res.status(500).json({
            message: 'oops.. something went wrong',
            error: err.message
        });
    }
});

// =============================================
// Mount Route Modules
// =============================================
app.use(user);
app.use(city);
app.use(sol);
