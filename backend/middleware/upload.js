const multer = require("multer");
const path = require("path");
const fs = require("fs");
const AppError = require("../utils/appError");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `media-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4"
  ];

  if (!allowed.includes(file.mimetype)) {
    cb(new AppError("Unsupported file type", 400), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

const deleteFile = async filename => {
  try {
    await fs.promises.unlink(path.join(uploadDir, filename));
  } catch (err) {
    console.error("File delete error:", err);
  }
};

module.exports = { upload, deleteFile };
