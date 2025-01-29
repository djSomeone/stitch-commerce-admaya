const mongoose = require("mongoose");

// Exchange Schema (Embedded in Order Schema)
const exchangeSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  reasonForExchange: {
    type: String,
    required: true,
  },
  problem: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: false, // Optional if size does not change
  },
  color: {
    type: String,
    required: false, // Optional if color does not change
  },
  arrivalDate: {
    type: Date,
    required: true,
  },
  exchangeStatus: {
    type: String,
    enum: ["ordered", "packaging", "ontheway", "delivered"],
    default: "ordered",
  },
  deliveryDate: {
    type: Date,
    required: false, // Null until delivered
  },
});

// Product Details Schema (For Ordered Products)
const productDetailsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  color: {
    type: String,
    required: true,
  },
});

// Main Order Schema
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  orderedDate: {
    type: Date,
    default: Date.now,
  },
  productDetails: [productDetailsSchema], // Ordered Products
  totalPrice: {
    type: Number,
    required: true,
  },
  paymentDetails: {
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
  },
  paymentMethod: {
    type: String,
    enum: ["credit_card", "debit_card", "net_banking", "UPI", "paypal", "razorpay"],
    required: false,
  },
  orderStatus: {
    type: String,
    enum: ["ordered", "packaging", "ontheway", "delivered"],
    default: "ordered",
  },
  estimatedDate: {
    type: Date,
    required: true,
  },
  deliveryDate: {
    type: Date,
    required: false,
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
    required: false,
  },
  exchanges: [exchangeSchema], // Embedded Exchanges
});

module.exports = mongoose.model("Order", orderSchema);
