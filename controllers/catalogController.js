const { customAlphabet } = require("nanoid");
const CatalogProduct = require("../models/catalogProductModel");
const Image = require("../models/imageModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const filenameAlphabet =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const newImageId = customAlphabet(filenameAlphabet, 14);

const cloneImageFile = async (filename, prefix = "cat") => {
  if (!filename) return "";
  const src = await Image.findOne({ filename });
  if (!src) return "";
  const ext = filename.includes(".") ? filename.split(".").pop() : "png";
  const newFilename = `${prefix}-${Date.now()}-${newImageId()}.${ext}`;
  await Image.create({
    filename: newFilename,
    contentType: src.contentType,
    data: src.data,
    category: src.category,
  });
  return newFilename;
};

const cloneImageList = async (filenames, prefix) => {
  if (!Array.isArray(filenames) || !filenames.length) return [];
  const cloned = await Promise.all(
    filenames.map((f) => cloneImageFile(f, prefix))
  );
  return cloned.filter(Boolean);
};

const collectFilenamesFromProduct = (p) => {
  const out = [];
  if (Array.isArray(p.images)) out.push(...p.images.filter(Boolean));
  if (Array.isArray(p.packageItems)) {
    p.packageItems.forEach((it) => {
      if (Array.isArray(it.images)) out.push(...it.images.filter(Boolean));
    });
  }
  return out;
};

exports.list = catchAsync(async (req, res) => {
  const items = await CatalogProduct.find().sort({ updatedAt: -1 });
  res.status(200).json({
    status: "success",
    results: items.length,
    data: { items },
  });
});

exports.get = catchAsync(async (req, res, next) => {
  const item = await CatalogProduct.findById(req.params.id);
  if (!item) {
    return next(new AppError("Catalog product not found", 404));
  }
  res.status(200).json({ status: "success", data: { item } });
});

exports.create = catchAsync(async (req, res) => {
  const created = await CatalogProduct.create(req.body);
  res.status(201).json({ status: "success", data: { item: created } });
});

exports.update = catchAsync(async (req, res, next) => {
  const updated = await CatalogProduct.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!updated) {
    return next(new AppError("Catalog product not found", 404));
  }
  res.status(200).json({ status: "success", data: { item: updated } });
});

exports.remove = catchAsync(async (req, res, next) => {
  const item = await CatalogProduct.findById(req.params.id);
  if (!item) {
    return next(new AppError("Catalog product not found", 404));
  }
  const filenames = collectFilenamesFromProduct(item);
  if (filenames.length > 0) {
    await Image.deleteMany({ filename: { $in: filenames } });
  }
  await CatalogProduct.deleteOne({ _id: item._id });
  res.status(204).json({ status: "success", data: null });
});

exports.clone = catchAsync(async (req, res, next) => {
  const item = await CatalogProduct.findById(req.params.id);
  if (!item) {
    return next(new AppError("Catalog product not found", 404));
  }
  const src = item.toObject();
  const cloned = {
    type: src.type || "single",
    description: src.description || "",
    images: await cloneImageList(src.images, "cat-cp"),
    imageFilename: "",
    packageTitle: src.packageTitle || "",
    packageItems: await Promise.all(
      (src.packageItems || []).map(async (it) => ({
        description: it.description || "",
        images: await cloneImageList(it.images, "cat-cp"),
        notes: Array.isArray(it.notes) ? [...it.notes] : [],
      }))
    ),
    notes: Array.isArray(src.notes) ? [...src.notes] : [],
    notesStyle: src.notesStyle || "dot",
    notesColor: src.notesColor || "#1E40AF",
    pricing: src.pricing
      ? { ...src.pricing }
      : {
          unitPrice: 0,
          discountPercent: 0,
          unitPriceAfterDiscount: 0,
          minimumUnits: 0,
          totalForMinimum: 0,
          freeText: "",
        },
  };
  res.status(200).json({ status: "success", data: { product: cloned } });
});

exports.saveFromContractProduct = catchAsync(async (req, res, next) => {
  const { name, product } = req.body || {};
  if (!name || !name.trim()) {
    return next(new AppError("שם המוצר במאגר חסר", 400));
  }
  if (!product || typeof product !== "object") {
    return next(new AppError("פרטי המוצר חסרים", 400));
  }
  const clonedImages = await cloneImageList(product.images, "cat-save");
  const clonedPackageItems = await Promise.all(
    (product.packageItems || []).map(async (it) => ({
      description: it.description || "",
      images: await cloneImageList(it.images, "cat-save"),
      notes: Array.isArray(it.notes) ? [...it.notes] : [],
    }))
  );
  const created = await CatalogProduct.create({
    name: name.trim(),
    type: product.type === "package" ? "package" : "single",
    description: product.description || "",
    images: clonedImages,
    packageTitle: product.packageTitle || "",
    packageItems: clonedPackageItems,
    notes: Array.isArray(product.notes) ? [...product.notes] : [],
    notesStyle: product.notesStyle || "dot",
    notesColor: product.notesColor || "#1E40AF",
    pricing: product.pricing || undefined,
  });
  res.status(201).json({ status: "success", data: { item: created } });
});
