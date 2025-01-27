const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  townCity: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false, // Indicates if this is the default address
  },
});

const userAddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
    unique: true, // Ensure only one address book per user
  },
  addresses: {
    type: [addressSchema], // Array of addresses
    validate: [
      (addresses) => addresses.length <= 5,
      "Users can only save up to 5 addresses.",
    ],
  },
});

module.exports = mongoose.model("UserAddress", userAddressSchema);
