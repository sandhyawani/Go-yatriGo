const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"]
    },
    review: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Review text cannot exceed 1000 characters"]
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    tripType: {
      type: String,
      enum: ["TravelGroup", "Journey"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ reviewer: 1, reviewedUser: 1, tripId: 1 }, { unique: true });

reviewSchema.pre("validate", function (next) {
  if (this.reviewer && this.reviewedUser && this.reviewer.toString() === this.reviewedUser.toString()) {
    return next(new Error("You cannot review yourself."));
  }
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
