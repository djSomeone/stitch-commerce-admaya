const express = require('express');
const userRoute=require("./src/route/user.js")
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors')
const morgan = require('morgan')
const app = express();
const port = 3000;

// this is for the connection of the database
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  
}).then(() => {
    console.log("Database connected successfully");
}).catch((err) => {
    console.log(err);
});
// for loging the rq,rs
app.use(morgan("combined"))
// this is for the access for the client to use the response else browser will block the response
app.use(cors())
// this adds middel ware to the all routes 
app.use(express.json())
app.use('/user',userRoute)
app.get("/",(req,res)=>{
    res.send("Nothing is here.")
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});