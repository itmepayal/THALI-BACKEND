const User = require("../models/user");
const BlacklistedToken = require("../models/blacklistedToken");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSignUp = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password is required" });
  }
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ error: "Email is already exist" });
  }
  const hashPwd = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    email,
    password: hashPwd,
  });
  let token = jwt.sign({ email, id: newUser._id }, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });
  return res.status(200).json({
    token,
    user: { _id: newUser._id, email: newUser.email },
  });
};

const userLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password is required" });
  }
  let user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    let token = jwt.sign({ email, id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });
    return res.status(200).json({
      token,
      user: { _id: user._id, email: user.email },
    });
  } else {
    return res.status(400).json({ error: "Invaild credientials" });
  }
};

const userLogout = async (req, res) => {
  try {
    await BlacklistedToken.create({
      token: req.token,
      expiresAt: new Date(req.user.exp * 1000),
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Logout failed" });
  }
};

const getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ email: user.email });
};

module.exports = { userLogin, userSignUp, userLogout, getUser };
