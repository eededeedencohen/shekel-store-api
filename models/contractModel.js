const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");

const tokenAlphabet =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const generateToken = customAlphabet(tokenAlphabet, 16);

const productSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    notes: { type: [String], default: [] },
    notesStyle: {
      type: String,
      enum: ["number", "dash", "dot", "star", "check", "arrow"],
      default: "dot",
    },
    pricing: {
      unitPrice: { type: Number, default: 0 },
      discountPercent: { type: Number, default: 0 },
      unitPriceAfterDiscount: { type: Number, default: 0 },
      minimumUnits: { type: Number, default: 0 },
      totalForMinimum: { type: Number, default: 0 },
      freeText: { type: String, default: "" },
    },
    imageFilename: { type: String, default: "" },
  },
  { _id: true }
);

const contractSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "הסכם עבודה - שק'ל",
      trim: true,
    },
    recipient: {
      type: String,
      default: "",
      trim: true,
    },
    bulletPoints: {
      type: [String],
      default: [],
    },
    bulletStyle: {
      type: String,
      enum: ["number", "dash", "dot", "star", "check", "arrow"],
      default: "number",
    },
    products: {
      type: [productSchema],
      default: [],
    },
    closingNotes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

contractSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  if (this.status === "published" && !this.shareToken) {
    this.shareToken = generateToken();
  }
  next();
});

contractSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;
