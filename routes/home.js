const passportConfig = require("../config/passport.js");
const homeController = require("../controllers/home.js");

module.exports = function (app) {
  app.get("/", homeController.index);
  app.get("/learn", homeController.learn);
  app.post("/contact", homeController.contact);
  app.get("/create", passportConfig.isAuthenticated, homeController.create);
};
