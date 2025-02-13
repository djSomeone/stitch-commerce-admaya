const Order = require("../model/order.model"); // Import the Order model
const Product = require("../model/product.model"); // Import the Product model


// this is for the order detail analitics
exports.getOrderStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Ensure both startDate and endDate are provided
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required." });
        }

        // Convert to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate date range
        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
        }

        // Ensure the end date is after the start date
        if (start > end) {
            return res.status(400).json({ message: "End date must be after start date." });
        }

        // Aggregate to get total orders and revenue in the given range
        const orderStats = await Order.aggregate([
            {
                $match: {
                    orderedDate: { $gte: start, $lte: end }, // Filter orders in date range
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 }, // Count orders
                    totalRevenue: { $sum: "$totalPrice" }, // Sum of totalPrice
                }
            }
        ]);

        // Default response if no orders found
        const result = orderStats.length > 0 ? orderStats[0] : { totalOrders: 0, totalRevenue: 0 };

        res.status(200).json({
            message: "success",
            status: 200,
            data: result,
        });

    } catch (error) {
        console.error("Error fetching order stats:", error.message);
        res.status(500).json({
            message: "An error occurred while fetching order statistics.",
            error: error.message,
        });
    }
};

// this is for the getting graph data for the revenue
exports.getRevenueStats=async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate date inputs
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required." });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
        }
        if (start > end) {
            return res.status(400).json({ message: "End date must be after start date." });
        }

        // Aggregate orders within date range and group by date
        const revenueData = await Order.aggregate([
            {
                $match: {
                    orderedDate: { $gte: start, $lte: end },
                    "paymentDetails.paymentStatus": "completed" // Only count completed payments
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$orderedDate" }
                    },
                    dailyRevenue: { $sum: "$totalPrice" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // Sort by date (ascending)
        ]);

        // Format the response
        const formattedData = revenueData.map(entry => ({
            date: entry._id,
            revenue: entry.dailyRevenue,
            totalOrders: entry.orderCount
        }));

        res.status(200).json({
            message: "success",
            status: 200,
            data: formattedData
        });

    } catch (error) {
        console.error("Error fetching revenue data:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// tis is for the tranding products on the bases of the visit
exports.trandingProducts=async (req, res) => {
    try {
        const { limit } = req.query;
        const productLimit = parseInt(limit) || 5; // Default limit is 10 if not specified

        // Fetch products sorted by visit count (converted to a number)
        const trendingProducts = await Product.find()
            .sort({ visit: -1 }) // Sorting by highest visit count
            .limit(productLimit); // Limiting results based on query param

        res.status(200).json({
            message: "success",
            status: 200,
            data: trendingProducts
        });

    } catch (error) {
        console.error("Error fetching trending products:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// category sell count 
exports.categorySellCount=async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "startDate and endDate are required." });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Ensure full day coverage

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: "Invalid date format." });
        }

        // Aggregation to count sold products by category
        const categorySales = await Order.aggregate([
            {
                $match: {
                    orderedDate: { $gte: start, $lte: end }
                }
            },
            {
                $unwind: "$productDetails" // Deconstructs productDetails array
            },
            {
                $lookup: {
                    from: "products", // Join with Product collection
                    localField: "productDetails.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            {
                $unwind: "$productInfo"
            },
            {
                $group: {
                    _id: "$productInfo.categories", // Group by category
                    totalSold: { $sum: "$productDetails.quantity" } // Sum quantity sold
                }
            },
            {
                $project: {
                    category: "$_id",
                    totalSold: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            message: "success",
            status: 200,
            data: categorySales
        });

    } catch (error) {
        console.error("Error fetching category sales:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// best selling products 
exports.bestSellingProducts=async (req, res) => {
    try {
        const { startDate, endDate, limit =4 } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "startDate and endDate are required." });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Ensure full-day coverage

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: "Invalid date format." });
        }

        // Aggregation pipeline to find best-selling products
        const bestSellingProducts = await Order.aggregate([
            {
                $match: {
                    orderedDate: { $gte: start, $lte: end }
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $group: {
                    _id: "$productDetails.productId",
                    totalSold: { $sum: "$productDetails.quantity" },
                    totalOrders: { $sum: 1 } // Counting number of orders containing the product
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            {
                $unwind: "$productInfo"
            },
            {
                $project: {
                    _id: 0,
                    productId: "$productInfo._id",
                    name: "$productInfo.name",
                    category: "$productInfo.categories",
                    price: "$productInfo.price",
                    totalSold: 1,
                    totalOrders: 1,
                    totalVisits: "$productInfo.visits", // Assuming "visits" is a field in the Product schema
                    totalStockRemaining: {
                        $sum: "$productInfo.sizes.quantity" // Summing stock across all sizes
                    }
                }
            },
            {
                $sort: { totalSold: -1 }
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        res.status(200).json({
            message: "success",
            status: 200,
            data: bestSellingProducts
        });

    } catch (error) {
        console.error("Error fetching best-selling products:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}