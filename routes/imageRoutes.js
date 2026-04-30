const express = require("express");
const multer = require("multer");
const imageController = require("../controllers/imageController");
const authController = require("../controllers/authController");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.post(
  "/upload-signature",
  upload.single("image"),
  imageController.uploadSignatureImage
);

router.get("/:filename", imageController.getImage);

router.use(authController.protect);

router.post("/upload", upload.single("image"), imageController.uploadImage);
router.delete("/:filename", imageController.deleteImage);

module.exports = router;
