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
    pair: { type: String, unique: true },
  },
  { timestamps: true }
);

TripMateConnectionSchema.pre("save", function (next) {
  const [first, second] = [this.requester.toString(), this.recipient.toString()].sort();
  this.pair = `${first}_${second}`;
  next();
});

TripMateConnectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model("TripMateConnection", TripMateConnectionSchema);
