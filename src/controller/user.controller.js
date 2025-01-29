const User = require("../model/user.model");
const jwt = require("jsonwebtoken");
const cloudinary = require('cloudinary').v2;
const Banner = require('../model/banner.model');
const Product = require('../model/product.model');
const Order = require('../model/order.model');
const UserCart = require('../model/userCart.model');
const UserWishlist = require('../model/wishlist.model');
const UserAddress = require('../model/addresses.model');
const ContactUs = require('../model/contactUs.model');
const nodemailer = require('nodemailer');
const Razorpay = require("razorpay");
const crypto = require('crypto');
// const moment = require('moment');

require("dotenv").config();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
   host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

async function sendOTPEmail(email, otp) {
    const mailOptions = {
        from: '"Irise" <Iriswomenonline@gmail.com>',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`
    };

    await transporter.sendMail(mailOptions);
}

const generateJwtToken = (user) => {
    return jwt.sign({ user }, process.env.JWTS_KEY, { expiresIn: "7d" });
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}
// user login with email

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

      // Send OTP email
      await sendOTPEmail(email, otp);

      res.json({
          message: "OTP sent successfully",
          data: {
              id: userData._id,
              email: userData.email,
              name: userData.name
          }
      });
  } catch (err) {
      console.log("this is the error==>", err);
      res.status(500).send("Error storing or sending OTP");
  }
};

// exports.login = async (req, res) => {
//     const email = req.body.email;
//     const otp = generateOTP();

//     try {
//         let user = await User.findOne({ email: email });

//         if (user) {
//             user.otp = otp;
//         } else {
//             return res.status(404).json({ message: "User not found" });
//         }

//         const userData = await user.save();

//         // Send OTP to the user
//         res.json({
//             message: "OTP sent successfully",
//             data: {
//                 id: userData._id,
//                 email: userData.email,
//                 name: userData.name
//             }
//         });
//     } catch (err) {
//         console.log("this is the errro==>", err)
//         res.status(500).send("Error storing OTP");
//     }
// };
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

              // Send OTP Email
              await sendOTPEmail(email, otp);

              return res.status(200).json({
                  message: "OTP updated successfully and sent via email",
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

      // Send OTP Email
      await sendOTPEmail(email, otp);

      res.status(201).json({
          message: "User registered successfully and OTP sent via email",
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
// exports.placeOrder=async (req, res) => {
//     try {
//       const { userId, productDetails, totalPrice, paymentMethod, couponId } = req.body;
  
//       // Validate input fields
//       if (!userId || !productDetails || !totalPrice || !paymentMethod) {
//         return res.status(400).json({ error: "Missing required fields" });
//       }
  
//       // Calculate dates
//       const orderedDate = new Date();
//       const estimatedDate = new Date(orderedDate);
//       estimatedDate.setDate(estimatedDate.getDate() + 3); // Add 3 days for estimated delivery
//       const deliveryDate = new Date(estimatedDate);
//       deliveryDate.setDate(deliveryDate.getDate() + 1); // Add 1 day for actual delivery
  
//       // Create new order
//       const newOrder = new Order({
//         userId,
//         productDetails, // Ensure productDetails follows the required schema
//         totalPrice,
//         paymentMethod,
//         orderedDate,
//         estimatedDate,
//         deliveryDate,
//         couponId, // Optional
//       });
  
//       // Save the order to the database
//       const savedOrder = await newOrder.save();
  
//       res.status(201).json({
//         message: "Order placed successfully",
//         order: savedOrder,
//       });
//     } catch (error) {
//       console.error("Error adding order:", error);
//       res.status(500).json({ error: error.message });
//     }
//   }
// create order
exports.createOrder =  async (req, res) => {
  const { userId, productDetails, totalPrice, paymentMethod, couponId,addressId } = req.body;

  if (!totalPrice || totalPrice <= 0) {
    return res.status(400).json({ error: "Invalid total price" });
  }

  try {
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalPrice * 100, // Amount in paisa (multiply by 100)
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    // Save order in MongoDB with Razorpay order ID
    const order = new Order({
      userId,
      productDetails,
      totalPrice,
      // paymentMethod,
      paymentDetails: {
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: "pending",
      },
      orderStatus: "ordered",
      couponId,
      addressId,
      orderedDate: new Date(),
      estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Example: 7 days from now
    });

    await order.save();

    res.status(201).json({
      success: true,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//verifyPayment
exports.verifyPayment = async (req, res) => {
  const {
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    orderId,
    userId,  // Added userId to the request body
  } = req.body;

  try {
    // Generate signature to verify payment
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Find order by both orderId and userId
    const order = await Order.findOne({ _id: orderId, userId: userId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Update the order document with payment details
    order.paymentDetails = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentStatus: "completed",
    };
    order.paymentDate = new Date();

    await order.save();

    res.status(200).json({ success: true, message: "Payment verified and order updated" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


//get user order
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch the latest 10 orders for the user with payment status completed
    const userOrders = await Order.find({
      userId,
      "paymentDetails.paymentStatus": "completed",
    })
      .sort({ orderedDate: -1 }) // Sort by orderedDate in descending order
      .limit(10); // Limit to the latest 10 orders

    if (!userOrders.length) {
      return res.status(404).json({ message: "No completed orders found for this user" });
    }

    res.status(200).json({
      message: "Completed orders fetched successfully",
      orders: userOrders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: error.message });
  }
};



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
      const productExists = userWishlist.wishlistItems.find(item => 
        item.productId.toString() === productId && 
        item.size === size && 
        item.color === color
      );
  
      if (productExists) {
        productExists.quantity = quantity;
        await userWishlist.save();
        return res.status(200).json({ message: 'Product updated in the wishlist.' ,wishlist: userWishlist });
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

exports.deleteWishlistItem = async (req, res) => {
    const { userId, wishlistItemId } = req.body;
  
    // Validation for missing fields
    if (!userId || !wishlistItemId) {
      return res.status(400).json({
        success: false,
        message: 'userId and wishlistItemId are required in the request body.',
      });
    }
  
    try {
      // Remove the specific wishlist item for the user
      const result = await UserWishlist.updateOne(
        { userId },
        { $pull: { wishlistItems: { _id: wishlistItemId } } }
      );
  
      // If the item was deleted
      if (result.modifiedCount > 0) {
        res.status(200).json({
          success: true,
          message: 'Wishlist item deleted successfully.',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Wishlist item not found or already deleted.',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'An error occurred while deleting the wishlist item.',
        error: error.message,
      });
    }
  }
  

// user address

exports.addUserAddress= async (req, res) =>{
  const { userId, address } = req.body;

  if (!userId || !address) {
    return res.status(400).json({
      success: false,
      message: "userId and address are required.",
    });
  }

  try {
    // Check if the user already has an address record
    let userAddress = await UserAddress.findOne({ userId });

    if (userAddress) {
      // Validate the limit of 5 addresses
      if (userAddress.addresses.length >= 5) {
        return res.status(400).json({
          success: false,
          message: "You can only save up to 5 addresses.",
        });
      }

      // If `isDefault` is true, ensure no other address is marked as default
      if (address.isDefault) {
        userAddress.addresses.forEach((addr) => (addr.isDefault = false));
      }

      // Add the new address to the user's address list
      userAddress.addresses.push(address);
    } else {
      // Create a new address record for the user
      userAddress = new UserAddress({
        userId,
        addresses: [address],
      });
    }

    const savedAddress = await userAddress.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully.",
      addresses: savedAddress.addresses,
    });
  } catch (error) {
    console.error("Error adding address:", error);

    res.status(500).json({
      success: false,
      message: "An error occurred while adding the address.",
      error: error.message,
    });
  }
};

exports.getUserAddresses=async(req, res)=> {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId is required.",
    });
  }

  try {
    const userAddress = await UserAddress.findOne({ userId });

    if (!userAddress) {
      return res.status(404).json({
        success: false,
        message: "No addresses found for this user.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Addresses retrieved successfully.",
      addresses: userAddress.addresses,
    });
  } catch (error) {
    console.error("Error retrieving addresses:", error);

    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the addresses.",
      error: error.message,
    });
  }
};

exports.updateUserAddress = async (req, res) => {
  const { userId, addressId, updatedDetails } = req.body;

  // Validate the request body
  if (!userId || !addressId || !updatedDetails) {
    return res.status(400).json({
      success: false,
      message: 'userId, addressId, and updatedDetails are required in the request body.',
    });
  }

  try {
    // Find the user's address book
    const userAddress = await UserAddress.findOne({ userId });

    if (!userAddress) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Find the index of the address to update in the user's addresses array
    const addressIndex = userAddress.addresses.findIndex(
      (address) => address._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    // Update the address with the new details
    userAddress.addresses[addressIndex] = {
      ...userAddress.addresses[addressIndex].toObject(), // Convert to object to merge
      ...updatedDetails, // Merge updated details with the existing address
    };

    // Save the updated address book
    await userAddress.save();

    // Respond with success and the updated address
    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      updatedAddress: userAddress.addresses[addressIndex],
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the address.',
      error: error.message,
    });
  }
};

// contact us

exports.addContactUs = async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  if (!firstName || !lastName || !email || !phone || !message) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required.',
    });
  }

  try {
    const newContactMessage = new ContactUs({
      firstName,
      lastName,
      email,
      phone,
      message,
    });

    await newContactMessage.save();

    res.status(200).json({
      success: true,
      message: 'Your message has been submitted successfully.',
    });
  } catch (error) {
    console.error('Error submitting contact message:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your message.',
      error: error.message,
    });
  }
};

// get all contact us messages

exports.getAllContactUsMessages = async (req, res) => {
  try {
    const contactMessages = await ContactUs.find();

    res.status(200).json({
      success: true,
      message: 'Contact messages retrieved successfully.',
      messages: contactMessages,
    });
  } catch (error) {
    console.error('Error retrieving contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving contact messages.',
      error: error.message,
    });
  }
};

//filter product (panding )

exports.filterProduct = async (req, res) => {
  const { category, subcategory, minPrice, maxPrice, colors, size } = req.query;

  // Build filter object based on the query parameters
  const filter = {};

  if (category) {
    filter.categories = category;
  }
  
  if (subcategory) {
    filter.subcategory = subcategory;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) {
      filter.price.$gte = minPrice; // Greater than or equal to minPrice
    }
    if (maxPrice) {
      filter.price.$lte = maxPrice; // Less than or equal to maxPrice
    }
  }

  if (colors) {
    filter.colors = { $in: colors.split(',') }; // Filter by colors (split if multiple colors)
  }

  if (size) {
    filter['sizes.size'] = size; // Filter by size (size is nested in 'sizes' array)
  }

  try {
    // Get products from the database based on the filter criteria
    let products;

    // If there are no filters, return a maximum of 50 products
    if (Object.keys(filter).length === 0) {
      products = await Product.find().limit(50); // Limit to 50 products if no filters are applied
    } else {
      products = await Product.find(filter); // If filters are applied, apply them
    }

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found matching the criteria.' });
    }

    // Send filtered products as response
    res.status(200).json({
      message: 'Filtered products fetched successfully.',
      products,
    });
  } catch (error) {
    console.error('Error fetching filtered products:', error);
    res.status(500).json({
      message: 'An error occurred while fetching filtered products.',
      error: error.message,
    });
  }
}

exports.addExchangeProduct = async (req, res) => {
  // const { orderId } = req.params;
  const { orderId,productId, reasonForExchange, problem, size, color, arrivalDate } = req.body;

  try {
    // Find the order by orderId
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the product in the order's product details
    const productDetails = order.productDetails.find(
      (product) => product.productId.toString() === productId.toString()
    );

    if (!productDetails) {
      return res.status(400).json({ message: 'Product not found in the order' });
    }

    // Create the exchange object
    const newExchange = {
      productId,
      reasonForExchange,
      problem,
      size: size || productDetails.size, // Optional, if size doesn't change
      color: color || productDetails.color, // Optional, if color doesn't change
      arrivalDate,
      exchangeStatus: 'ordered', // Set default status to 'ordered'
    };

    // Add the exchange to the order's exchanges array
    order.exchanges.push(newExchange);

    // Save the updated order
    await order.save();

    // Return the updated order
    res.json({
      message: 'Exchange added successfully',
      order: order,
    });
  } catch (error) {
    console.error('Error adding exchange:', error);
    res.status(500).json({ error: 'Server error' });
  }
};