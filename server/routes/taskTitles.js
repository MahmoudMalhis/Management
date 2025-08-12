const express = require("express");
const router = express.Router();
const taskTitlesController = require("../controllers/taskTitles");

router.get("/", taskTitlesController.getTaskTitles);
router.post("/", taskTitlesController.addTaskTitle);
router.put("/:id", taskTitlesController.editTaskTitle);
router.delete("/:id", taskTitlesController.deleteTaskTitle);

module.exports = router;
