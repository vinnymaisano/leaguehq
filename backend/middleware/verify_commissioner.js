import League from "../models/League.js";
import mongoose from "mongoose";

export async function verify_commissioner(req, res, next) {
    try {
        const user_id = req.user?.user_id; // From verify_token
        const { league_id } = req.params;

        if (!user_id) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        if (!mongoose.Types.ObjectId.isValid(league_id)) {
            return res.status(400).json({ message: "Invalid league ID" });
        }

        // make sure the user is either the owner or a commissioner of this league
        const exists = await League.exists({
        _id: league_id,
        $or: [
                { owner: user_id },
                { commissioners: user_id }
            ]
        })


        if (!exists) {
            return res.status(403).json({ message: "Forbidden — not a commissioner" });
        }
        next();
    } catch (err) {
        console.error("Commissioner check error:", err);
        res.status(500).json({ message: "Server error" });
    }
}
