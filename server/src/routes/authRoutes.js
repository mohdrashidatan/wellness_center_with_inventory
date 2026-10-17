const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { rateLimit } = require("../middlewares/rateLimit");
const { registrationSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require("../schemas/authSchema");
const { signupUser, loginUser, forgotPassword, resetPassword } = require("../controllers/authController");

const router = express.Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests, please try again later",
});

// Registration route
router.post("/signup", signupUser);

// Login route
router.post("/login", validateBody(loginSchema), loginUser);

// Forgot password route
router.post("/forgot-password", forgotPasswordLimiter, validateBody(forgotPasswordSchema), forgotPassword);

// Reset password route
router.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);

module.exports = router;
