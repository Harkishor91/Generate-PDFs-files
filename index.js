const { app, connectDB } = require("./app");

const port = process.env.PORT;
const dbUrl = process.env.MONGODB_URI;

const startServer = async () => {
  try {
    await connectDB(dbUrl);
    console.log("Database connected successfully");

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Database connection error:", err);
  }
};

// Start the server
startServer();
