const express = require("express");
require("dotenv").config();
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const authRoute = require("./routes/authRoute");
const documentRoute = require("./routes/documentRoute");
const path = require("path");

const app = express();
const apiBaseUrl = process.env.API_BASE_URL || "api";

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use(`/${apiBaseUrl}/auth`, authRoute);
app.use(`/${apiBaseUrl}/document`, documentRoute);

app.get("/", (req, res) => {
  res.status(200).json({ status: 200, message: "Node JS is working" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 500, message: "Internal Server Error" });
});

module.exports = { app, connectDB };
