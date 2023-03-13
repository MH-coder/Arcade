const passport = require("passport");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3 } = require("../services/aws.services");

const path = require("path");
const passportConfig = require("../config/passport.js");
const userController = require("../controllers/user.js");

const uploadPortfolioThumbnail = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const url = `projects/${req.user.id}/portfolio${ext}`;
      cb(null, url);
    },
  }),
});

module.exports = function (app) {
  app.get("/login", userController.getLogin);
  app.post("/login", userController.postLogin);
  app.get("/logout", userController.logout);
  app.get("/forgot", userController.getForgot);
  app.post("/forgot", userController.postForgot);
  app.get("/reset/:token", userController.getReset);
  app.post("/reset/:token", userController.postReset);
  app.post("/signup", userController.postSignup);
  app.get("/account/verify/:userId/:token", userController.verifyEmail);
  app.get("/success", (req, res) => {
    return res.render("account/verification-success")
  });

  app.post("/account/username", userController.updateUsername);
  app.use("/account", passportConfig.isAuthenticated);
  app.get("/account/deactivate", userController.deactivateAccount);
  app.get("/account", userController.getAccount);
  app.get("/account/verify", userController.getVerifyEmail);
  
  app.post("/account/profile", userController.postUpdateProfile);
  app.post("/account/password", userController.postUpdatePassword);
  app.post("/account/delete", userController.postDeleteAccount);
  app.get("/account/unlink/:provider", userController.getOauthUnlink);
  app.post(
    "/account/portfolio",
    uploadPortfolioThumbnail.single("thumbnail"),
    userController.postPortfolioThumbnail
  );

  app.get(
    "/auth/facebook",
    passport.authenticate("facebook", { scope: ["email", "public_profile"] })
  );
  app.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect(req.session.returnTo || "/create");
    }
  );
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      accessType: "offline",
      prompt: "consent",
    })
  );
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect(req.session.returnTo || "/create");
    }
  );
  app.get("/auth/twitter", passport.authenticate("twitter"));
  app.get(
    "/auth/twitter/callback",
    passport.authenticate("twitter", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect(req.session.returnTo || "/create");
    }
  );

  app.get('/:username', userController.getProfile);
};
