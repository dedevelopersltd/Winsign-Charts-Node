const express = require("express");
const router = express.Router();
const { chatController } = require("../controllers");
const { chat_with_ai, get_thread, update_threads } = chatController;
router.post("/message", chat_with_ai);
router.post("/get_thread", get_thread);
router.post("/update_thread", update_threads)

// exporting the routes
module.exports = router;
