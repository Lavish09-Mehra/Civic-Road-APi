use serde::{Deserialize, Serialize};
use std::io::{self, Read};

// =============================================
// Structs
// =============================================

// Represents a user with gamification stats
#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: String,
    xp: u32,
    level: u32,
    impact_score: u32,
}

// The request coming from Node.js server
// action can be "upvote" or "impact"
#[derive(Debug, Serialize, Deserialize)]
struct ActionRequest {
    action: String,
    user: User,
    // how many solutions this user has authored (used for impact)
    #[serde(default)]
    solution_count: u32,
}

// The response sent back to Node.js server
#[derive(Debug, Serialize, Deserialize)]
struct ActionResult {
    id: String,
    xp: u32,
    level: u32,
    impact_score: u32,
}

// =============================================
// Constants
// =============================================

// XP gained per upvote
const XP_PER_UPVOTE: u32 = 10;

// XP needed to level up
const XP_PER_LEVEL: u32 = 100;

// =============================================
// Calculation Functions
// =============================================

// Calculate level based on XP
// Every 100 XP = level increases
// minimum level is always 1
fn calculate_level(xp: u32) -> u32 {
    (xp / XP_PER_LEVEL) + 1
}

// Handle upvote action:
// - Add XP_PER_UPVOTE to user's XP
// - Recalculate level
fn handle_upvote(user: &mut User) {
    user.xp += XP_PER_UPVOTE;
    user.level = calculate_level(user.xp);
}

// Handle impact calculation:
// - impact_score equals total solutions authored
fn handle_impact(user: &mut User, solution_count: u32) {
    user.impact_score = solution_count;
}

// =============================================
// Main - reads JSON from stdin, outputs to stdout
// =============================================

fn main() {
    // Read the entire stdin into a string
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap_or_else(|err| {
        eprintln!("Error reading input: {}", err);
        std::process::exit(1);
    });

    // Parse the JSON request
    let mut request: ActionRequest = serde_json::from_str(&input).unwrap_or_else(|err| {
        eprintln!("Error parsing JSON: {}", err);
        std::process::exit(1);
    });

    // Process the action
    match request.action.as_str() {
        "upvote" => {
            handle_upvote(&mut request.user);
        }
        "impact" => {
            handle_impact(&mut request.user, request.solution_count);
        }
        other => {
            eprintln!("Unknown action: {}", other);
            std::process::exit(1);
        }
    }

    // Build the result
    let result = ActionResult {
        id: request.user.id,
        xp: request.user.xp,
        level: request.user.level,
        impact_score: request.user.impact_score,
    };

    // Print the JSON result to stdout
    let output = serde_json::to_string(&result).unwrap_or_else(|err| {
        eprintln!("Error serializing JSON: {}", err);
        std::process::exit(1);
    });

    println!("{}", output);
}
