const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Reference to the Product model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1, // Quantity should be at least 1
  },
  size: {
    type: String,
    required: true, // Example: 'L', 'XL'
  },
});

const userCartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
    unique: true, // Ensure only one cart per user
  },
  cartItems: [cartItemSchema], // Array of cart items
});

module.exports = mongoose.model('UserCart', userCartSchema);
