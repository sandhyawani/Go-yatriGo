const mongoose = require("mongoose");

const TripMateConnectionSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "accepted",
    },
    // Canonical pair to ensure uniqueness regardless of direction
    pair: { type: String, unique: true },
  },
  { timestamps: true }
);

TripMateConnectionSchema.pre("save", function (next) {
  const [first, second] = [this.requester.toString(), this.recipient.toString()].sort();
  this.pair = `${first}_${second}`;
  next();
});

// Prevent duplicate connections regardless of direction
TripMateConnectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model("TripMateConnection", TripMateConnectionSchema);
