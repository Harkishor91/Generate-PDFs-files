const mongoose = require("mongoose");

// code for connect database
const connectDB = async (dbUrl) => {
  try {
    await mongoose
      .connect(dbUrl)
      .then((res) => {
        console.log("Database connected successfully");
      })
      .catch((error) => {
        console.log("Error in connect Database ");
      });
  } catch (error) {
    console.log(error);

    console.log("Database connection is failed");
  }
};
module.exports = connectDB;
