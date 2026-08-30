import mongoose from 'mongoose';
export const solSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    city_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true
    },
    solution: {
        type: String,
        required: true
    },
    expected_cost: {
        type: Number,
        required: false,
        default: '0.0'
    },
    expected_labour: {
        type: Number,
        default: 1,
    },
    // Array of user IDs who upvoted this solution
    // Prevents duplicate upvotes from the same user
    upvoted_by: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Running count of total upvotes (denormalized for fast leaderboard queries)
    upvote_count: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

export const Solution = mongoose.model('Solution', solSchema);
