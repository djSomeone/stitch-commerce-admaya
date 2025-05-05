const mongoose = require('mongoose');

// Schema for storing size and quantity
const sizeSchema = new mongoose.Schema({
  size: { 
    type: String, 
    required: true, 
    trim: true // Ensures no extra spaces
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 0 // Ensures quantity is non-negative
  },
});

// Main Product Schema
const productSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true, 
      minlength: 2, // Minimum length for product name
      maxlength: 100 // Maximum length for product name
    },
    visit: { 
      type: String, 
      required: true, 
      default: '0', 
      validate: {
        validator: function (v) {
          return /^\d+$/.test(v); // Ensures it's a positive integer string
        },
        message: props => `${props.value} is not a valid visit count!`
      }
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 // Ensures price is non-negative
    },
    pattern: { 
      type: String, 
      enum: ['Lucknowi', 'Printed', 'Plain', 'Embroidery', 'Other'], 
      required: true 
    },
    fabric: { 
      type: String, 
      enum: ['Cotton', 'Silk', 'Wool', 'Polyester', 'Linen'], 
     
    },
    colors: { 
      type: [String], 
      required: true, 
      validate: {
        validator: function (v) {
          return v.every(color => typeof color === 'string' && color.trim().length > 0);
        },
        message: props => `Invalid colors: ${props.value}. Each color should be a non-empty string.`
      }
    },
    sizes: { 
      type: [sizeSchema], 
      required: true 
    },
    description: { 
      type: String, 
      trim: true, 
      default: 'No description provided.' // Default value if not specified
    },
    categories: { 
      type: String, 
      enum: ['Man', 'Woman', 'Other'], 
      required: true 
    },
    fit: { 
      type: String, 
      enum: ['Regular Fit', 'Slim Fit', 'Loose Fit','Drop Shoulder','Overfite'], 
      required: true 
    },
    images: { 
      type: [String], 
        },
    
    subcategory: { 
      type: String, 
      enum: ['Shirt', 'Pant', 'Jacket',  "Crop Tops","Tank Tops","T-Shirt Dresses",
        "Co-ord Sets",
        "Oversized T-Shirts",
        "Regular Fit T-Shirts",
        "Shirts",
        "Pants",
        "Shorts"
      ], 
      required: true 
    },
  }, 
  { 
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Product', productSchema);