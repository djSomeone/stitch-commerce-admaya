const app = require("express");
const router=app.Router();
const dashboardController=require("../controller/dashboard.controller");
const productController=require("../controller/product.controller");



// this is for the card details
router.get("/orderDetails",dashboardController.getOrderStats);

// this is for the time line data for the revenue
router.get("/revenue",dashboardController.getRevenueStats);

// this is for the tranding products
router.get("/trandingProducts",dashboardController.trandingProducts);

// category sell count 
router.get("/categorySellCount",dashboardController.categorySellCount);

// best selling product
router.get("/bestSellingProducts",dashboardController.bestSellingProducts);

router.get("/listProducts",productController.allProducts)



module.exports= router;