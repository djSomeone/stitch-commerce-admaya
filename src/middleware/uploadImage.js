const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// console.log("before cloudinary")
// console.log("after cloudinary")
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});



// Set up multer storage (in-memory)
const storage = multer.memoryStorage();

// const upload = multer({ storage: storage });

// Middleware to upload image to Cloudinary
const uploadImagesToCloudinary = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const uploadPromises = req.files.map((file, index) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'products', // Specify the folder in Cloudinary
            resource_type: 'image',
            public_id: `product_image_${Date.now()}_${index}`, // Optionally customize the filename
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );

        // Pipe the image buffer into the Cloudinary upload stream
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
    });

    // Wait for all images to upload
    const imageUrls = await Promise.all(uploadPromises);

    // Attach the Cloudinary image URLs to the request object for the next middleware
    req.imageUrls = imageUrls;
    next();
  } catch (error) {
    console.error('Error uploading images:', error);
    return res.status(500).json({ error: 'Error uploading images' });
  }
};

module.exports = uploadImagesToCloudinary;
