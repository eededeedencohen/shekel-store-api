const express = require("express");
const signatureController = require("../controllers/signatureController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/share/:token/check", signatureController.checkSignature);
router.post("/share/:token/verify", signatureController.verifySignature);
router.post("/share/:token", signatureController.createSignature);

router.use(authController.protect);

router.get("/", signatureController.getAllSignatures);
router
  .route("/:id")
  .get(signatureController.getSignature)
  .delete(signatureController.deleteSignature);

module.exports = router;
