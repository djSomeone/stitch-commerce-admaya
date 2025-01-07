const app = require("express");
const User = require('../model/user.model'); // Assuming you have a User model
const router=app.Router()
const userController=require("../controller/user.controller")
const uploadImageToCloudinary = require('../middleware/uploadImage');
const multer = require('multer');
// console.log("before cloudinary")
const cloudinary = require('cloudinary').v2;
// console.log("after cloudinary")
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// // Multer middleware to handle file upload
const storage = multer.memoryStorage(); // Store file in memory for direct Cloudinary upload
const upload = multer({ storage });
// router.use(authenticateToken);
//make loging api for the user
router.post("/login",userController.login);

//make verify otp api for the user
router.post("/verifyOtp", userController.verifyOtp);

// register user
router.post("/register", userController.register);

//upload user banner
router.post("/upload", upload.single('image'), userController.uploadBanner);

//get user banner
router.get("/banner", userController.getBanner);

// add product
router.post("/addProduct", upload.single('image'),uploadImageToCloudinary, userController.addProduct);
module.exports= router;
