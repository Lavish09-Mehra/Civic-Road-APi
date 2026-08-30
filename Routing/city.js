import { City } from '../Models/citySchema.js';

import express from 'express';
export const city = express.Router();

city.post('/city-details', async(req, res) => {
    try{
        const { user_id, city_name, state, country, road_details: {road_name, nearby} = {}, problem, threat  } = req.body;
        if(req.body.length === 0 || !req.body){
            return res.status(401).json({
                message: "You have full details.."
            });
        }
        const city_fill = new City({
            user_id,
            city_name, 
            state, country, 
            road_details: {road_name, nearby} = {}, 
            problem, 
            threat
        });
        const city_result = await city_fill.save();
        return res.status(200).json({
            city_result
        });
    }
    catch(err){
        return res.status(500).json({
            message: 'oops.. something went wrong',
            error: err
        });
    }
});

city.get('/all-cities', async(req, res) => {
    try{
        const all_city = await City.find().sort({ name: 1 });
        if (!all_city || all_city.length === 0){
            return res.status(404).json({
                message: 'No City found..'
            });
        }
        return res.status(200).json({
            all_city
        });
    }
    catch(err){
        return res.status(501).json({
            message: 'oops.. something went wrong..',
            error: err
        });
    }
})

city.get('/city-search', async(req, res) => {
    try{
        const { city_name, road_name } = req.query;
        if(!city_name || !road_name){
            return res.status(400).json({
                message: 'Fill the appropriate URL query.. '
            });
        }
        const city_query = await findOne({
            city_name: city_name,
            'road_details.road_name': road_name
        }).populate('user_id', 'username email contact_number');
        if (!city) {
            return res.status(404).json({
                message: 'No city/road details found'
            });
        }

        return res.status(200).json({
            city_query
        });
    }
    catch(err){
        return res.status(501).json({
            message: "oops.. something went wrong",
            error: err
        });
    }
});

export default city;