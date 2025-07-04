const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const connectToDB = require("./config/db");
const { Server } = require("socket.io");
const http = require("http");
const Canvas = require("./models/canvasModel");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";

const userRoutes = require("./routes/userRoutes");
const canvasRoutes = require("./routes/canvasRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/canvas", canvasRoutes);
app.get("/", (req, res) => {
  res.send("API is running");
});

connectToDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://whiteboard-tutorial-eight.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

let canvasData = {};
let i = 0;
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinCanvas", async ({ canvasId, token }) => {
    console.log("Joining canvas:", canvasId);

    try {
      if (!token || !token.startsWith("Bearer ")) {
        console.log("No token provided.");
        setTimeout(() => {
          socket.emit("unauthorized", { message: "Access Denied: No Token" });
        }, 100);
        return;
      }

      const actualToken = token.split(" ")[1];
      const decoded = jwt.verify(actualToken, SECRET_KEY);
      const userId = decoded.userId;
      console.log("User ID:", userId);

      const canvas = await Canvas.findById(canvasId);
      if (
        !canvas ||
        (String(canvas.owner) !== String(userId) &&
          !canvas.shared.includes(userId))
      ) {
        console.log("Unauthorized access.");
        setTimeout(() => {
          socket.emit("unauthorized", {
            message: "You are not authorized to join this canvas.",
          });
        }, 100);
        return;
      }

      socket.join(canvasId);
      console.log(`User ${socket.id} joined canvas ${canvasId}`);

      if (canvasData[canvasId]) {
        socket.emit("loadCanvas", canvasData[canvasId]);
      } else {
        socket.emit("loadCanvas", canvas.elements);
      }
    } catch (error) {
      console.error(error);
      socket.emit("error", {
        message: "An error occurred while joining the canvas.",
      });
    }
  });

  socket.on("drawingUpdate", async ({ canvasId, elements }) => {
    try {
      canvasData[canvasId] = elements;

      socket.to(canvasId).emit("receiveDrawingUpdate", elements);

      const canvas = await Canvas.findById(canvasId);
      if (canvas) {
        // console.log('updating canvas... ', i++)
        await Canvas.findByIdAndUpdate(
          canvasId,
          { elements },
          { new: true, useFindAndModify: false }
        );
      }
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
