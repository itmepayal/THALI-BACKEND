const jwt = require("jsonwebtoken");
const BlacklistedToken = require("../models/blacklistedToken");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  const isBlacklisted = await BlacklistedToken.findOne({ token });
  if (isBlacklisted) {
    return res
      .status(401)
      .json({ message: "Token is logged out, please login again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;
