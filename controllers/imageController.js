const { customAlphabet } = require("nanoid");
const Image = require("../models/imageModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const filenameAlphabet =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const generateId = customAlphabet(filenameAlphabet, 20);

exports.uploadImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No image uploaded", 400));
  }

  const category = req.body.category || "other";
  const ext = (req.file.originalname.match(/\.[^.]+$/) || [".png"])[0];
  const filename = `${category}-${Date.now()}-${generateId()}${ext}`;

  await Image.create({
    filename,
    contentType: req.file.mimetype,
    data: req.file.buffer,
    category,
  });

  res.status(201).json({
    status: "success",
    data: {
      filename,
      url: `/api/v1/images/${filename}`,
    },
  });
});

exports.uploadSignatureImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No image uploaded", 400));
  }

  const filename =
    req.body.filename ||
    `signature-${Date.now()}-${generateId()}.png`;

  await Image.findOneAndUpdate(
    { filename },
    {
      filename,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      category: "signature",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({
    status: "success",
    data: {
      filename,
      url: `/api/v1/images/${filename}`,
    },
  });
});

exports.getImage = catchAsync(async (req, res, next) => {
  const image = await Image.findOne({ filename: req.params.filename });
  if (!image) {
    return next(new AppError("Image not found", 404));
  }
  res.set("Content-Type", image.contentType);
  res.set("Cache-Control", "public, max-age=86400");
  res.send(image.data);
});

exports.deleteImage = catchAsync(async (req, res, next) => {
  await Image.findOneAndDelete({ filename: req.params.filename });
  res.status(204).json({ status: "success", data: null });
});
