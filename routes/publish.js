const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuidv4 } = require("uuid");
const { s3 } = require("../services/aws.services");

const path = require("path");
const passportConfig = require("../config/passport.js");
const publishController = require("../controllers/publish.js");

const uploadPortfolioThumbnail = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    key: function (req, file, cb) {
      let slug = req.body.slug;
      slug = slug.split('/')[1];
      const ext = path.extname(file.originalname);
      const url = `publishes/${slug}/thumbnail${ext}`;
      cb(null, url);
    },
  }),
});

module.exports = function (app) {
  app.use("/publish", passportConfig.isAuthenticated);
  app.get("/publish/list", publishController.getPublishList);
  app.post("/publish/create", publishController.postCreate);
  app.post("/publish/delete", publishController.postDelete);
  app.post("/publish", publishController.postPublish);
  app.get("/publish/portfolio/list", publishController.getPortfolioList);
  app.post("/publish/portfolio/add", publishController.postPortfolioAdd);
  app.post("/publish/portfolio/delete", publishController.postPortfolioDelete);
  app.post("/publish/portfolio/rename", publishController.postPortfolioRename);
  app.post("/publish/portfolio/description", publishController.postPortfolioDescription);
  app.post(
    "/publish/portfolio/thumbnail",
    uploadPortfolioThumbnail.single("thumbnail"),
    publishController.postPortfolioThumbnail
  );
  app.post(
    "/publish/portfolio/reorder",
    publishController.postPortfolioReorder
  );
};
