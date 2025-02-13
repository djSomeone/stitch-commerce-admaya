const Order = require("../model/order.model"); // Import the Order model

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