import { User } from '../Models/userSchema.js';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const user = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'civic-raid-secret-key';

// =============================================
// POST /signup - Create a new user account
// Hashes password before saving to database
// Returns a JWT token for immediate login
// =============================================
user.post('/signup', async (req, res) => {
    try {
        const { username, email, password,
            house_number, contact_number } = req.body;

        // Validate required fields
        if (!username || !email || !password || !contact_number) {
            return res.status(400).json({
                message: 'Username, email, password, and contact_number are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: 'User with this email already exists'
            });
        }

        // Hash the password with 10 salt rounds
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            house_number,
            contact_number
        });

        const result = await newUser.save();

        // Create JWT token - expires in 7 days
        const token = jwt.sign(
            { id: result._id, email: result.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data without password
        return res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: result._id,
                username: result.username,
                email: result.email,
                XP: result.XP,
                level: result.level,
                impact_score: result.impact_score
            }
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
// POST /login - Authenticate an existing user
// Compares plaintext password with hashed password
// Returns a JWT token on success
// =============================================
user.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Compare password with stored hash
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: userData._id, email: userData.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: userData._id,
                username: userData.username,
                email: userData.email,
                XP: userData.XP,
                level: userData.level,
                impact_score: userData.impact_score
            }
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
// GET /all-users - List all users (public)
// =============================================
user.get('/all-users', async (req, res) => {
    try {
        const all_users = await User.find().select('-password');
        if (all_users.length === 0) {
            return res.status(404).json({
                message: 'No Users Found..'
            });
        }
        return res.status(200).json({
            all_users
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
// GET /user-by-level/:usl - Filter users by level
// =============================================
user.get('/user-by-level/:usl', async (req, res) => {
    try {
        const user_level = Number(req.params.usl);

        const user_bylevel = await User.find({ level: user_level }).select('-password');

        if (!user_bylevel || user_bylevel.length === 0) {
            return res.status(404).json({
                message: 'No user found by this level'
            });
        }

        return res.status(200).json({
            user_bylevel
        });
    }
    catch (err) {
        return res.status(500).json({
            message: 'oops.. something went wrong',
            error: err.message
        });
    }
});

export default user;
