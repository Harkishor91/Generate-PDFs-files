const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Define the user schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  userRole: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isVerify: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String, // Store the generated OTP
  },
  otpExpiresAt: {
    type: Date, // Store OTP expiration time
  },
});

// Pre-save hook to hash the password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare hashed password with the provided password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to create JWT
userSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      userRole: this.userRole,
      isVerify: this.isVerify,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// Method to verify OTP
userSchema.methods.verifyOTP = function (enteredOtp) {
  const currentTime = new Date();
  // Check if OTP is correct and not expired
  if (enteredOtp === this.otp && currentTime < this.otpExpiresAt) {
    this.isVerify = true;
    this.otp = null; // Clear OTP after successful verification
    this.otpExpiresAt = null;
    return true;
  }
  return false;
};

// Create the model from the schema
const User = mongoose.model("User", userSchema);

module.exports = User;
