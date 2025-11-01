// models/PlayerSalary.js
import mongoose from 'mongoose'

const PlayerSchema = new mongoose.Schema({
    _id: String,
    age: Number,
    full_name: String,
    years_exp: Number,
    team: String,
    birth_date: Date,
    position: String
},
{collection: "players"}
);

const Player = mongoose.model('Player', PlayerSchema);
export default Player