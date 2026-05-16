const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const Router = require("./routes/index");
const cookieParser = require("cookie-parser");

const app = express();

const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(
  cors({
    origin: frontendURL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet({ contentSecurityPolicy: false }));

// Middleware for logging
app.use(morgan("common"));

// Serve built React frontend
const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));

// API routes
app.use("/api", Router);

// Catch-all: serve React app for any non-API route (React Router support)
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

module.exports = app;
