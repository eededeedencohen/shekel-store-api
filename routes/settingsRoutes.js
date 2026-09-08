const express = require("express");
const settingsController = require("../controllers/settingsController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(settingsController.getSettings)
  .patch(settingsController.updateSettings);

module.exports = router;
