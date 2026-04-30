const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, "Image must have a filename"],
    unique: true,
  },
  contentType: {
    type: String,
    required: [true, "Image must have a content type"],
  },
  data: {
    type: Buffer,
    required: [true, "Image must have data"],
  },
  category: {
    type: String,
    enum: ["product", "signature", "other"],
    default: "other",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Image = mongoose.model("Image", imageSchema);

module.exports = Image;
