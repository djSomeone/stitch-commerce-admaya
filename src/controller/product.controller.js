const Product = require('../model/product.model');
const cloudinary = require('cloudinary').v2;
//add product 
exports.addProduct = async (req, res) => {
    try {
      const {
        name,
        price,
        pattern,
        fabric,
        colors,
        sizes,
        description,
        categories,
        fit,
        subcategory,
      } = req.body;
  
      console.log(req.body)
  
      // Convert JSON string of sizes to array
      const parsedSizes = JSON.parse(sizes);
  
      // Validate sizes
      if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
        return res.status(400).json({ message: 'Sizes should be a non-empty array.' });
      }
      console.log("befor new Product")
      // Create and save product
      const product = new Product({
        name,
        price,
        pattern,
        fabric,
        colors: colors.split(',').map(color => color.trim()), // Convert comma-separated colors to array
        sizes: parsedSizes,
        description,
        categories,
        fit,
        subcategory,
        images:req.imageUrls,
      });
  console.log("after new Product")
      const savedProduct = await product.save();
      console.log("after save Product")
      // Include image URL in the response
      res.status(201).json({
        message: 'Product added successfully!',
        product: savedProduct,
        imageUrl: req.imageUrl, // Include image in the response
      });
    } catch (error) {
      console.error('Error adding product:', error.message);
      res.status(500).json({
        message: 'An error occurred while adding the product.',
        error: error.message,
      });
    }
  };

// List all products
exports.allProducts = async (req, res) => {
    try {
        const products = await Product.find();
        const response={
            message:"success",
            status:200,
            data:{
                count:products.length,
                products:products
            }
        }
        res.status(200).json(response);
    } catch (error) {
        console.error('Error listing products:', error.message);
        res.status(500).json({
            message: 'An error occurred while listing the products.',
            error: error.message,
        });
    }
};

//product fetch product detail 
exports.getProductDetail = async (req, res) => {
  try {
      const productId = req.params.id;
      const viewProduct = req.query.viewProduct === 'true'; // Default is false

      const product = await Product.findById(productId);

      if (!product) {
          return res.status(404).json({ message: 'Product not found' });
      }

      // If viewProduct is true, increment the visit count
      if (viewProduct) {
          product.visit = (BigInt(product.visit) + 1n).toString();
          await product.save(); // Save updated visit count
      }

      res.status(200).json({
          message: "success",
          status: 200,
          data: product
      });

  } catch (error) {
      console.error('Error fetching product details:', error.message);
      res.status(500).json({
          message: 'An error occurred while fetching the product details.',
          error: error.message,
      });
  }
};
