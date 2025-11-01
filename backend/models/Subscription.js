import mongoose, {Schema} from "mongoose"

// TODO: update how a league's subscriptions are accessed on frontend
//      -recurse by year and sleeper league id to fetch entire history
// add purchase page to account so can view subscription history
// advancing year - get next year's sleeper league id
// delete league UI
//      -let user know that they can use this sleeper league again
// landing page
// payment procesor
// deploy

const SubscriptionSchema = new mongoose.Schema({
    sleeper_league_id: {
        type: String,
        required: true,
        unique: true
    },

    season: {
        type: Number,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    purchased_by: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    purchased_at: {
        type: Date,
        required: true,
        min: new Date(`2025-01-01`),
        max: new Date(new Date().getFullYear()+1, 11, 31)
    }

},
{collection: "subscriptions", timestamps: true})

const Subscription = mongoose.model("Subscription", SubscriptionSchema)
export default Subscription