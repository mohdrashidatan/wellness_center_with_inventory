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

// Pilot guard: public signup creates Therapist accounts (see userModel.createUser),
// so it can be switched off with DISABLE_PUBLIC_SIGNUP=true.
const blockWhenSignupDisabled = (req, res, next) => {
  if (process.env.DISABLE_PUBLIC_SIGNUP === "true") {
    return res.status(403).json({ success: false, message: "Public signup is disabled" });
  }
  next();
};

// Registration route
router.post("/signup", blockWhenSignupDisabled, signupUser);

// Login route
router.post("/login", validateBody(loginSchema), loginUser);

// Forgot password route
router.post("/forgot-password", forgotPasswordLimiter, validateBody(forgotPasswordSchema), forgotPassword);

// Reset password route
router.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);

module.exports = router;
