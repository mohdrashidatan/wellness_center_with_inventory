const authService = require("../services/authService");

const signupUser = async (req, res) => {
  try {
    const userData = req.body;

    const user = await authService.registerUser(userData);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    console.log("cekkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

module.exports = {
  signupUser,
  loginUser,
};
