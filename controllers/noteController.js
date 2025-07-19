const User = require("../models/userModel");
const { Note } = require("../models/noteModel");

async function createNote(req, res, next) {
  try {
    const { title, content, style, type } = req.body;
    if (!title || !content)
      return res.json({ message: "Please enter all fields" });
    const note = await Note.create({ title, content, style, type });
    const user = await User.findById(req.user._id);
    user.notes.push(note);
    await user.save();
    res.json({ message: "Note created", success: true });
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
}

async function getNotes(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate("notes");
    res.json({ notes: user.notes });
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
}

async function deleteNote(req, res, next) {
  try {
    const { noteId } = req.params;
    const user = await User.findById(req.user._id);
    user.notes.pull(noteId);
    await user.save();
    await Note.findByIdAndDelete(noteId);
    res.json({ message: "Note deleted", success: true });
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
}

async function updateNote(req, res, next) {
  try {
    const { noteId } = req.params;
    const { title, content, style, type } = req.body;
    const user = await User.findById(req.user._id);
    const noteIndex = user.notes.findIndex(
      (note) => note._id.toString() === noteId
    );
    if (noteIndex !== -1) {
      user.notes[noteIndex].title = title;
      user.notes[noteIndex].content = content;
      user.notes[noteIndex].style = style;
      user.notes[noteIndex].type = type;
      await user.save();
      res.json({ message: "Note updated", success: true });
    } else {
      res.json({ message: "Note not found" });
    }
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
}

async function getNote(req, res, next) {
  try {
    const { noteId } = req.params;
    const user = await User.findById(req.user._id).populate("notes");
    const note = user.notes.find((note) => note._id.toString() === noteId);
    res.json({ note });
    next();
  } catch (error) {
    res.json({ message: error.message });
  }
}

module.exports = { createNote, getNotes, deleteNote, updateNote, getNote };
