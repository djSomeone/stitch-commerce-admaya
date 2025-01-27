const User = require("../model/user.model");
const jwt = require("jsonwebtoken");
const cloudinary = require('cloudinary').v2;
const Banner = require('../model/banner.model');
const Product = require('../model/product.model');
const Order = require('../model/order.model');
const UserCart = require('../model/userCart.model');
const UserWishlist = require('../model/wishlist.model');

require("dotenv").config();

const generateJwtToken = (user) => {
    return jwt.sign({ user }, process.env.JWTS_KEY, { expiresIn: "7d" });
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}



exports.login = async (req, res) => {
    const email = req.body.email;
    const otp = generateOTP();

    try {
        let user = await User.findOne({ email: email });

        if (user) {
            user.otp = otp;
        } else {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = await user.save();

        // Send OTP to the user
        res.json({
            message: "OTP sent successfully",
            data: {
                id: userData._id,
                email: userData.email,
                name: userData.name
            }
        });
    } catch (err) {
        console.log("this is the errro==>", err)
        res.status(500).send("Error storing OTP");
    }
};
// register user with email and name
exports.register = async (req, res) => {
    const { email, name } = req.body;
    const otp = generateOTP();

    try {
        let user = await User.findOne({ email: email });

        if (user) {
            if (user.isVerified) {
                return res.status(400).json({ message: "User already registered" });
            } else {
                user.otp = otp;
                await user.save();
                return res.status(200).json({
                    message: "OTP updated successfully",
                    data: {
                        id: user._id,
                        email: user.email,
                        name: user.name
                    }
                });
            }
        }

        user = new User({
            email: email,
            name: name,
            otp: otp,
            isVerified: false
        });

        const userData = await user.save();

        res.status(201).json({
            message: "User registered successfully",
            data: {
                id: userData._id,
                email: userData.email,
                name: userData.name
            }
        });
    } catch (err) {
        console.log("this is the error==>", err);
        res.status(500).send("Error registering user");
    }
};

//verify otp on the basis of email
exports.verifyOtp = async (req, res) => {
    const email = req.body.email;
    const otp = req.body.otp;
    console.log("this is the otp==>", otp)

    try {
        const user = await User.findOne({ email: email });
        console.log("this is the user.otp==>", user.otp)
        if (!user) {
            return res.status(404).json({ "message": "User not found" });
        } else if (user.otp !== otp) {
            return res.status(403).json({ "message": "Invalid OTP" });
        } else {

            user.isVerified = true;
            // Clear the OTP after verification
            await user.save();
            console.log("this is the user==>", user)
            const token = generateJwtToken(user);
            console.log("this is the token==>", token)
            return res.status(200).json({
                message: "OTP verified successfully",
                token: token,
                data: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                }
            });
        }
    } catch (err) {
        console.log("this is the errro==>", err)
        res.status(500).send("Error verifying OTP");
    }
}

//we are passing file image in request ,
// upload banner image you have to upload it on cloudinary and after we get url, save in the database
exports.uploadBanner = async (req, res) => {
    try {
        // Validate if an image file is provided
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Find an existing banner in the database
        const existingBanner = await Banner.findOne();
        let result;

        if (existingBanner) {
            // Extract the public_id from the URL
            const publicId = existingBanner.url.split('/').pop().split('.')[0];

            // Update the image in Cloudinary using the existing public_id
            result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { public_id: publicId, folder: 'banners', overwrite: true, resource_type: 'image' },
                    (error, result) => {
                        if (error) {
                            console.error('Error updating image in Cloudinary:', error);
                            return reject(error);
                        }
                        resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });

            // Update the banner URL in the database
            existingBanner.url = result.secure_url;
            await existingBanner.save();

            return res.status(200).json({
                message: 'Image updated successfully',
                banner: existingBanner,
            });
        } else {
            // If no existing banner, upload a new image to Cloudinary
            result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'banners', resource_type: 'image' },
                    (error, result) => {
                        if (error) {
                            console.error('Error uploading to Cloudinary:', error);
                            return reject(error);
                        }
                        resolve(result);
                    }
                );
                uploadStream.end(req.file.buffer);
            });

            // Save the new banner URL in the database
            const newBanner = new Banner({ url: result.secure_url });
            const savedBanner = await newBanner.save();

            return res.status(201).json({
                message: 'Image uploaded and URL saved successfully',
                banner: savedBanner,
            });
        }
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'An error occurred' });
    }
};

//make get the banner image
exports.getBanner = async (req, res) => {
    try {
        const banner = await Banner.findOne();
        if (!banner) {
            return res.status(404).json({ message: 'No banner found' });
        }
        res.json(banner);
    }
    catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({ message: 'An error occurred' });
    }
}


// order
exports.placeOrder=async (req, res) => {
    try {
      const { userId, productDetails, totalPrice, paymentMethod, couponId } = req.body;
  
      // Validate input fields
      if (!userId || !productDetails || !totalPrice || !paymentMethod) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      // Calculate dates
      const orderedDate = new Date();
      const estimatedDate = new Date(orderedDate);
      estimatedDate.setDate(estimatedDate.getDate() + 3); // Add 3 days for estimated delivery
      const deliveryDate = new Date(estimatedDate);
      deliveryDate.setDate(deliveryDate.getDate() + 1); // Add 1 day for actual delivery
  
      // Create new order
      const newOrder = new Order({
        userId,
        productDetails, // Ensure productDetails follows the required schema
        totalPrice,
        paymentMethod,
        orderedDate,
        estimatedDate,
        deliveryDate,
        couponId, // Optional
      });
  
      // Save the order to the database
      const savedOrder = await newOrder.save();
  
      res.status(201).json({
        message: "Order placed successfully",
        order: savedOrder,
      });
    } catch (error) {
      console.error("Error adding order:", error);
      res.status(500).json({ error: error.message });
    }
  }

exports.getUserOrders = async (req, res) => {
    try {
      const { userId } = req.params;
  
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
  
      // Fetch the latest 10 orders for the user, sorted by orderedDate (descending)
      const userOrders = await Order.find({ userId })
        .sort({ orderedDate: -1 }) // Sort by orderedDate in descending order
        .limit(10); // Limit to the latest 10 orders
  
      if (!userOrders.length) {
        return res.status(404).json({ message: "No orders found for this user" });
      }
  
      res.status(200).json({
        message: "Orders fetched successfully",
        orders: userOrders,
      });
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: error.message });
    }
  }


  // cart
exports.addCartProduct= async (req, res) => {
    const { userId, productId, quantity, color, size } = req.body;
  
    try {
      // Check if the product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
  
      // Check if the user has a cart
      let userCart = await UserCart.findOne({ userId });
  
      // If no cart exists, create a new cart
      if (!userCart) {
        userCart = new UserCart({
          userId,
          cartItems: [{
            productId,
            quantity,
            color,
            size,
          }],
        });
        await userCart.save();
        return res.status(201).json({
          message: 'Cart created and item added successfully.',
          cart: userCart,
        });
      }
  
      // If the cart exists, check if the item is already in the cart
      const existingItem = userCart.cartItems.find(
        (item) => item.productId.toString() === productId.toString() && item.color === color && item.size === size
      );
  
      if (existingItem) {
        // Update the quantity of the existing item
        existingItem.quantity = quantity;
        await userCart.save();
        return res.status(200).json({
          message: 'Item quantity updated successfully.',
          cart: userCart,
        });
      } else {
        // Add the new item to the cart
        userCart.cartItems.push({ productId, quantity, color, size });
        await userCart.save();
        return res.status(200).json({
          message: 'Item added to cart successfully.',
          cart: userCart,
        });
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }

exports.getUserCartProduct = async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Find the user's cart
      const userCart = await UserCart.findOne({ userId }).populate({
        path: 'cartItems.productId', // Populate the product details
        select: 'name price images' // Select the relevant fields to return
      });
  
      // If no cart is found, return a 404 error
      if (!userCart) {
        return res.status(404).json({ message: 'Cart not found for this user.' });
      }
  
      // Send the user's cart items
      res.status(200).json({
        message: 'Cart products retrieved successfully.',
        cart: userCart.cartItems,
      });
    } catch (error) {
      console.error('Error retrieving cart:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }

exports.deleteCartProduct= async (req, res) => {
  const { userId, cartItemId } = req.body;

  if (!userId || !cartItemId) {
    return res.status(400).json({
      success: false,
      message: 'userId and cartItemId are required in the request body.',
    });
  }

  try {
    // Remove the specific cart item for the user
    const result = await UserCart.updateOne(
      { userId },
      { $pull: { cartItems: { _id: cartItemId } } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({
        success: true,
        message: 'Cart item deleted successfully.',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Cart item not found or already deleted.',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the cart item.',
      error: error.message,
    });
  }
}


// wishlist

exports.addWishlist=async (req, res) => {
    const { userId, productId, quantity, color, size } = req.body;
  
    // Validation
    if (!userId || !productId || !quantity || !color || !size) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
  
    try {
      // Find or create a wishlist for the user
      let userWishlist = await UserWishlist.findOne({ userId });
  
      if (!userWishlist) {
        userWishlist = new UserWishlist({ userId, wishlistItems: [] });
      }
  
      // Check if the product is already in the wishlist
      const productExists = userWishlist.wishlistItems.some(item => 
        item.productId.toString() === productId && 
        item.size === size && 
        item.color === color
      );
  
      if (productExists) {
        return res.status(400).json({ message: 'Product already in the wishlist.' });
      }
  
      // Add new item to the wishlist
      userWishlist.wishlistItems.push({ productId, quantity, color, size });
  
      // Save the wishlist
      await userWishlist.save();
  
      res.status(200).json({
        message: 'Product added to wishlist successfully.',
        wishlist: userWishlist,
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }

exports.userWishlist= async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Find the user's wishlist
      const userWishlist = await UserWishlist.findOne({ userId }).populate({
        path: 'wishlistItems.productId', // Populate the product details
        select: 'name price images' // Select relevant fields
      });
  
      // If no wishlist is found, return a 404 error
      if (!userWishlist) {
        return res.status(404).json({ message: 'Wishlist not found for this user.' });
      }
  
      // Send the user's wishlist items
      res.status(200).json({
        message: 'Wishlist products retrieved successfully.',
        wishlist: userWishlist.wishlistItems,
      });
    } catch (error) {
      console.error('Error retrieving wishlist:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }



