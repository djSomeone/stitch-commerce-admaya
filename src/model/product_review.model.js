const mongoose = require("mongoose");

const productReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Reference to Product model
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5, // Only allow ratings between 1 and 5
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true } // Auto add createdAt & updatedAt
);

const ProductReview = mongoose.model("ProductReview", productReviewSchema);

module.exports = ProductReview;
