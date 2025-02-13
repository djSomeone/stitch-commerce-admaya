const app = require("express");
const router=app.Router();
const dashboardController=require("../controller/dashboard.controller");


// this is for the card details
router.get("/orderDetails",dashboardController.getOrderStats);

// this is for the time line data for the revenue
router.get("/revenue",dashboardController.getRevenueStats)

module.exports= router;