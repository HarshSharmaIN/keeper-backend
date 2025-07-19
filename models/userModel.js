const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { noteSchema } = require("./noteModel");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  notes: [noteSchema],
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    console.log(error);
  }
});

module.exports = mongoose.model("User", userSchema);
