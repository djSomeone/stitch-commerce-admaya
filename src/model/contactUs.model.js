const mongoose = require('mongoose');

const contactUsSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,  // First name is required
  },
  lastName: {
    type: String,
    required: true,  // Last name is required
  },
  email: {
    type: String,
    required: true,  // Email is required
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'], // Validate email format
  },
  phone: {
    type: String,
    required: true,  // Phone number is required
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'], // Validate phone format (10 digits)
  },
  message: {
    type: String,
    required: true,  // Message is required
    minlength: [10, 'Message should be at least 10 characters long'], // Minimum message length of 10 characters
  },
  createdAt: {
    type: Date,
    default: Date.now,  // Automatically set the creation date to now
  },
});

module.exports = mongoose.model('ContactUs', contactUsSchema);
