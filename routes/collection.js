const passportConfig = require("../config/passport.js");
const collectionController = require("../controllers/collection.js");

module.exports = function (app) {
  app.use("/collection", passportConfig.isAuthenticated);
  app.post("/collection/create", collectionController.postCreate);
  app.post("/collection/delete/:id", collectionController.postDelete);
  app.post("/collection/update/:id", collectionController.postUpdate);
  app.post("/collection/reorder", collectionController.postReorder);
};
