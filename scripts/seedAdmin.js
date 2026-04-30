const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const Admin = require("../models/adminModel");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

(async () => {
  try {
    await mongoose.connect(DB);
    console.log("DB connected for seeding...");

    const username = process.env.ADMIN_USERNAME || "eyal";
    const password = process.env.ADMIN_PASSWORD || "shekel2026";

    const existing = await Admin.findOne({ username });
    if (existing) {
      console.log(`Admin '${username}' already exists. Skipping.`);
    } else {
      const admin = new Admin({ username, password });
      await admin.save();
      console.log(`Admin '${username}' created successfully.`);
    }
  } catch (err) {
    console.error("Seeding error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
