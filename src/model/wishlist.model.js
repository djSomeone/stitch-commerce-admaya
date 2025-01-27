const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Reference to the Product model
    required: true,
  },
  quantity: {
    type: Number,
    default: 1, // Default quantity is 1
    min: 1, // Quantity should be at least 1
  },
  color: {
    type: String, // Example: 'Red', 'Blue', 'Black'
    required: true, // Make it required to specify the color
  },
  size: {
    type: String, // Example: 'L', 'XL'
    required: true, // Make it required to specify the size
  },
});

const userWishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
    unique: true, // Ensure only one wishlist per user
  },
  wishlistItems: [wishlistItemSchema], // Array of wishlist items
});

module.exports = mongoose.model("UserWishlist", userWishlistSchema);
