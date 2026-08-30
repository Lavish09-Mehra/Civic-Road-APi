import { Solution } from '../Models/solutionSchema.js';

import express from 'express';
export const sol = express.Router();

sol.post('/solution', async (req, res) => {
    try {
        const { user_id, city_id, solution, expected_cost, expected_labour } = req.body;
        if (!user_id || !city_id || !solution) {
            return res.status(401).json({
                message: 'You Have to Fill Required Fields..'
            });
        }
        const newSolution = new Solution({
            user_id,
            city_id,
            solution,
            expected_cost,
            expected_labour
        });
        const result = await newSolution.save();
        return res.status(200).json({
            result
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "oops.. something went wrong",
            error: err
        });
    }
});

sol.get('/all-solutions', async (req, res) => {
    try {
        const all_solutions = await Solution.find()
            .populate('user_id', 'username email contact_number')
            .populate('city_id', 'city_name state');
        if (all_solutions.length === 0) {
            return res.status(404).json({
                message: 'No Solutions Found..'
            });
        }
        return res.status(200).json({
            all_solutions
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "oops.. something went wrong",
            error: err
        });
    }
});

sol.get('/solution-search', async (req, res) => {
    try {
        const { city_id, road_name } = req.query;
        if (!city_id) {
            return res.status(400).json({
                message: 'Fill the appropriate URL query.. '
            });
        }
        const solution_query = await Solution.find({ city_id })
            .populate('user_id', 'username email contact_number')
            .populate('city_id', 'city_name state road_details');
        if (!solution_query || solution_query.length === 0) {
            return res.status(404).json({
                message: 'No solution found for this city/road'
            });
        }
        return res.status(200).json({
            solution_query
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "oops.. something went wrong",
            error: err
        });
    }
});

sol.put('/solution-update/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        const { solution, expected_cost, expected_labour } = req.body;
        const updated = await Solution.findByIdAndUpdate(
            sid,
            { solution, expected_cost, expected_labour },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({
                message: 'No solution found to update'
            });
        }
        return res.status(200).json({
            updated
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "oops.. something went wrong",
            error: err
        });
    }
});

export default sol;
