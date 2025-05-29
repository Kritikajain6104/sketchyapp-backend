const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://kritikajainwhiteboard:WHITEBOARD12@learn.1ybfgiz.mongodb.net/whiteboard?retryWrites=true&w=majority&appName=Learn",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
