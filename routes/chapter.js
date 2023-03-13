const passportConfig = require("../config/passport.js");
const chapterController = require("../controllers/chapter.js");

module.exports = function (app) {
  app.use("/chapter", passportConfig.isAuthenticated);
  app.post("/chapter/create", chapterController.postCreate);
  app.post("/chapter/delete/:id", chapterController.postDelete);
  app.post("/chapter/update/:id", chapterController.postUpdate);
  app.post("/chapter/reorder", chapterController.postReorder);
};
