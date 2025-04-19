const jwt = require("jsonwebtoken");
const statusCodes = require("../utils/statusCode");

const userAuthentication = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(statusCodes.BAD_REQUEST)
      .json({ status: statusCodes.BAD_REQUEST, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, firstName, lastName, email, userRole, isVerify } = decoded;
    // pass all these values in authentication
    req.user = { userId, firstName, lastName, email, userRole, isVerify };
    next();
  } catch (error) {
    return res.status(statusCodes.UNAUTHORIZED).json({
      status: statusCodes.UNAUTHORIZED,
      message: "Not authorized to access this route",
    });
  }
};

module.exports = userAuthentication;
