const User=require("../model/user.model");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateJwtToken = (user) => {
    return jwt.sign({ user }, process.env.JWTS_KEY, { expiresIn: "7d" });
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}
exports.login=async (req, res) => {
    const email = req.body.email;
    const otp = generateOTP();

    try {
        let user = await User.findOne({ email: email });

        if (user) {
            user.otp = otp;
        } else {
            return res.status(404).json({ message: "User not found" });
        }

        const userData=await user.save();

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
        console.log("this is the errro==>",err)
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
exports.verifyOtp=async (req, res) => {
    const email = req.body.email;
    const otp = req.body.otp;
    console.log("this is the otp==>",otp)
    
    try {
        const user = await User.findOne({ email: email });
        console.log("this is the user.otp==>",user.otp)
        if (!user) {
            return res.status(404).json({"message":"User not found"});
        }else if (user.otp !== otp) {
            return res.status(403).json({"message":"Invalid OTP"});
        }else{
            
            user.isVerified = true;
             // Clear the OTP after verification
            await user.save();
            console.log("this is the user==>",user)
            const token = generateJwtToken(user);
            console.log("this is the token==>",token)
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
        console.log("this is the errro==>",err)
        res.status(500).send("Error verifying OTP");
    }
}
