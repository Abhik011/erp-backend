const mongoose = require("mongoose");
const nextId   = require("../helpers/idGenerator");

const departmentSchema = new mongoose.Schema({
  id   : { type: String, unique: true },
  name : { type: String, required: true },
  code : { type: String, required: true },
  head : { type: String },
}, { timestamps: true });

departmentSchema.pre("save", async function (next) {
  if (this.id) return next();
  this.id = await nextId(mongoose.model("Department"), "DEP");
  next();
});

module.exports = mongoose.model("Department", departmentSchema);
