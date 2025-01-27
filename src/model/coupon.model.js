const mongoose = require("mongoose");

// Function to Generate a Random Code
function generateCouponCode(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // Allowed characters
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Define the Coupon Schema
const couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
    min: 1,
  },
  description: {
    type: String,
    required: false, // Optional field for additional details
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  code: {
    type: String,
    unique: true, // Enforced uniqueness at the database level
    required: true,
  },
});

// Utility Function to Generate and Set a Unique Code
async function setUniqueCouponCode(doc) {
  let uniqueCodeFound = false;

  while (!uniqueCodeFound) {
    const randomCode = generateCouponCode(12); // Fixed size of 12 characters
    const existingCoupon = await mongoose.model("Coupon").findOne({ code: randomCode });
    if (!existingCoupon) {
      doc.code = randomCode;
      uniqueCodeFound = true;
    }
  }
}

// Pre-save Middleware
couponSchema.pre("validate", async function (next) {
  if (!this.code) {
    try {
      await setUniqueCouponCode(this); // Generate a unique code before validation
      next();
    } catch (error) {
      next(error); // Pass the error to the next middleware
    }
  } else {
    next(); // Skip if code already exists
  }
});

module.exports = mongoose.model("Coupon", couponSchema);
