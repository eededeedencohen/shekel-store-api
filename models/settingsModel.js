const mongoose = require("mongoose");

// Admin-wide preferences. A single document (key = "global") so every
// admin session shares the same defaults; getOrCreate upserts it.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    // Opening section ("הקדמה") seeded into every NEW contract. An empty
    // html means "never set" — the client then uses its built-in text.
    introDefault: {
      title: { type: String, default: "הקדמה", trim: true },
      html: { type: String, default: "" },
    },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

settingsSchema.statics.getOrCreate = function () {
  return this.findOneAndUpdate(
    { key: "global" },
    { $setOnInsert: { key: "global" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
