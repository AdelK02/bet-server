const mongoose = require("mongoose");

const rowSchema = new mongoose.Schema({
  scheme: String,
  pos: Number,
  count: Number,
  amount: Number,
  super: Number
});

const groupSchema = new mongoose.Schema({
  group: String,
  rows: [rowSchema]
});

const drawSchemeSchema = new mongoose.Schema(
  {
    draw: { type: String, required: true }, // DEAR 1 PM
    activeTab: Number,
    schemes: [groupSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("DrawScheme", drawSchemeSchema);
