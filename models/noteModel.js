const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  style: {
    color: { type: String, required: true },
    backgroundColor: { type: String, required: true },
    fontFamily: { type: String, required: true },
    fontSize: { type: String, required: true },
  },
  type: {
    type: String,
    required: true,
  },
});

const Note = mongoose.model("Note", noteSchema);

module.exports = { Note, noteSchema };
