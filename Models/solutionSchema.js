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
    }    

}, { timestamps: true });

export const Solution = mongoose.model('Solution', solSchema);
