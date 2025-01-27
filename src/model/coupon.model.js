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
    unique: true, // Ensures uniqueness
    required: true,
  },
});

// Pre-save Middleware to Generate Unique Code
couponSchema.pre("save", async function (next) {
  if (!this.code) {
    let uniqueCodeFound = false;
    while (!uniqueCodeFound) {
      const randomCode = generateCouponCode(12); // Fixed size of 12 characters
      const existingCoupon = await mongoose.model("Coupon").findOne({ code: randomCode });
      if (!existingCoupon) {
        this.code = randomCode;
        uniqueCodeFound = true;
      }
    }
  }
  next();
});

// Export the Model
module.exports = mongoose.model("Coupon", couponSchema);
