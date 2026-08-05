import mongoose, { Schema } from 'mongoose'
import Subscription from './Subscription.js'

// const SubscriptionSchema = new mongoose.Schema({
//   year: { type: Number, required: true },
//   purchased_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   purchased_at: { type: Date, default: Date.now }
// }, { _id: false });

const LeagueSchema = new mongoose.Schema({
  // map year to sleeper league id
  sleeper_league_ids: {
    type: Map,
    of: String,
    required: true,
    default: {}
  },

  // optional league-wide custom name (falls back to the Sleeper name when empty)
  custom_name: {type: String, default: "", trim: true, maxlength: 60},

  // user that activates the league, purchases subscription
  owner: {type: Schema.Types.ObjectId, ref: "User", required: true},

  // all league members
  users: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],

  // users that can change settings
  commissioners: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],

  // map sleeper league id to last checked transaction
  last_checked_txn: {
    type: Map,  
    of: new mongoose.Schema({
      round: {type: Number, required: true},
      txn_id: {type: String, required: true}
    }, {_id: false}),
    default: {}
  },

  // track which roster each user is assigned to
  teams: {
    type: Map,
    of: Number,
    default: {}
  },

  // list of purchase subscriptions for this league
  // subscriptions: [SubscriptionSchema],

  free_trial_start: {
    type: Date,
    default: Date.now
  },

  // free trial is 7 days
  free_trial_end: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },

  imported_drafts: [{
    draft_id: {type: String, required: true},
    imported_at: {type: Date, default: Date.now},
  }],  

  salary_cap: {type: Number, default: 200},

  rookie_contract_length: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: 3,
    required: true
  },

  auction_contract_length: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: 3,
    required: true
  },

  max_extension_length: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: 3,
    required: true
  },

  extension_price_hike: {
    type: Number,
    min: 0,
    default: 10,
    required: true
  },
  
  rookie_salaries: {
    type: Map,
    of: {
      type: Number,
      min: 1,
    },
    required: true,
    default: () => ({
      "1": 9,  // Round 1
      "2": 5,  // Round 2
      "3": 3   // Round 3
    })
  }
  
},
{collection: "leagues", timestamps: true});

const League = mongoose.model('League', LeagueSchema);
export default League;
