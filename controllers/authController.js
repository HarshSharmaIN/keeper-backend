require("dotenv").config();
const User = require("../models/userModel");
const createSecretToken = require("../utils/secretToken");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

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
      httpOnly: false,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: "Logged in", success: true, token: token });
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
}

async function Signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      withCredentials: true,
      httpOnly: false,
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: "Signed up", success: true, token: token });
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
}

const googleLogin = async (req, res) => {
  try {
    const { code } = req.body;

    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const existingUser = await User.findOne({ email: payload.email });

    if (!existingUser) {
      const userData = {
        name:
          (payload.given_name || "") +
          " " +
          (payload.family_name === undefined ? "" : payload.family_name),
        email: payload.email,
        password: payload.at_hash,
        image: payload.picture,
      };

      const newUser = new User(userData);
      const user = await newUser.save();

      const token = createSecretToken(user._id);
      res.json({
        success: true,
        token,
        name: userData.name,
        email: userData.email,
      });
    } else {
      const token = createSecretToken(existingUser._id);
      res.json({
        success: true,
        token,
        name: payload.given_name + " " + payload.family_name,
        email: payload.email,
      });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const checkUser = async (req, res) => {
  try {
    const { uid, phoneNumber } = req.body;

    if (!uid || !phoneNumber) {
      return res.json({
        success: false,
        message: "UID and phone number are required",
      });
    }
    const existingUser = await User.findOne({ phone: phoneNumber });

    if (existingUser) {
      const token = createSecretToken(existingUser._id);
      return res.json({
        success: true,
        existing: true,
        token,
      });
    } else {
      return res.json({
        success: true,
        existing: false,
      });
    }
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

const updateDetails = async (req, res) => {
  try {
    const { phoneNumber, name, email } = req.body;
    const phone = `+91${phoneNumber}`;
    const existingUser = await User.findOne({ phone });

    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(phone, salt);

      const userData = {
        name: name,
        phone: phone,
        email: email,
        password: hashedPassword,
      };

      const newUser = new User(userData);
      const user = await newUser.save();

      const token = createSecretToken(user._id);
      res.json({ success: true, token });
    } else {
      const token = createSecretToken(existingUser._id);
      res.json({ success: true, token });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

module.exports = {
  Login,
  Signup,
  googleLogin,
  checkUser,
  updateDetails,
};
