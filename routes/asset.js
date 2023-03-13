const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuidv4 } = require("uuid");
const { s3 } = require("../services/aws.services");

const path = require("path");
const passportConfig = require("../config/passport.js");
const assetController = require("../controllers/asset.js");

const uploadProjectThumbnail = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    key: function (req, file, cb) {
      const uid = req.user.id;
      const pid = req.body.id;
      const ext = path.extname(file.originalname);
      const url = `projects/${uid}/${pid}/thumbnail${ext}`;
      cb(null, url);
    },
  }),
});

const uploadExampleProjectThumbnail = multer({
	storage: multerS3({
		s3: s3,
		bucket: process.env.S3_BUCKET,
		key: function (req, file, cb) {
			const pid = req.body.id;
			const ext = path.extname(file.originalname);
			const url = `examples/${pid}/thumbnail${ext}`;
			cb(null, url);
		},
	}),
});

const uploadAssets = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const type = req.body.type.toLowerCase();
      const name = uuidv4() + path.extname(file.originalname);
      const url = `uploads/${type}/${name}`;
      cb(null, url);
    },
  }),
});

module.exports = function (app) {
  app.use("/asset", passportConfig.isAuthenticated);
  app.get("/asset/projects/:id", assetController.renderProject);
  app.get("/asset/project/list", assetController.getProjectList);
  app.get("/asset/project/state_url", assetController.getProjectStateUrl);
  app.post("/asset/project/create", assetController.postProjectCreate);
  app.post("/asset/project/duplicate", assetController.postProjectDuplicate);
  app.post("/asset/project/update", assetController.postProjectUpdate);
  app.post("/asset/project/delete", assetController.postProjectDelete);
  app.post("/asset/project/allowDownload", assetController.postProjectAllowDownload);
  app.post("/asset/project/download", assetController.postProjectDownload);
  app.post("/asset/project/config", assetController.postProjectConfig);
  app.post("/asset/project/state", assetController.postProjectState);
  app.post(
    "/asset/project/thumbnail",
    uploadProjectThumbnail.single("thumbnail"),
    assetController.postProjectThumbnail
  );

  app.post("/asset/example-project", assetController.createExampleProject);
  app.get("/asset/example-project/list", assetController.getExampleProjectList);
  app.put("/asset/example-project/:id", assetController.updateExampleProject);
  app.post("/asset/example-project/duplicate/:id", assetController.duplicateExampleProject);
  app.post("/asset/example-project/:id/delete", assetController.deleteExampleProject);
  app.post(
		"/asset/example-project/create-normal-project/:id",
		assetController.createProjectFromExampleProject
	);
  app.put("/asset/example-projects/update-orders", assetController.updateExampleProjectsOrder);
  app.post(
		'/asset/example-project/thumbnail',
		uploadExampleProjectThumbnail.single('thumbnail'),
		assetController.postExampleProjectThumbnail
	);


  app.get("/asset/geometry/list", assetController.getGeometryList);
  app.get("/asset/my-geometry", assetController.getMyGeometry);
  app.get("/asset/my-geometry/:pId", assetController.getMyGeometry);
  app.post("/asset/my-geometry/add", assetController.postMyGeometryAdd);
  app.post(
    "/asset/my-geometry/update/:id",
    assetController.postMyGeometryUpdate
  );
  app.post("/asset/my-geometry/delete", assetController.postMyGeometryDelete);
  app.post(
    "/asset/my-geometry/upload",
    uploadAssets.array("file"),
    assetController.postMyGeometryUpload
  );

  app.get("/asset/material/list", assetController.getMaterialList);
  app.get("/asset/my-material", assetController.getMyMaterial);
  app.get("/asset/my-material/:pId", assetController.getMyMaterial);
  app.post("/asset/my-material/add", assetController.postMyMaterialAdd);
  app.post(
    "/asset/my-material/update/:id",
    assetController.postMyMaterialUpdate
  );
  app.post("/asset/my-material/delete", assetController.postMyMaterialDelete);
  app.post(
    "/asset/my-material/upload",
    uploadAssets.array("file"),
    assetController.postMyMaterialUpload
  );

  app.get("/asset/image/list", assetController.getImageList);
  app.get("/asset/my-image", assetController.getMyImage);
  app.get("/asset/my-image/:pId", assetController.getMyImage);
  app.post("/asset/my-image/add", assetController.postMyImageAdd);
  app.post("/asset/my-image/update/:id", assetController.postMyImageUpdate);
  app.post("/asset/my-image/delete", assetController.postMyImageDelete);
  app.post(
    "/asset/my-image/upload",
    uploadAssets.array("file"),
    assetController.postMyImageUpload
  );

  app.get("/asset/audio/list", assetController.getAudioList);
  app.get("/asset/my-audio", assetController.getMyAudio);
  app.get("/asset/my-audio/:pId", assetController.getMyAudio);
  app.post("/asset/my-audio/add", assetController.postMyAudioAdd);
  app.post("/asset/my-audio/update/:id", assetController.postMyAudioUpdate);
  app.post("/asset/my-audio/delete", assetController.postMyAudioDelete);
  app.post(
    "/asset/my-audio/upload",
    uploadAssets.array("file"),
    assetController.postMyAudioUpload
  );

  app.get("/asset/my-video", assetController.getMyVideo);
  app.get("/asset/my-video/:pId", assetController.getMyVideo);
  app.post("/asset/my-video/add", assetController.postMyVideoAdd);
  app.post("/asset/my-video/update/:id", assetController.postMyVideoUpdate);
  app.post("/asset/my-video/delete", assetController.postMyVideoDelete);
  app.post(
    "/asset/my-video/upload",
    uploadAssets.array("file"),
    assetController.postMyVideoUpload
  );

  app.get("/asset/environment/list", assetController.getEnvironmentList);
  app.get("/asset/my-environment", assetController.getMyEnvironment);
  app.get("/asset/my-environment/:pId", assetController.getMyEnvironment);
  app.post("/asset/my-environment/add", assetController.postMyEnvironmentAdd);
  app.post(
    "/asset/my-environment/update/:id",
    assetController.postMyEnvironmentUpdate
  );
  app.post(
    "/asset/my-environment/delete",
    assetController.postMyEnvironmentDelete
  );
  app.post(
    "/asset/my-environment/upload",
    uploadAssets.array("file"),
    assetController.postMyEnvironmentUpload
  );

  app.get("/asset/my-font/:projectId", assetController.getMyFont);
  app.post(
    "/asset/my-font/upload",
    uploadAssets.array("file"),
    assetController.postMyFontUpload
  );

  app.get("/asset/animation/list", assetController.getAnimationList);
  app.get("/asset/my-animation", assetController.getMyAnimation);
  app.get("/asset/my-animation/:pId", assetController.getMyAnimation);
  app.post("/asset/my-animation/add", assetController.postMyAnimationAdd);
  app.post(
    "/asset/my-animation/update/:id",
    assetController.postMyAnimationUpdate
  );
  app.post("/asset/my-animation/delete", assetController.postMyAnimationDelete);
  app.post(
    "/asset/my-animation/upload",
    uploadAssets.array("file"),
    assetController.postMyAnimationUpload
  );

  app.get("/app_asset/image", assetController.getAppImage);
  app.get("/app_asset/material", assetController.getAppMaterial);
  app.get("/app_asset/audio", assetController.getAppAudio);
  app.get("/app_asset/video", assetController.getAppVideo);
  app.get("/app_asset/environment", assetController.getAppEnvironment);
  app.get("/app_asset/animation", assetController.getAppAnimation);
  app.get("/app_asset/font", assetController.getAppFont);

  app.get('/:username/:slug', assetController.renderApp);
};
