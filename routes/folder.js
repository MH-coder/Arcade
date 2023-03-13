const passportConfig = require("../config/passport.js");
const folderController = require("../controllers/folder.js");

module.exports = function (app) {
  app.use("/folder", passportConfig.isAuthenticated);
  app.post("/folder/create", folderController.postCreate);
  app.post("/folder/delete/:id", folderController.postDelete);
  app.post("/folder/update/:id", folderController.postUpdate);
  app.post("/folder/duplicate/:id", folderController.postDuplicate);
};
