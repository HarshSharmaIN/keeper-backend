const router = require("express").Router();
const {
  createNote,
  getNotes,
  deleteNote,
  updateNote,
  getNote,
} = require("../controllers/noteController");
const userVerification = require("../middleware/authMiddleware");

router.use(userVerification);

router.get("/", getNotes);
router.post("/", createNote);
router.delete("/:noteId", deleteNote);
router.put("/:noteId", updateNote);
router.get("/:noteId", getNote);

module.exports = router;
