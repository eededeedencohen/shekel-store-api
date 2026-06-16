const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");

const tokenAlphabet =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const generateToken = customAlphabet(tokenAlphabet, 16);

const packageItemSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    notes: { type: [String], default: [] },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    title: { type: String, default: "משלוח אקספרס", trim: true },
    price: { type: Number, default: 0 },
    color: { type: String, default: "#1E40AF" },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["single", "package"],
      default: "single",
    },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    imageFilename: { type: String, default: "" },
    packageTitle: { type: String, default: "" },
    packageItems: { type: [packageItemSchema], default: [] },
    notes: { type: [String], default: [] },
    notesStyle: {
      type: String,
      enum: ["number", "dash", "dot", "star", "check", "arrow"],
      default: "dot",
    },
    notesColor: {
      type: String,
      default: "#1E40AF",
    },
    pricing: {
      unitPrice: { type: Number, default: 0 },
      discountPercent: { type: Number, default: 0 },
      unitPriceAfterDiscount: { type: Number, default: 0 },
      minimumUnits: { type: Number, default: 0 },
      totalForMinimum: { type: Number, default: 0 },
      freeText: { type: String, default: "" },
    },
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
    bulletPointsLocked: {
      type: [Boolean],
      default: [],
    },
    bulletsTitle: {
      type: String,
      default: "נקודות עיקריות",
      trim: true,
    },
    bulletsTitleVisible: {
      type: Boolean,
      default: true,
    },
    bulletStyle: {
      type: String,
      enum: ["number", "dash", "dot", "star", "check", "arrow"],
      default: "number",
    },
    bulletColor: {
      type: String,
      default: "#1E40AF",
    },
    products: {
      type: [productSchema],
      default: [],
    },
    shippings: {
      type: [shippingSchema],
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
    pinned: {
      type: Boolean,
      default: false,
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
