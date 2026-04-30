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
});

signatureSchema.index({ shareToken: 1, signerIdNumber: 1 }, { unique: true });

const Signature = mongoose.model("Signature", signatureSchema);

module.exports = Signature;
