const app = require("express");
const router=app.Router()
const userController=require("../controller/user.controller")
const authenticateToken = require('../middleware/verifyToken');
const multer = require('multer');


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

// get user list
router.get("/list", userController.listUsers);

//get user details by id
router.get("/details/:userId", userController.getUserDetails);



//upload user banner
router.post("/upload", upload.single('image'), userController.uploadBanner);

//get user banner
router.get("/banner", userController.getBanner);

//place order
router.post("/create-order",authenticateToken, userController.createOrder1);

//verify payment
router.post("/verify-payment",authenticateToken, userController.verifyPayment1);


//get user order
router.get("/user-orders/:userId",authenticateToken, userController.getUserOrders);

// order list
router.get("/order-list", userController.orderList);

// update the order status
router.put("/update-order/:orderId",userController.updateOrderStatus);




//add to cart
router.post("/addToCart",authenticateToken, userController.addCartProduct);

//get cart product
router.get("/getCartProduct/:userId",authenticateToken, userController.getUserCartProduct);

//delete cart product
router.delete("/deleteCartProduct",authenticateToken, userController.deleteCartProduct);

//add wishlist(remaining to test)
router.post("/addToWishlist",authenticateToken, userController.addWishlist);

//get user wishlist
router.get("/wishlist/:userId",authenticateToken, userController.userWishlist);

//delete wishlist
router.delete("/deleteWishlist",authenticateToken, userController.deleteWishlistItem);


// add user address
router.post("/addAddress",authenticateToken, userController.addUserAddress);

//get user address
router.get("/getUserAddresses/:userId",authenticateToken, userController.getUserAddresses);

// update user address
router.post("/updateAddress",authenticateToken, userController.updateUserAddress);

// add contact us
router.post("/addContactUs", userController.addContactUs);

// get contact us
router.get("/getContactUs", userController.getAllContactUsMessages);

//add exchange
router.post("/addExchange",authenticateToken, userController.addExchangeProduct);

// list exchange
router.get("/listExchange", userController.listExchange);



//filter product
router.get("/filterProduct", userController.filterProduct);

// cancel product
router.post("/cancelProductExchange",authenticateToken, userController.cancelExchange);


// review for the product
router.post("/productReview",userController.addProductReview);

router.get("/productReviewDetails/:productId",userController.productReviewDetail);

router.get("/product/:productId/user/:userId/review",authenticateToken,userController.hasUserReviewedProduct);

router.put("/product/:productId/user/:userId/updateReview", authenticateToken,userController.updateProductReview);

module.exports= router;
