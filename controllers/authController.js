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

const sentOtps = {};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

const sendOtp = async (req, res) => {
  const { phoneNumber: phone } = req.body;

  if (!phone) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number is required" });
  }

  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number format (10 digits)",
    });
  }

  const otp = generateOtp();
  const recipientPhoneNumber = `+91${phone}`;

  try {
    // const message = await twilioClient.messages.create({
    //     body: `Your OTP for login is: ${otp}`,
    //     to: recipientPhoneNumber,
    //     from: twilioPhoneNumber,
    // });

    // console.log(`OTP sent to ${recipientPhoneNumber}: ${message.sid}`);

    sentOtps[recipientPhoneNumber] = {
      otp,
      expiry: Date.now() + 300000,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SENDER_MAIL_ID,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SENDER_MAIL_ID,
      to: process.env.RECEIVER_MAIL_ID,
      subject: "keeper otp",
      html: JSON.stringify(sentOtps),
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to send OTP" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const phone = `+91${phoneNumber}`;

    if (!phone || !otp) {
      return res.json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    if (!sentOtps[phone]) {
      return res.json({ success: false, message: "OTP not found or expired" });
    }

    const storedOtpData = sentOtps[phone];

    if (Date.now() > storedOtpData.expiry) {
      delete sentOtps[phone];
      return res.json({ success: false, message: "OTP expired" });
    }

    if (parseInt(otp.replace(/,/g, "")) === storedOtpData.otp) {
      delete sentOtps[phone];
      const existingUser = await User.findOne({ phone });

      if (existingUser) {
        const token = createSecretToken(existingUser._id);
        res.json({
          success: true,
          existing: true,
          token: token,
        });
      } else {
        res.json({ success: true, existing: false });
      }
    } else {
      res.json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
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
  sendOtp,
  verifyOtp,
  updateDetails,
};
