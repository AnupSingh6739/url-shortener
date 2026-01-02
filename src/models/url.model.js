const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    unique: true
  },
  longUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,       // ⬅️ NEW
    default: null
  },
  clicks: {
    type: Number,
    default: 0
  }
});

const Url = mongoose.model("Url", urlSchema);
module.exports = Url;
