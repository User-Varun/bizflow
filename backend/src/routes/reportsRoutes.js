const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reportsController");
const authController = require("../controllers/authController");

router.post("/download", authController.protect, reportsController.downloadReport);

module.exports = router;
