const Settings = require("../models/settingsModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getSettings = catchAsync(async (req, res) => {
  const settings = await Settings.getOrCreate();
  res.status(200).json({ status: "success", data: { settings } });
});

// Whitelisted PATCH: only the keys we know about are written, so a stray
// field in the body can never land in the settings document.
exports.updateSettings = catchAsync(async (req, res, next) => {
  const body = req.body || {};
  const patch = {};

  if (body.introDefault !== undefined) {
    const src = body.introDefault;
    if (!src || typeof src !== "object" || Array.isArray(src)) {
      return next(new AppError("introDefault must be an object", 400));
    }
    patch["introDefault.title"] =
      typeof src.title === "string" && src.title.trim()
        ? src.title.trim()
        : "הקדמה";
    patch["introDefault.html"] = typeof src.html === "string" ? src.html : "";
  }

  if (!Object.keys(patch).length) {
    return next(new AppError("No supported settings in request", 400));
  }
  patch.updatedAt = Date.now();

  const settings = await Settings.findOneAndUpdate(
    { key: "global" },
    { $set: patch, $setOnInsert: { key: "global" } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(200).json({ status: "success", data: { settings } });
});
