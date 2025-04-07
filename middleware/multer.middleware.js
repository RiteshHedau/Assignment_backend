const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");

const dir = path.resolve(__dirname, "./../public/temp");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = crypto.randomBytes(10).toString("hex");
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

module.exports = upload;