const mongoose = require("mongoose");
const nextId   = require("../helpers/idGenerator");

const subjectSchema = new mongoose.Schema({
  id        : { type: String, unique: true },
  name      : { type: String, required: true },
  code      : { type: String, required: true },
  department: { type: String, required: true },  // store name or dep-id
  credits   : { type: Number, required: true },
}, { timestamps: true });

subjectSchema.pre("save", async function (next) {
  if (this.id) return next();
  this.id = await nextId(mongoose.model("Subject"), "SUB");
  next();
});

module.exports = mongoose.model("Subject", subjectSchema);
