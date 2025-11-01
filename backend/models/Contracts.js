import mongoose, {Schema} from 'mongoose'

const ContractSchema = new mongoose.Schema({
  league_id: {
    type: Schema.Types.ObjectId,
    ref: "League"
  },
  draft_id: { type: String, required: true},
  player_id: { type: String, required: true },

  start_year: { type: Number, required: true },
  end_year: { type: Number, required: true },
  terminated_early: {type: Boolean, required: true, default: false},
  salary: { type: Number, required: true },

  extension_eligible: { type: Boolean, default: true, required: true },

  contract_type: {
    type: String,
    enum: ['auction', 'rookie', 'waiver', 'extension', 'created'],
    default: 'auction',
    required: true
  },

  // time of sleeper transaction (add or draft time)
  txn_time: {
    type: Date,
    required: true
  },

  // time that user imported this contract
  import_time: {
    type: Date,
    required: true
  }
},
{collection: "contracts", timestamps: true}
);

ContractSchema.index({ player_id: 1 });
ContractSchema.index({ player_id: 1, league_id: 1, start_year: 1, end_year: 1, terminated_early: 1, createdAt: 1 });
// player can only have one contract per league year
ContractSchema.index(
  { player_id: 1, league_id: 1, start_year: 1 },
  { unique: true }
)

const Contract = mongoose.model('Contract', ContractSchema);
export default Contract