const express = require("express");
const router = express.Router();
const { spacesController } = require("../controllers");
const { get_overview, get_buildings, get_occupancy_graph, monthly_obligation, get_department_headcounts, get_buildings_based_on_space_types, get_space_types_names_based_on_buildings } = spacesController;

router.get("/get", get_overview);
router.get("/get_buildings", get_buildings);
router.get("/get_occupancy_graph", get_occupancy_graph);
router.get("/monthly_obligation", monthly_obligation);
router.get("/get_department_headcounts", get_department_headcounts);
router.get("/get_buildings_based_on_space_types", get_buildings_based_on_space_types);
router.get("/get_space_types_names_based_on_buildings", get_space_types_names_based_on_buildings);

module.exports = router;
