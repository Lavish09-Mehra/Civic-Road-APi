import { User } from '../Models/userSchema.js'
import express from 'express';

export const user = express.Router();

user.post('/create-user', async (req, res) => {
    try{
        const { username, email, password,
            house_number, contact_number, XP, level,
            impact_score } = req.body

        if (!username || !email || !password || !contact_number || !house_number) {
            return res.status(401).json({
                message: 'You Have to Fill Required Fields..'
            });
        }
        const users = new User({
            username,
            email,
            password,
            contact_number,
            house_number,
            XP,
            level,
            impact_score
        });
        const result = await users.save();
        return res.status(200).json({
            result
        });
    }
    catch(err){
        res.status(500).json({
            message: "oops.. something went wrong",
            error: err
        });
    }
});

user.get('/all-users', async(req, res) => {
    try{
        const all_users = await User.find();
        if (all_users.length === 0){
            return res.status(404).json({
                message: 'No Users Found..'
            });
        }
        return res.status(200).json({
            all_users
        });
    }
    catch(err) {
        res.status(500).json({
            message: "oops.. something went wrong",
            error: err
        });
    }
});

user.get('/user-by-level/:usl', async(req, res) => {
    try {
        const user_level = Number(req.params.usl);

        const user_bylevel = await User.find({ level: user_level  }).select('-password');

        if (!user_bylevel || user_bylevel.length === 0){
            return res.status(404).json({
                message: "No user found by this level"
            })
        }

        return res.status(200).json({
            user_bylevel
        });
    }
    catch(err){
        return res.status(500).json({
            message: "oops.. something went wrong",
            error: err
        })
    }
});

export default user;