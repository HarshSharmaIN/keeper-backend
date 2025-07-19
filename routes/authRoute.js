const router = require("express").Router();
const { Login, Signup } = require("../controllers/authController");
const userVerification = require("../middleware/authMiddleware");

router.post("/verify", userVerification, (req, res) => {
  res.json({
    message: "Authorized",
    success: true,
    username: req.user.email,
    token: req.cookies.token,
  });
});
router.post("/login", Login);
router.post("/signup", Signup);

module.exports = router;
