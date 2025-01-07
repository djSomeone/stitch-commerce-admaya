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
const uploadImageToCloudinary = (req, res, next) => {
    console.log("this is the req file==>",req.file)
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileBuffer = req.file.buffer;
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'products', // Specify the folder in Cloudinary
      resource_type: 'image',
      public_id: `product_${Date.now()}`, // Optionally customize the filename
    },
    (error, result) => {
      if (error) {
        return res.status(500).json({ error: 'Error uploading image' });
      }
      // Attach the Cloudinary image URL to the request object for the next middleware
      req.imageUrl = result.secure_url;
      next();
    }
  );

  // Pipe the image buffer into the Cloudinary upload stream
  streamifier.createReadStream(fileBuffer).pipe(stream);
};

module.exports = uploadImageToCloudinary;
