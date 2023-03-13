const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuidv4 } = require("uuid");
const { s3 } = require("../services/aws.services");

const path = require("path");
const roles = require("../config/roles.js");
const passportConfig = require("../config/passport.js");
const adminController = require("../controllers/admin.js");

const uploadSampleThumbnail = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    key: function (req, file, cb) {
      const name = uuidv4() + path.extname(file.originalname);
      const url = `samples/${name}`;
      cb(null, url);
    },
  }),
});

module.exports = function (app) {
  app.get(
    "/admin",
    passportConfig.isAuthenticated,
    passportConfig.isInRole(roles.SuperAdmin, roles.Admin),
    adminController.index
  );
  app.post("/admin/sample", adminController.createSample);
  app.put("/admin/sample/:id", adminController.updateSample);
  app.delete("/admin/sample/:id", adminController.deleteSample);
  app.post(
    "/admin/sample/thumbnail",
    uploadSampleThumbnail.single("thumbnail"),
    adminController.uploadSampleThumbnail
  );
  app.post("/admin/sample/reorder", adminController.reorderSample);
};
