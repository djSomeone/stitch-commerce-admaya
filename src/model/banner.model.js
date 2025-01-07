
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
    url: {
        type: String,
        required: true
    }
});

Banner = mongoose.model("Banner", bannerSchema);
module.exports = Banner;

