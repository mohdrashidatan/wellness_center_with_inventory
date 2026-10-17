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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);

    // Same response whether or not the email is registered, to avoid
    // leaking which addresses have accounts.
    res.status(200).json({
      success: true,
      message: "If that email is registered, a password reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(200).json({
      success: true,
      message: "If that email is registered, a password reset link has been sent",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({
      success: false,
      message: "Password reset failed",
      error: error.message,
    });
  }
};

module.exports = {
  signupUser,
  loginUser,
  forgotPassword,
  resetPassword,
};
