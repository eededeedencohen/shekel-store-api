const mongoose = require("mongoose");

const packageItemSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    notes: { type: [String], default: [] },
  },
  { _id: false }
);

const catalogProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "שם המוצר במאגר חסר"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["single", "package"],
      default: "single",
    },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    // Manual desktop gallery arrangement carried over from the contract
    // product (same shape as contractModel's productSchema.imageLayout).
    imageLayout: { type: mongoose.Schema.Types.Mixed, default: null },
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const CatalogProduct = mongoose.model(
  "CatalogProduct",
  catalogProductSchema
);

module.exports = CatalogProduct;
