const express = require("express");
const router = express.Router();
const {
  userLogin,
  userSignUp,
  userLogout,
  getUser,
} = require("../controller/user");
const verifyToken = require("../middleware/auth");

router.post("/signUp", userSignUp);
router.post("/login", userLogin);
router.post("/logout", verifyToken, userLogout);
router.get("/user/:id", verifyToken, getUser);

module.exports = router;
