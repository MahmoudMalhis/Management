const express = require("express");
const router = express.Router();
const { GalleryFolder } = require("../models");
const { protect } = require("../middlewares/auth");

router.get("/folders", protect, async (req, res) => {
  try {
    const folders = await GalleryFolder.findAll({
      attributes: ["_id", "name", "files", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    res.json({
      folders: folders.map((f) => ({
        _id: f._id,
        name: f.name,
        filesCount: Array.isArray(f.files) ? f.files.length : 0,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/folders/:id", protect, async (req, res) => {
  try {
    const folder = await GalleryFolder.findByPk(req.params.id);
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    res.json({ folder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post("/add-files", protect, async (req, res) => {
  try {
    const { files, folderName } = req.body;
    if (!folderName) {
      return res.status(400).json({ message: "folderName required" });
    }
    let folder = await GalleryFolder.findOne({ where: { name: folderName } });
    if (!folder) {
      folder = await GalleryFolder.create({
        name: folderName,
        createdBy: req.user.id,
        files: files || [],
      });
    } else {
      const existing = Array.isArray(folder.files) ? folder.files : [];
      const existingPaths = existing.map((f) => f.filePath);
      const newFiles = (files || []).filter(
        (f) => !existingPaths.includes(f.filePath)
      );
      folder.files = existing.concat(newFiles);
      await folder.save();
    }
    res.json({ success: true, folder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
