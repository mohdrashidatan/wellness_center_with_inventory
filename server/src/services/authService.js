const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/userModel");
const { generateAuthToken } = require("../utils/tokenUtils");
const { sendPasswordResetEmail } = require("../utils/mailer");
const Customer = require("../models/customerModel");
const Therapist = require("../models/therapistModal");

const RESET_TOKEN_EXP_MIN = parseInt(process.env.RESET_PASSWORD_TOKEN_EXP_MIN, 10) || 30;

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const registerUser = async (userData) => {
  const { username, email, password } = userData;
  //const existingUser = await User.findUserByEmail(email);
  // if (existingUser) {
  //   throw new Error("Email already registered");
  // }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const userId = await User.createUser({
    username,
    email,
    password: hashedPassword,
  });

  return {
    userid: userId,
    username,
    email,
  };
};

const loginUser = async (email, password) => {
  const user = await User.findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = await buildAuthToken(user, email);

  return {
    token,
    user: {
      userid: user.id,
      email: user.email,
    },
  };
};

// Builds the app JWT for an authenticated user. Shared by password login and
// Singpass login so both issue identical role and id claims.
const buildAuthToken = async (user, email) => {
  let token;

  if (user.role == "Customer") {
    let customer = await Customer.getCustomerByAccountId(user.useracid);

    if (!customer) {
      console.log("here");
      await Customer.initiate(user.id);
      customer = await Customer.getCustomerByAccountId(user.useracid);
    }
    // Generate JWT token

    token = generateAuthToken({
      userId: user.useracid,
      email: user.email,
      customerId: customer.customerid,
      role: "Customer",
    });
  } else {
    let therapist = await Therapist.getDataByEmail(email);

    //Genereate JWT token
    token = generateAuthToken({
      userId: user.useracid,
      email: user.email,
      therapistId: therapist?.therapistsid || null,
      role: "Therapist",
    });
  }

  return token;
};

const requestPasswordReset = async (email) => {
  const user = await User.findUserByEmail(email);

  // Always behave the same whether or not the account exists, so the
  // response can't be used to enumerate registered emails.
  if (!user) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXP_MIN * 60 * 1000);

  await User.setResetToken(user.useracid, tokenHash, expiresAt);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
};

const resetPassword = async (token, newPassword) => {
  const tokenHash = hashResetToken(token);
  const user = await User.findUserByResetTokenHash(tokenHash);

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await User.resetPasswordAndClearToken(user.useracid, hashedPassword);
};

module.exports = {
  registerUser,
  loginUser,
  buildAuthToken,
  requestPasswordReset,
  resetPassword,
};
