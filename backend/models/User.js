import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  password: { type: String, required: true },
  is_verified: { type: Boolean, default: false },
  verification_token: { type: String },

  // for forgot password
  reset_token: { type: String },
  reset_token_expiry: { type: Date },
  
  // list of leagues that this user is in
  leagues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League'
  }]
}, {
  collection: "users",
  timestamps: true
});


export default mongoose.model('User', UserSchema);