const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema({
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contract",
    required: true,
    index: true,
  },
  shareToken: {
    type: String,
    required: true,
    index: true,
  },
  signerName: {
    type: String,
    required: [true, "Signer name is required"],
    trim: true,
  },
  signerIdNumber: {
    type: String,
    required: [true, "Signer ID number is required"],
    trim: true,
  },
  signerNote: {
    type: String,
    default: "",
  },
  signatureFilename: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    default: "unknown",
  },
  signedAt: {
    type: Date,
    default: Date.now,
  },
  signedAtIsrael: {
    type: String,
    default: "",
  },
  // Legacy single-choice fields — kept populated with the FIRST chosen
  // option for backward compatibility with older read paths.
  chosenOptionId: {
    type: String,
    default: "",
  },
  chosenOptionLabel: {
    type: String,
    default: "",
  },
  // One entry per choice section the contract presented.
  chosenOptions: {
    type: [
      {
        sectionIdx: { type: Number, default: 0 },
        optionId: { type: String, default: "" },
        optionLabel: { type: String, default: "" },
      },
    ],
    default: [],
  },
});

signatureSchema.index({ shareToken: 1, signerIdNumber: 1 }, { unique: true });

const Signature = mongoose.model("Signature", signatureSchema);

module.exports = Signature;
