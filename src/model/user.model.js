const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name:{
        type:String,
        required:true
    },
    otp: {
        type: Number,
        required: true,
        
    },
    isVerified: {
        type: Boolean,
        default: false
    }
   
});

const User = mongoose.model('User', userSchema);

module.exports = User;