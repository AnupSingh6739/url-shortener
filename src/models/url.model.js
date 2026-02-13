const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    unique: true,
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
      type: Date,
      default: null,
      index: { expireAfterSeconds: 0 }   // TTL index
    },
  clicks: {
    type: Number,
    default: 0
  }
});

// const Url = mongoose.model("Url", urlSchema);
// module.exports = Url;

// const mongoose = require("mongoose");

// const urlSchema = new mongoose.Schema(
//   {
//     shortCode: {
//       type: String,
//       required: true,
//       unique: true,
//       index: true
//     },
//     longUrl: {
//       type: String,
//       required: true
//     },
//     expiresAt: {
//       type: Date,
//       default: null,
//       index: { expireAfterSeconds: 0 }   // TTL index
//     },
//     clicks: {
//       type: Number,
//       default: 0
//     }
//   },
//   { timestamps: true }  // automatically adds createdAt & updatedAt
// );

// const Url = mongoose.model("Url", urlSchema);
// module.exports = Url;
