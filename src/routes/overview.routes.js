const express = require("express");
const router = express.Router();
const { overviewController } = require("../controllers");
const { get_overview, get_buildings, get_map, monthly_obligation, get_departments, get_buildings_based_on_space_types } = overviewController;

router.get("/get", get_overview);
router.get("/get_buildings", get_buildings);
router.get("/get_map", get_map);
router.get("/monthly_obligation", monthly_obligation);
router.get("/get_departments", get_departments);
router.get("/get_buildings_based_on_space_types", get_buildings_based_on_space_types);

module.exports = router;
