const User = require("../models/userModel");
const createSecretToken = require("../utils/secretToken");
const bcrypt = require("bcrypt");

async function Login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ message: "Invalid credentials" });
    }
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      sameSite: "none",
      httpOnly: false,
      secure: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: "Logged in", success: true, token }); // Corrected line
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
}

async function Signup(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.create({ email, password });
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      sameSite: "none",
      httpOnly: false,
      secure: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: "Signed up", success: true, token }); // Corrected line
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
}

module.exports = { Login, Signup };
