const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pdfUrl: {
    type: String,
    requured: true,
  },
  pdfContent: {
    type: String,
    requured: true,
  },
  extractedUrls: {
    type: Array,
    requured: true,
  },
});
module.exports = mongoose.model("Document", documentSchema);
