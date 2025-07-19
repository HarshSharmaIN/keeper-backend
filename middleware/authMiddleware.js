require("dotenv").config();
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

function userVerification(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
  if (!token) {
    return res.json({ message: "UnAuthorized" });
  }
  jwt.verify(token, process.env.SECRET_TOKEN, async (err, decoded) => {
    if (err) {
      return res.json({ message: "UnAuthorized" });
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.json({ message: "UnAuthorized" });
    }
    req.user = user;
    // res.json({ message: 'Authorized', success: true});
    next();
  });
}

module.exports = userVerification;
