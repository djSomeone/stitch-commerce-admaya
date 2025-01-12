const User = require("../model/user.model");
const jwt = require("jsonwebtoken");
const cloudinary = require('cloudinary').v2;
const Banner = require('../model/banner.model');
const Product = require('../model/product.model');

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

//add product 
// exports.addProduct = async (req, res) => {
//     try {
//         const {
//             name,
//             price,
//             pattern,
//             fabric,
//             colors,
//             sizes,
//             description,
//             categories,
//             fit,

//             subcategory,
//         } = req.body;
//         console.log("this is the req.body==>", req.body)

//         // Validate request body
//         if (!(name || price || pattern || fabric || colors || sizes || description || categories || fit || subcategory)) {
//             return res.status(400).json({ error: 'All required fields must be provided' });
//         }

//         // Create and save product
//         const product = new Product({
//             name,
//             price,
//             pattern,
//             fabric,
//             colors,
//             sizes,
//             description,
//             categories,
//             fit,
//             image: req.imageUrl,
//             subcategory,
//         });

//         const savedProduct = await product.save();

//         res.status(201).json({ message: 'Product added successfully', product: savedProduct });
//     } catch (error) {
//         console.error('Error adding product:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }
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
        image:req.imageUrl,
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



//   name:Stylish Kurti
//   price:599
//   pattern:Printed
//   fabric:Cotton
//   colors:Red,Blue,Green
//   sizes:[{"size":"M","quantity":10},{"size":"L","quantity":5}]
//   description:Beautiful printed kurti for casual wear.
//   categories:Casual Wear
//   fit:Regular Fit
//   subcategory:Kurti


