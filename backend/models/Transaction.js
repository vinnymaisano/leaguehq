import mongoose, {Schema} from "mongoose"

const DraftPickSchema = new mongoose.Schema({
  round: { type: Number, required: true },
  season: { type: String, required: true },
  league_id: { type: String, default: null },
  roster_id: { type: Number, required: true },
  owner_id: { type: Number, required: true },
  previous_owner_id: { type: Number, required: true }
});

const TransactionSchema = new mongoose.Schema({
    sleeper_txn_id: {
        type: String
    },

    league_id: {
        type: Schema.Types.ObjectId,
        ref: "League",
        required: true
    },

    sleeper_league_id: {
        type: String,
        required: true
    },

    // each entry is the roster ID and the player ID
    adds: [{
        roster_id: String,
        player: {type: String, ref: "Player"}
    }],
    drops: [{
        roster_id: String,
        player: {type: String, ref: "Player"}
    }],

    draft_picks: [DraftPickSchema],
    
    // for searching transactions by player id involved
    players: [{type: String, ref: "Player"}],

    txn_time: {
        type: Date,
        required: true
    },

    type: {
        type: String,
        enum: [
            "free_agent",
            "commissioner",
            "waiver",
            "extension",
            "trade",
            "create_contract",
            "delete_contract",
            "edit_contract",
            "draft_import",
            "draft_delete"
        ],
        required: true
    },

    // for adds, waiver claims, and extensions
    salary: {
        type: Number,
        default: 0
    },

    contract_start_year: {
        type: Number
    },

    contract_length: {
        type: Number,
        enum: [0, 1, 2, 3, 4]
    },

    contract_id: {
        type: Schema.Types.ObjectId,
        ref: "Contract"
    },

    // for edits: store old, new values of salary and end year
    changes: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },

    // for draft imports
    draft_id: {
        type: String
    }

}, {
    collection: "transactions"
})

const Transaction = mongoose.model("Transaction", TransactionSchema)
export default Transaction