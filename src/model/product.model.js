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
      enum: ['Wardrobe', 'Casual Wear', 'Occasion Wear'], 
      required: true 
    },
    fit: { 
      type: String, 
      enum: ['Regular Fit', 'Slim Fit', 'Loose Fit'], 
      required: true 
    },
    image: { 
      type: String, 
        },
    
    subcategory: { 
      type: String, 
      enum: ['Kurti', 'Shirt', 'Pant', 'Jacket', 'Saree', 'Dress'], 
      required: true 
    },
  }, 
  { 
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Product', productSchema);