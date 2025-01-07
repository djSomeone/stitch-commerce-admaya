const mongoose = require('mongoose');

// Schema for storing size and quantity
const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true }, // Example: 'M', 'XL'
  quantity: { type: Number, required: true }, // Example: 3, 100
});

// Main Product Schema
const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  pattern: { 
    type: String, 
    enum: ['Lucknowi', 'Printed', 'Plain', 'Embroidery', 'Other'], // Add more patterns as needed
    required: true 
  },
  fabric: { 
    type: String, 
    enum: ['Cotton', 'Silk', 'Wool', 'Polyester', 'Linen'], // Add more fabrics as needed
    required: true 
  },
  colors: { 
    type: [String], // Example: ['Red', 'Blue', 'Green']
    required: true 
  },
  sizes: { 
    type: [sizeSchema], // Embedded schema for sizes and quantities
    required: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  categories: { 
    type: String, 
    enum: ['Wardrobe', 'Casual Wear', 'Occasion Wear'], // Fixed categories
    required: true 
  },
  fit: { 
    type: String, 
    enum: ['Regular Fit', 'Slim Fit', 'Loose Fit'], // Add more fits as needed
    required: true 
  },
  image: { 
    type: String, // URL of the image
    required: true 
  },
  subcategory: { 
    type: String, 
    enum: ['Kurti', 'Shirt', 'Pant', 'Jacket', 'Saree', 'Dress'], // Add more subcategories as needed
    required: true 
  },
}, { 
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Product', productSchema);
