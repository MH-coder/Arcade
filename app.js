/**
 * Module dependencies.
 */
const express = require("express");
const compression = require("compression");
const session = require("express-session");
const bodyParser = require("body-parser");
const logger = require("morgan");
const chalk = require("chalk");
const errorHandler = require("errorhandler");
const lusca = require("lusca");
const dotenv = require("dotenv");
const pgSession = require("connect-pg-simple")(session);
const flash = require("express-flash");
const path = require("path");
const passport = require("passport");
const expressStatusMonitor = require("express-status-monitor");
const sass = require("node-sass-middleware");

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env" });

/**
 * Create Express server.
 */
const app = express();

/**
 * Express configuration.
 */
app.set("host", process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0");
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(expressStatusMonitor());
app.use(compression());
app.use(
  sass({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    debug: true,
    outputStyle: "compressed",
  })
);
app.use(logger("dev"));
require("./routes/stripe.js")(app);
app.use(bodyParser.json({ limit: "500mb" }))
app.use(
  bodyParser.urlencoded({
    limit: "500mb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 1209600000 }, // two weeks in milliseconds
    store: new pgSession({
      conString: process.env.POSTGRES_URI,
      tableName: "Sessions",
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
//app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  if (
    req.path.startsWith("/asset/") ||
    req.path.startsWith("/folder/") ||
    req.path.startsWith("/publish") ||
    req.path.startsWith("/account/portfolio") ||
    req.path.startsWith("/account/username") ||
    req.path.startsWith("/admin/sample/thumbnail")
  ) {
    // Multer multipart/form-data handling needs to occur before the Lusca CSRF check.
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (
    !req.user &&
    req.path !== "/login" &&
    req.path !== "/signup" &&
    req.originalUrl !== "/success" &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/\./)
  ) {
    req.session.returnTo = req.originalUrl;
  } else if (
    req.user &&
    (req.path === "/account" || req.path.match(/^\/api/))
  ) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});
app.use(
  "/",
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/chart.js/dist"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/popper.js/dist/umd"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/jquery/dist"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/sortablejs"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/jquery-sortablejs"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "public/js/lib/app/lazysizes.min"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/@lottiefiles/lottie-player/dist"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/js/lib",
  express.static(path.join(__dirname, "node_modules/lottie-web/build/player"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/css",
  express.static(path.join(__dirname, "node_modules/typeface-exo"), {
    maxAge: 31557600000,
  }),
  express.static(path.join(__dirname, "node_modules/typeface-montserrat"), {
    maxAge: 31557600000,
  })
);
app.use(
  "/webfonts",
  express.static(
    path.join(__dirname, "node_modules/@fortawesome/fontawesome-free/webfonts"),
    { maxAge: 31557600000 }
  )
);
app.use(
  "/js/download",
  express.static(
    path.join(__dirname, "public/js/lib/app"),
    { maxAge: 31557600000 }
  )
);

/**
 * App routes.
 */

require("./routes/home.js")(app);
require("./routes/chapter.js")(app);
require("./routes/collection.js")(app);
require("./routes/asset.js")(app);
require("./routes/payment.js")(app);
require("./routes/publish.js")(app);
require("./routes/user.js")(app);
require("./routes/admin.js")(app);
require("./routes/folder.js")(app);

/**
 * Error Handler.
 */

if (app.get("env") === "development") {
  // only use in development
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Server Error");
  });
}

/**
 * Start Express server.
 */
app.listen(app.get("port"), () => {
  console.log(
    "%s App is running at http://localhost:%d in %s mode",
    chalk.green("✓"),
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});

module.exports = app;
