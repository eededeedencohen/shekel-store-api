const express = require("express");
const contractController = require("../controllers/contractController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/share/:token", contractController.getContractByToken);

router.use(authController.protect);

router
  .route("/")
  .get(contractController.getAllContracts)
  .post(contractController.createContract);

router.patch("/:id/publish", contractController.publishContract);
router.patch("/:id/unpublish", contractController.unpublishContract);
router.post("/:id/duplicate", contractController.duplicateContract);

router
  .route("/:id")
  .get(contractController.getContract)
  .patch(contractController.updateContract)
  .delete(contractController.deleteContract);

module.exports = router;
