const multer  = require('multer');
const path = require('path');


// Set up storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads')); // Uploads folder will be created automatically
  },
  filename: function (req, file, cb) {
    // Appending the current timestamp to make filenames unique
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create multer instance with storage configuration
const upload = multer({ storage: storage });



module.exports = {
  upload
};
