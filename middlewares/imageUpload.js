const multer = require("multer");

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, next) => {
    next(null, "uploads/");
  },
  filename: (req, file, next) => {
    if (!file || !file.originalname) {
      next(new Error("No file provided or file is empty"));
    } else {
      next(null, Date.now() + "_" + file.originalname);
    }
  },
});

// Create the multer instance
const imageUpload = multer({ storage: storage });

module.exports = imageUpload;
