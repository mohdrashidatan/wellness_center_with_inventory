const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { generateAuthToken } = require("../utils/tokenUtils");
const Customer = require("../models/customerModel");
const Therapist = require("../models/therapistModal");

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

  return {
    token,
    user: {
      userid: user.id,
      email: user.email,
    },
  };
};

module.exports = {
  registerUser,
  loginUser,
};
