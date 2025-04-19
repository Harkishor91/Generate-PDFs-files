const express = require("express");
const router = express.Router();
const {
  uploadDocument,
  fetchDocument,
  generatePdf,
} = require("../controllers/documentController");
const imageUpload = require("../middlewares/imageUpload");
const authMiddleware = require("../middlewares/userAuthentication");

// Route for upload document
router.post(
  "/document",
  authMiddleware,
  imageUpload.single("pdfUrl"),
  uploadDocument
);

// Route for fetch document
router.get("/document", authMiddleware, fetchDocument);

// Route for generate pdf file
router.get("/document/generate", authMiddleware, generatePdf);

module.exports = router;
