const express = require("express");
const { validateBody } = require("../middlewares/validateSchema");
const { registrationSchema, loginSchema } = require("../schemas/authSchema");
const { signupUser, loginUser } = require("../controllers/authController");

const router = express.Router();

// Registration route
router.post("/signup", signupUser);

// Login route
router.post("/login", validateBody(loginSchema), loginUser);

module.exports = router;
