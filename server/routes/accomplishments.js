const express = require("express");
const { check } = require("express-validator");
const {
  createAccomplishment,
  getAccomplishments,
  getAccomplishment,
  addComment,
  reviewAccomplishment,
  exportAccomplishments,
  addEmployeeReply,
  modifyAccomplishment,
  startAccomplishment,
} = require("../controllers/accomplishments/index");
const { protect, authorize } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const router = express.Router();

router.post(
  "/",
  [
    protect,
    upload.array("files"),
    (err, req, res, next) => {
      if (err && err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ success: false, message: "الملف كبير جداً" });
      }
      next(err);
    },
    check("description", "Description is required").not().isEmpty(),
  ],
  createAccomplishment
);

router.get("/export", protect, authorize("manager"), exportAccomplishments);

router.get("/", protect, getAccomplishments);

router.get("/:id", protect, getAccomplishment);

router.post(
  "/:id/comments",
  [protect, check("text", "Comment text is required").not().isEmpty()],
  addComment
);

router.post(
  "/:id/comments/:commentId/reply",
  [protect, check("text", "Reply text is required").not().isEmpty()],
  addEmployeeReply
);

router.put("/:id/review", protect, authorize("manager"), reviewAccomplishment);

router.put(
  "/:id/modify",
  [
    protect,
    upload.array("files"),
    check("description", "Description is required").not().isEmpty(),
  ],
  modifyAccomplishment
);

router.put("/:id/start", protect, upload.array("files"), startAccomplishment);

module.exports = router;
