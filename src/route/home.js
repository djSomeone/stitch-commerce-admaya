
const app = require("express");
const router=app.Router()
const homeController=require("../controller/home.controlller")

router.get("/latestArrivals", homeController.latestArrivals);
router.get("/topCollection", homeController.topCollection);

module.exports= router;