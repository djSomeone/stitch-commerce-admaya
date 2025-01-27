const app = require("express");
const router=app.Router()
const CouponController=require("../controller/coupon.controller")

router.post("/addCoupon", CouponController.addCoupon);
router.get("/listCoupons", CouponController.listCoupons);
module.exports= router;