const User=require("../model/user.model");

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
            user = new User({
                email: email,
                otp: otp,
                
            });
        }

        const userData=await user.save();

        // Send OTP to the user
        res.json({
            message: "OTP sent successfully",
            data:userData
        });
    } catch (err) {
        console.log("this is the errro==>",err)
        res.status(500).send("Error storing OTP");
    }
};

//verify otp 
exports.verifyOtp=async (req, res) => {
    const email = req.body.email;
    const otp = req.body.otp;

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({"message":"User not found"});
        }else if (user.otp !== otp) {
            return res.status(403).json({"message":"Invalid OTP"});
        }else{
            return res.status(200).json({
                message:"OTP verified successfully",
                data:user
            });
        }
    } catch (err) {
        console.log("this is the errro==>",err)
        res.status(500).send("Error verifying OTP");
    }
}
