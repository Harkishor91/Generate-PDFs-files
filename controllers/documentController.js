const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const pdfParse = require("pdf-parse");
const Document = require("../models/document");
const statusCodes = require("../utils/statusCode");

// Upload a PDF, extract text + links, save to DB
const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filePath = req.file?.path;

    if (!filePath) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "Document is required",
      });
    }

    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const extractedUrls = pdfData.text.match(urlRegex) || [];

    const newDocument = new Document({
      userId,
      pdfUrl: filePath,
      pdfContent: pdfData.text,
      extractedUrls,
    });

    await newDocument.save();

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: "Document uploaded successfully",
      data: newDocument,
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Fetch all documents
const fetchDocument = async (req, res) => {
  try {
    const documents = await Document.find();

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: "Fetched documents successfully",
      data: documents,
      totalDocuments: documents.length,
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Generate a static PDF file with user data
const generatePdf = (req, res) => {
  try {
    const userInfo = req.user;

    const doc = new PDFDocument();

    // Use current date and time for unique file name
    const uniquePdfName = `${userInfo.firstName}_${
      userInfo.lastName
    }_${new Date().getTime()}.pdf`;

    // Define file path
    const filePath = path.join(__dirname, `../uploads/${uniquePdfName}`);

       const formattedDate = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    

    // Create uploads folder if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add content
    doc.fontSize(20).text("User Detail PDF", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(14).text(`First name: ${userInfo.firstName || "-"}`);
    doc.text(`Last name: ${userInfo.lastName || "-"}`);
    doc.text(`Email: ${userInfo.email || "-"}`);
    doc.text(`Role: ${userInfo.userRole || "-"}`);
    doc.text(`Verification Status: ${userInfo.isVerify}`);

    // Calculate bottom position for footer
    const bottomY = doc.page.height - 50;

    // Add footer at bottom-left
    doc.fontSize(12).text(`PDF generated: ${formattedDate}`, 50, bottomY, {
      align: "left",
      lineBreak: false,
    });
  
    doc.end();

    // Handle stream events
    writeStream.on("finish", () => {
      return res.status(statusCodes.OK).json({
        status: statusCodes.OK,
        message: "PDF generated successfully",
        // pdfPath: filePath,
      });
    });

    writeStream.on("error", (err) => {
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        status: statusCodes.INTERNAL_SERVER_ERROR,
        message: "Failed to gerearate PDF",
        error: err.message,
      });
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  uploadDocument,
  fetchDocument,
  generatePdf,
};
