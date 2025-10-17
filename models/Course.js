const mongoose = require("mongoose");
const nextId   = require("../helpers/idGenerator");

const courseSchema = new mongoose.Schema({
  id      : { type: String, unique: true },
  name    : { type: String, required: true },
  code    : { type: String, required: true },
  duration: { type: String },
  type    : { type: String },
}, { timestamps: true });

courseSchema.pre("save", async function (next) {
  if (this.id) return next();                         // already generated
  this.id = await nextId(mongoose.model("Course"), "CRS");
  next();
});

module.exports = mongoose.model("Course", courseSchema);
