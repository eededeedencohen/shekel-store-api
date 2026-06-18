const Contract = require("../models/contractModel");
const Signature = require("../models/signatureModel");
const Image = require("../models/imageModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const getClientIp = require("../utils/getClientIp");

const formatIsraelTime = (date) => {
  try {
    const fmt = new Intl.DateTimeFormat("he-IL", {
      timeZone: "Asia/Jerusalem",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return fmt.format(date);
  } catch (e) {
    return date.toISOString();
  }
};

const normalizeId = (s) => (s || "").toString().trim();

exports.checkSignature = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { idNumber } = req.query;

  const contract = await Contract.findOne({
    shareToken: token,
    status: "published",
  });
  if (!contract) {
    return next(new AppError("Contract not found", 404));
  }

  if (!idNumber) {
    return res.status(200).json({
      status: "success",
      data: { exists: false },
    });
  }

  const sig = await Signature.findOne({
    shareToken: token,
    signerIdNumber: normalizeId(idNumber),
  });

  res.status(200).json({
    status: "success",
    data: {
      exists: !!sig,
      signature: sig
        ? {
            signerName: sig.signerName,
            signerIdNumber: sig.signerIdNumber,
            signedAt: sig.signedAt,
            signedAtIsrael: sig.signedAtIsrael,
            signatureUrl: `/api/v1/images/${sig.signatureFilename}`,
            signerNote: sig.signerNote,
            chosenOptionId: sig.chosenOptionId,
            chosenOptionLabel: sig.chosenOptionLabel,
          }
        : null,
    },
  });
});

exports.verifySignature = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { signerName, signerIdNumber } = req.body;

  if (!signerName || !signerIdNumber) {
    return next(new AppError("Please provide name and ID", 400));
  }

  const sig = await Signature.findOne({
    shareToken: token,
    signerIdNumber: normalizeId(signerIdNumber),
  });

  if (!sig) {
    return next(new AppError("No signature found for these details", 404));
  }

  if (
    sig.signerName.replace(/\s+/g, "").toLowerCase() !==
    signerName.replace(/\s+/g, "").toLowerCase()
  ) {
    return next(new AppError("Name does not match our records", 401));
  }

  res.status(200).json({
    status: "success",
    data: {
      signature: {
        signerName: sig.signerName,
        signerIdNumber: sig.signerIdNumber,
        signedAt: sig.signedAt,
        signedAtIsrael: sig.signedAtIsrael,
        signatureUrl: `/api/v1/images/${sig.signatureFilename}`,
        signerNote: sig.signerNote,
        ipAddress: sig.ipAddress,
        chosenOptionId: sig.chosenOptionId,
        chosenOptionLabel: sig.chosenOptionLabel,
      },
    },
  });
});

exports.createSignature = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const {
    signerName,
    signerIdNumber,
    signerNote,
    signatureFilename,
    chosenOptionId,
    chosenOptionLabel,
  } = req.body;

  if (!signerName || !signerIdNumber || !signatureFilename) {
    return next(new AppError("Missing required fields", 400));
  }

  const contract = await Contract.findOne({
    shareToken: token,
    status: "published",
  });
  if (!contract) {
    return next(new AppError("Contract not found", 404));
  }

  // If contract has options, chosen option is required
  if (
    Array.isArray(contract.options) &&
    contract.options.length > 0 &&
    !chosenOptionId
  ) {
    return next(new AppError("יש לבחור אפשרות לפני החתימה", 400));
  }

  const idNorm = normalizeId(signerIdNumber);

  const existing = await Signature.findOne({ shareToken: token });
  if (existing) {
    return next(new AppError("Contract has already been signed", 409));
  }

  const sigImage = await Image.findOne({ filename: signatureFilename });
  if (!sigImage) {
    return next(new AppError("Signature image not found", 400));
  }

  const ip = getClientIp(req);
  const now = new Date();

  let resolvedOptionLabel = "";
  if (chosenOptionId) {
    const chosen = (contract.options || []).find(
      (o) => String(o._id) === String(chosenOptionId)
    );
    if (!chosen) {
      return next(new AppError("האפשרות שנבחרה לא נמצאה בחוזה", 400));
    }
    resolvedOptionLabel = chosenOptionLabel || chosen.label || "";
  }

  const signature = await Signature.create({
    contractId: contract._id,
    shareToken: token,
    signerName: signerName.trim(),
    signerIdNumber: idNorm,
    signerNote: (signerNote || "").trim(),
    signatureFilename,
    ipAddress: ip,
    signedAt: now,
    signedAtIsrael: formatIsraelTime(now),
    chosenOptionId: chosenOptionId || "",
    chosenOptionLabel: resolvedOptionLabel,
  });

  res.status(201).json({
    status: "success",
    data: { signature },
  });
});

exports.getAllSignatures = catchAsync(async (req, res, next) => {
  const filter = {};
  if (req.query.contractId) filter.contractId = req.query.contractId;

  const rawSignatures = await Signature.find(filter).sort({ signedAt: -1 });

  const referencedIds = [
    ...new Set(
      rawSignatures
        .map((s) => s.contractId && String(s.contractId))
        .filter(Boolean)
    ),
  ];

  const existingContracts = await Contract.find(
    { _id: { $in: referencedIds } },
    "_id title recipient status"
  );
  const contractById = new Map(
    existingContracts.map((c) => [String(c._id), c])
  );

  const orphans = rawSignatures.filter(
    (s) => !s.contractId || !contractById.has(String(s.contractId))
  );

  if (orphans.length > 0) {
    const orphanIds = orphans.map((s) => s._id);
    const orphanFilenames = orphans
      .map((s) => s.signatureFilename)
      .filter(Boolean);
    await Signature.deleteMany({ _id: { $in: orphanIds } });
    if (orphanFilenames.length > 0) {
      await Image.deleteMany({ filename: { $in: orphanFilenames } });
    }
  }

  const valid = rawSignatures
    .filter((s) => s.contractId && contractById.has(String(s.contractId)))
    .map((s) => {
      const obj = s.toObject();
      obj.contractId = contractById.get(String(s.contractId));
      return obj;
    });

  res.status(200).json({
    status: "success",
    results: valid.length,
    data: { signatures: valid },
  });
});

exports.getSignature = catchAsync(async (req, res, next) => {
  const sig = await Signature.findById(req.params.id).populate(
    "contractId"
  );
  if (!sig) {
    return next(new AppError("Signature not found", 404));
  }
  res.status(200).json({ status: "success", data: { signature: sig } });
});

exports.deleteSignature = catchAsync(async (req, res, next) => {
  const sig = await Signature.findByIdAndDelete(req.params.id);
  if (!sig) return next(new AppError("Signature not found", 404));
  res.status(204).json({ status: "success", data: null });
});
