import mongoose from 'mongoose';

export const CitySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    city_name: {
        type: String,
        required: true
    },

    state: {
        type: String,
        required: true
    },

    country: {
        type: String,
        required: true
    },

    road_details: [{
        road_name: {
            type: String,
            required: true
        },

        nearby: {
            type: String,
            required: true
        }
    }],
    problem: {
        type: String,
        required: true
    },
    threat: {
        type: String,
        enum: ['Low', 'High', 'Medium'],
        required: true
    }
}, { timestamps: true });

export const City = mongoose.model('City', CitySchema);