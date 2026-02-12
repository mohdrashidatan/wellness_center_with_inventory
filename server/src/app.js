const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
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
app.use(helmet());

// Middleware for logging
app.use(morgan("common"));

// Routes
app.get("/", (req, res) => {
  res.send(`<h1>SERVER IS RUNNING! 🚀</h1>`);
});
app.use("/api", Router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

module.exports = app;
