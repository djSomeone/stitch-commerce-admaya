const Product = require('../model/product.model');
const Order = require('../model/order.model');
const moment = require('moment');


exports.latestArrivals = async (req, res) => {
    try {
        const latestProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id name price images');
        const response = {
            message: "success",
            status: 200,
            data: latestProducts

        }
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.topCollection = async (req, res) => {
  try {
    // Get the date for one month ago
    const lastMonth = moment().subtract(1, "month").startOf("month").toDate();
    const endOfLastMonth = moment().subtract(1, "month").endOf("month").toDate();

    // Aggregate orders from the last month
    let orders = await Order.aggregate([
      {
        $match: {
          orderedDate: {
            $gte: lastMonth,
            $lte: endOfLastMonth,
          },
        },
      },
      {
        $unwind: "$productDetails", // Unwind the productDetails array
      },
      {
        $group: {
          _id: "$productDetails.productId", // Group by productId
          totalQuantity: { $sum: "$productDetails.quantity" }, // Sum the quantity
        },
      },
      {
        $sort: { totalQuantity: -1 }, // Sort by quantity in descending order
      },
      {
        $limit: 5, // Limit to top 5 products
      },
      {
        $lookup: {
          from: "products", // Reference to the Product collection
          localField: "_id", // The _id field in the result
          foreignField: "_id", // The _id field in the Product collection
          as: "product", // Include product details in the result
        },
      },
      {
        $unwind: "$product", // Unwind the product array to get product details
      },
      {
        $project: {
          productId: "$_id",
          productName: "$product.name",
          totalQuantity: 1,
          price: "$product.price",
          category: "$product.categories",
          images:"$product.images",
        },
      },
    ]);

    // If fewer than 5 products are found, fetch random products
    if (orders.length < 5) {
      const remainingCount = 5 - orders.length;
      const fallbackProducts = await Product.aggregate([
        { $sample: { size: remainingCount } }, // Fetch random products
        {
          $project: {
            productId: "$_id",
            productName: "$name",
            totalQuantity: { $literal: 0 }, // Set default totalQuantity as 0
            price: "$price",
            category: "$categories",
            images:"$images",
          },
        },
      ]);

      // Combine the top products with fallback products
      orders = [...orders, ...fallbackProducts];
    }

    // Respond with the products
    res.status(200).json({
      message: "Top products fetched successfully",
      products: orders,
    });
  } catch (error) {
    console.error("Error fetching top products:", error);
    res.status(500).json({ error: error.message });
  }
};