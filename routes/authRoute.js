const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/userAuthentication");
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  verifyForgotPasswordOtp,
  createPassword,
  changePassword,
  getAllUser,
  userDetail,
  userProfile,
  updateProfile,
} = require("../controllers/authController");

// define routes

// Route for register
router.post("/register", register);

// Route for verify OTP
router.post("/verifyOtp", verifyOtp);

// Route or resend OTP
router.post("/resendOtp", resendOtp);

// Route for login
router.post("/login", login);

// Route for forgot password
router.post("/forgotPassword", forgotPassword);

// Route for verify forgot password Otp
router.post("/verifyForgotPasswordOtp", verifyForgotPasswordOtp);

// Route for create password
router.post("/createPassword", createPassword);

// Route for change password
router.post("/changePassword", authMiddleware, changePassword);

// Route for getAllUsers
router.get("/getAllUser", authMiddleware, getAllUser);

// Route for userDetail
router.get("/userDetail/:userId", authMiddleware, userDetail);

// Route for user profile
router.get("/userProfile", authMiddleware, userProfile);

// Route for update profile
router.put("/updateProfile", authMiddleware, updateProfile);

module.exports = router;
