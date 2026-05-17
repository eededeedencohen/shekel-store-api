const express = require("express");
const catalogController = require("../controllers/catalogController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(catalogController.list)
  .post(catalogController.create);

router.post("/save-from-contract", catalogController.saveFromContractProduct);
router.post("/:id/clone", catalogController.clone);

router
  .route("/:id")
  .get(catalogController.get)
  .patch(catalogController.update)
  .delete(catalogController.remove);

module.exports = router;
