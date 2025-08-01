const router = require("express").Router();
const {
  Login,
  Signup,
  googleLogin,
  sendOtp,
  verifyOtp,
  updateDetails,
} = require("../controllers/authController");
const userVerification = require("../middleware/authMiddleware");

router.post("/verify", userVerification, (req, res) => {
  res.json({
    message: "Authorized",
    success: true,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
  });
});
router.post("/login", Login);
router.post("/signup", Signup);
router.post("/google-login", googleLogin);
router.post("/generate-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/user-details", updateDetails);

module.exports = router;
