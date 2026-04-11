const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

function createMulterUpload(options = {}) {
  const multerOptions = { storage };
  if (options.fileFilter) multerOptions.fileFilter = options.fileFilter;
  if (options.limits) multerOptions.limits = options.limits;
  return multer(multerOptions);
}

module.exports = { createMulterUpload, uploadDir };
