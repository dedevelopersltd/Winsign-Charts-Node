const express = require("express");
const router = express.Router();
const { userController } = require("../controllers");
const authMiddleware = require("../middlewares").authMiddleware;
const { multerPlugin } = require("../plugins/");
const { upload } = multerPlugin;
// Set up a route for uploading images
router.post(
  "/change-profile",
  authMiddleware,
  upload.single("image"),
  userController.changeProfile
);
router.post("/update", authMiddleware, userController.updateProfile);
router.post(
  "/change-password",
  authMiddleware,
  userController.updateUserPassword
);
module.exports = router;
