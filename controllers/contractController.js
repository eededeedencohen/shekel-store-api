const Contract = require("../models/contractModel");
const Signature = require("../models/signatureModel");
const Image = require("../models/imageModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getAllContracts = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const contracts = await Contract.find(filter).sort({ updatedAt: -1 });

  const counts = await Signature.aggregate([
    { $group: { _id: "$contractId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const contractsWithCounts = contracts.map((c) => {
    const obj = c.toObject();
    obj.signatureCount = countMap.get(String(c._id)) || 0;
    return obj;
  });

  res.status(200).json({
    status: "success",
    results: contractsWithCounts.length,
    data: { contracts: contractsWithCounts },
  });
});

exports.getContract = catchAsync(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    return next(new AppError("No contract found with that ID", 404));
  }
  const signatureCount = await Signature.countDocuments({
    contractId: contract._id,
  });
  const obj = contract.toObject();
  obj.signatureCount = signatureCount;
  res.status(200).json({ status: "success", data: { contract: obj } });
});

exports.getContractByToken = catchAsync(async (req, res, next) => {
  const contract = await Contract.findOne({
    shareToken: req.params.token,
    status: "published",
  });
  if (!contract) {
    return next(new AppError("Contract not found or not published", 404));
  }

  const existingSignature = await Signature.findOne({
    shareToken: req.params.token,
  }).sort({ signedAt: 1 });

  const signaturePayload = existingSignature
    ? {
        signerName: existingSignature.signerName,
        signerNote: existingSignature.signerNote,
        signatureFilename: existingSignature.signatureFilename,
        signedAt: existingSignature.signedAt,
        signedAtIsrael: existingSignature.signedAtIsrael,
      }
    : null;

  res
    .status(200)
    .json({ status: "success", data: { contract, signature: signaturePayload } });
});

exports.createContract = catchAsync(async (req, res, next) => {
  const newContract = await Contract.create(req.body);
  res.status(201).json({
    status: "success",
    data: { contract: newContract },
  });
});

exports.updateContract = catchAsync(async (req, res, next) => {
  const signatureCount = await Signature.countDocuments({
    contractId: req.params.id,
  });
  if (signatureCount > 0) {
    return next(
      new AppError("Cannot edit a contract that has signatures", 403)
    );
  }
  const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!contract) {
    return next(new AppError("No contract found with that ID", 404));
  }
  res.status(200).json({ status: "success", data: { contract } });
});

exports.publishContract = catchAsync(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    return next(new AppError("No contract found with that ID", 404));
  }
  contract.status = "published";
  await contract.save();
  res.status(200).json({ status: "success", data: { contract } });
});

exports.unpublishContract = catchAsync(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    return next(new AppError("No contract found with that ID", 404));
  }
  contract.status = "draft";
  await contract.save();
  res.status(200).json({ status: "success", data: { contract } });
});

exports.duplicateContract = catchAsync(async (req, res, next) => {
  const orig = await Contract.findById(req.params.id);
  if (!orig) {
    return next(new AppError("No contract found with that ID", 404));
  }

  const cloneImage = async (filename) => {
    if (!filename) return "";
    const src = await Image.findOne({ filename });
    if (!src) return "";
    const ext = filename.includes(".") ? filename.split(".").pop() : "png";
    const newFilename = `dup-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}.${ext}`;
    await Image.create({
      filename: newFilename,
      contentType: src.contentType,
      data: src.data,
      category: src.category,
    });
    return newFilename;
  };

  const cloneImages = async (filenames) => {
    if (!Array.isArray(filenames) || !filenames.length) return [];
    const cloned = await Promise.all(filenames.map(cloneImage));
    return cloned.filter(Boolean);
  };

  const clonedProducts = await Promise.all(
    (orig.products || []).map(async (p) => {
      const obj = p.toObject ? p.toObject() : { ...p };
      delete obj._id;
      obj.imageFilename = await cloneImage(obj.imageFilename);
      obj.images = await cloneImages(obj.images);
      if (Array.isArray(obj.packageItems) && obj.packageItems.length) {
        obj.packageItems = await Promise.all(
          obj.packageItems.map(async (item) => {
            const itemObj = item.toObject ? item.toObject() : { ...item };
            itemObj.images = await cloneImages(itemObj.images);
            return itemObj;
          })
        );
      }
      return obj;
    })
  );

  const newContract = await Contract.create({
    title: `${orig.title || "חוזה"} - עותק`,
    recipient: orig.recipient,
    bulletPoints: orig.bulletPoints,
    bulletPointsLocked: orig.bulletPointsLocked,
    bulletsTitle: orig.bulletsTitle,
    bulletsTitleVisible: orig.bulletsTitleVisible,
    bulletStyle: orig.bulletStyle,
    bulletColor: orig.bulletColor,
    products: clonedProducts,
    shippings: (orig.shippings || []).map((s) => {
      const obj = s.toObject ? s.toObject() : { ...s };
      delete obj._id;
      return obj;
    }),
    closingNotes: orig.closingNotes,
  });

  res.status(201).json({
    status: "success",
    data: { contract: newContract },
  });
});

exports.deleteContract = catchAsync(async (req, res, next) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    return next(new AppError("No contract found with that ID", 404));
  }

  const signatures = await Signature.find({ contractId: contract._id });

  const collectProductFilenames = (p) => {
    const out = [];
    if (p.imageFilename) out.push(p.imageFilename);
    if (Array.isArray(p.images)) out.push(...p.images.filter(Boolean));
    if (Array.isArray(p.packageItems)) {
      p.packageItems.forEach((item) => {
        if (Array.isArray(item.images)) {
          out.push(...item.images.filter(Boolean));
        }
      });
    }
    return out;
  };

  const filenamesToDelete = [
    ...(contract.products || []).flatMap(collectProductFilenames),
    ...signatures.map((s) => s.signatureFilename).filter(Boolean),
  ];

  if (filenamesToDelete.length > 0) {
    await Image.deleteMany({ filename: { $in: filenamesToDelete } });
  }
  await Signature.deleteMany({ contractId: contract._id });
  await Contract.deleteOne({ _id: contract._id });

  res.status(204).json({ status: "success", data: null });
});
