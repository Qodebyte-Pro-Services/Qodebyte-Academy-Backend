const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedDocs = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  
  if (file.fieldname === "receipt") {
    if (file.mimetype.startsWith("image/") || allowedDocs.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Receipt must be an image, PDF, or Word document!"), false);
  }

  
  if (file.fieldname === "logo") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Logo must be an image file!"), false);
  }

    if (file.fieldname === "site_logo") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Site logo must be an image file!"), false);
  }

  
  if (file.fieldname === "photo") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Photo must be an image file (jpg, png, etc.)!"), false);
  }

  if (file.fieldname === "profilePic") {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  return cb(new Error("Profile picture must be an image file (jpg, png, etc.)!"), false);
}

  
  if (["file", "documents"].includes(file.fieldname)) {
    if (file.mimetype.startsWith("image/") || allowedDocs.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Documents must be images, PDFs, or Word files!"), false);
  }
    if (file.fieldname === "product_file") {
    return cb(null, true); 
  }

  if (file.fieldname === "gallery_images") {
    return cb(null, true); 
  }

  if (file.fieldname.startsWith("video_")) {
    return cb(null, true);
  }

 
  if (file.fieldname.startsWith("resources_")) {
    return cb(null, true);
  }

  
  if (file.fieldname === "thumbnail") {
    return cb(null, true); 
  }
  
  return cb(new Error(`Unexpected field: ${file.fieldname}`), false);
};

const upload = multer({ storage, fileFilter });

const uploadProductFiles = upload.fields([
  { name: "product_file", maxCount: 1 },
  { name: "gallery_images", maxCount: 10 },
]);

module.exports = { upload, uploadProductFiles };
