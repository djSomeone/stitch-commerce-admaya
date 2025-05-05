
const app = require("express");
const router=app.Router()
const productController=require("../controller/product.controller")
const uploadImagesToCloudinary = require('../middleware/uploadImage');
const multer = require('multer');
const authenticateToken = require('../middleware/verifyToken');
// console.log("before cloudinary")


// // Multer middleware to handle file upload
const storage = multer.memoryStorage(); // Store file in memory for direct Cloudinary upload
const upload = multer({ storage });

// router.use();
// add product
router.post("/addProduct", upload.array('images', 2),uploadImagesToCloudinary, productController.addProduct);

//list product
router.get("/allProduct",authenticateToken,productController.allProducts);

//product detail
router.get("/getProductDetail/:id",productController.getProductDetail);

router.delete("/deleteProduct/:id",authenticateToken,productController.deleteProduct)
module.exports= router;