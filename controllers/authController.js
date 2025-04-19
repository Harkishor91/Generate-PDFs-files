const User = require("../models/userModel");
const otpGenerator = require("otp-generator");
const sendEmail = require("../middlewares/emailSender");
const statusCodes = require("../utils/statusCode");
const mongoose = require("mongoose");

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, userRole } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message:
          "All fields are required (firstName, lastName, email, password)",
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "Email already exists",
      });
    }

    // Create new user instance
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      userRole,
    });

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Save OTP and its expiration (e.g., 5 minutes)
    newUser.otp = otp;
    newUser.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    // Send OTP via email
    try {
      await sendEmail(email, otp);
      console.log(`OTP sent to email: ${email} and ${otp}`);
    } catch (emailError) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "Failed to send top on email",
      });
    }

    // Save the user to the database
    await newUser.save();

    return res.status(statusCodes.OK).json({
      message: "User registered successfully. Verify OTP sent to your email.",
      status: statusCodes.OK,
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        userRole: newUser.userRole,
      },
    });
  } catch (err) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal Server Error",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "Email and OTP are required.",
      });
    }
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    // Verify the OTP
    if (user.verifyOTP(otp)) {
      // Save the changes to the user (isVerify will be true now)
      await user.save();
      return res.status(statusCodes.OK).json({
        message: "OTP verified successfully.",
        status: statusCodes.OK,
      });
    } else {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid or expired OTP.",
        status: statusCodes.BAD_REQUEST,
      });
    }
  } catch (err) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal Server Error",
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ status: statusCodes.NOT_FOUND, message: "User not found" });
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Save OTP and its expiration (e.g., 5 minutes)
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    await user.save(); // Save the updated user object

    // Send OTP via email
    try {
      await sendEmail(email, otp);
      console.log(`OTP sent to email: ${email}`);
    } catch (emailError) {
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        status: statusCodes.INTERNAL_SERVER_ERROR,
        message: "Failed to send OTP email.",
      });
    }

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: "Resend OTP successfully",
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "All fields are required",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    // Validate password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "Invalid credentials",
      });
    }

    // Check if the user is verified
    if (!user.isVerify) {
      // Generate a new OTP
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      // Set OTP and its expiration time
      user.otp = otp;
      user.otpExpiresAt = Date.now() + 5 * 60 * 1000; // Set expiry for 5 minutes
      await user.save(); // Save the updated user

      // Send the OTP via email
      await sendEmail(user.email, otp);
      console.log(`New OTP sent to: ${user.email}`);

      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message:
          "User is not verified. A new OTP has been sent to your email for verification.",
      });
    }

    // Generate JWT token
    const token = user.createJWT();
    const userInfo = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userRole: user.userRole,
      isVerify: user.isVerify,
    };

    // Send response
    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: "User logged in successfully",
      user: userInfo,
      token,
    });
  } catch (err) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "Email cannot be empty",
      });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    // Generate a new OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    // Update user with new OTP and expiration time
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;

    // Save the updated user
    await user.save();

    // Send OTP via email
    try {
      await sendEmail(email, otp);
      console.log(`OTP sent to email: ${email} and ${otp}`);
    } catch (emailError) {
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        status: statusCodes.INTERNAL_SERVER_ERROR,
        message: "Failed to send OTP email",
        error: emailError,
      });
    }
    // Respond with success
    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message:
        "OTP has been sent to your email. Please verify within 5 minutes.",
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "Email and otp cannot be empty",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ status: statusCodes.NOT_FOUND, message: "User not found" });
    }

    if (user.verifyOTP(otp)) {
      user.save();

      return res.status(statusCodes.OK).json({
        status: statusCodes.OK,
        message: "Verify forgot password otp",
      });
    } else {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid or expire opt",
        status: statusCodes.BAD_REQUEST,
      });
    }
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal server error",
      status: statusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const createPassword = async (req, res) => {
  try {
    const { password, email } = req.body;
    if (!password || !email) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "Password and email cannot be empty",
      });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ status: statusCodes.NOT_FOUND, message: "User not foound" });
    }
    user.password = password;
    user.save();
    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: "Create password successfully",
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: INTERNAL_SERVER_ERROR.OK,
      message: "Internal server error",
      error: error,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { password, newPassword } = req.body;
    if (!password || !newPassword) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "Password and new password cannot be empty",
      });
    }
    const userId = req.user.userId;

    const user = await User.findById({ _id: userId });
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ status: statusCodes.NOT_FOUND, message: "User not found" });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: "Old password is incorrect",
      });
    }
    user.password = newPassword;
    await user.save();
    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      error: error,
    });
  }
};

const userProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findOne({ _id: userId }).select(
      "-password -otp -otpExpiresAt"
    ); // these keys remove from response
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ status: statusCodes.NOT_FOUND, message: "User not found" });
    }
    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: "Profile fetch successfully",
      user: user,
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      error: error,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    // const { userId } = req.params;
    const userId = req.user.userId;
    const { firstName, lastName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        success: false,
        message: "Invalid user ID",
      });
    }
    if (!firstName || !lastName) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        success: false,
        message: "Firstname and lastname is cannot be empty",
      });
    }
    // const user = await User.findByIdAndUpdate(
    //   { _id: userId },
    //   {
    //     firstName,
    //     lastName,
    //   },
    //   { new: true, runValidators: true }
    // );

    const user = await User.findById({ _id: userId });

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        succcess: false,
        message: "User not found",
      });
    }

    // Update user's profile
    user.firstName = firstName;
    user.lastName = lastName;

    // Save updated user profile
    const updatedUser = await user.save();
    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      success: true,
      messsage: "Profile update successfully",
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      messsage: "Internal server errror",
      error: error,
    });
  }
};

const getAllUser = async (req, res) => {
  try {
    const userId = req?.user?.userId;
    // show all users in list rather then login user
    const users = await User.find({ _id: { $ne: userId } }).select(
      "-password -otp -otpExpiresAt"
    ); // use 'select' here for remove particular field value by using (- sign with field name ) from response
    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: "User data fetch successfully",
      users,
      totalUsers: users.length,
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "nternal server errror",
    });
  }
};

const userDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    // use 'select' here for remove particular field value by using (- sign with field name ) from response
    const user = await User.findOne({ _id: userId }).select(
      "-password -otp -otpExpiresAt"
    );
    console.log(JSON.stringify(user), userId);
    // Check if user exists
    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: `User not found with ID: ${userId}`,
      });
    }

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: "User detail fetch successfully",
      user,
    });
  } catch (error) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      status: statusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  getAllUser,
  userDetail,
  forgotPassword,
  verifyForgotPasswordOtp,
  createPassword,
  changePassword,
  userProfile,
  updateProfile,
};
