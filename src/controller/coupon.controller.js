const Coupon = require("../model/coupon.model");

exports.addCoupon = async (req, res) => {
    const { name, limit, description, expiryDate } = req.body;
  
    // Validate input
    if (!name || !limit || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Name, limit, and expiryDate are required fields.",
      });
    }
  
    try {
      // Create a new Coupon instance
      const newCoupon = new Coupon({
        name,
        limit,
        description,
        expiryDate,
      });
  
      // Save the coupon (unique code is generated in the schema middleware)
      const savedCoupon = await newCoupon.save();
  
      res.status(201).json({
        success: true,
        message: "Coupon added successfully.",
        coupon: savedCoupon,
      });
    } catch (error) {
      // Handle duplicate code or validation errors
      res.status(500).json({
        success: false,
        message: "An error occurred while adding the coupon.",
        error: error.message,
      });
    }
  };

exports.listCoupons=async (req, res)=>{
    try {
      const coupons = await Coupon.find(); // Fetch all coupons from the database
      res.status(200).json({
        success: true,
        message: "Coupons retrieved successfully.",
        coupons,
      });
    } catch (error) {
      console.error("Error retrieving coupons:", error);

      res.status(500).json({
        success: false,
        message: "An error occurred while retrieving coupons.",
        error: error.message,
      });
    }
  };

exports.deleteCoupone= async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon deleted successfully', coupon: deletedCoupon });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
}