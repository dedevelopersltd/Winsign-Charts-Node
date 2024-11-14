const express = require("express");
const router = express.Router();
const { attendanceController } = require("../controllers");
const { get_attendances } = attendanceController;

router.get("/get", get_attendances);

module.exports = router;
