import mongoose from 'mongoose';

export const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    house_number: {
        type: String,
        default: '000/A'
    },
    contact_number: {
        type: String,
        required: true
    },
    XP: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default:  '1'
    },
    impact_score: {
        type: Number,
        default: '0'
    }
}, { timestamps: true })

export const User = mongoose.model("User", userSchema);