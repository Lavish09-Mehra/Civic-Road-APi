import express from 'express'
const app = express();
app.use(express.json());

import 'dotenv/config';
import mongoose from 'mongoose';

import { user } from './Routing/user.js';
import { city } from './Routing/city.js';
import { sol } from './Routing/sol.js';

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        app.listen(3000, () => {
        console.log("Server listening at http://localhost:3000");
});
    }) .catch((err) => {
        console.error(err);
    })

app.get('/', (req, res) => {
    res.end("I am UP Boss..");
});


app.use(user);
app.use(city);
app.use(sol);