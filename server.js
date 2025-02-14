const express = require('express');
const userRoute=require("./src/route/user.js")
const dashboardRoute=require("./src/route/dashbooard.js")
const productRoute=require("./src/route/product.js")
const homeRoute=require("./src/route/home.js")
const couponRoute=require("./src/route/coupon.js")
const mongoose = require('mongoose');
// const helmet = require('helmet');
require('dotenv').config();
const cors = require('cors')
const morgan = require('morgan')
const app = express();
const port = 3000;


const cloudinary = require('cloudinary').v2;
// console.log("after cloudinary")
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


// this is for the connection of the database
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  
}).then(() => {
    console.log("Database connected successfully");
}).catch((err) => {
    console.log(err);
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


// for loging the rq,rs
app.use(morgan("combined"))
// this is for the access for the client to use the response else browser will block the response
app.use(cors())
// this adds middel ware to the all routes 
// app.use(express.json())
app.use('/dashboard',dashboardRoute)
app.use('/user',userRoute)
app.use('/product',productRoute)
app.use('/home',homeRoute)
app.use('/coupon',couponRoute)

app.get("/",(req,res)=>{
    res.send("Nothing is here.")
})



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});