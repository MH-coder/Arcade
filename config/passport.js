const passport = require("passport");
const refresh = require("passport-oauth2-refresh");
const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: FacebookStrategy } = require("passport-facebook");
const { Strategy: TwitterStrategy } = require("passport-twitter");
const { OAuth2Strategy: GoogleStrategy } = require("passport-google-oauth");
const _ = require("lodash");
const moment = require("moment");

const { User, Publish, Project, Payment } = require("../models");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findOne({
    where: { id }
  })
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

/**
 * Sign in using Email and Password.
 */
passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    User.findOne({
      where: { email: email.toLowerCase() },
      include: [
        { model: Publish },
        { model: Project },
        { model: Payment },
      ],
      order: [[
        {model: Payment}, 'id', 'ASC'
      ]],
    })
      .then((user) => {
        if (!user) {
          return done(null, false, { msg: `Email ${email} not found.` });
        }
        if (!user.password) {
          return done(null, false, {
            msg:
              "Your account was registered using a sign-in provider. To enable password login, sign in using a provider, and then set a password under your user profile.",
          });
        }
        if (!user.emailVerified) {
          return done(null, false, {
            msg:
              "Please check your inbox to verify your email address",
			});
		}
        
        if (!user.isActive) {
          return done(null, false, {
            msg:
              "Your account is Deactivated. Please contact our support to Re-activate your account",
          });
        }
        user.comparePassword(password, (err, isMatch) => {
          if (err) {
            return done(err);
          }
          if (isMatch) {
            return done(null, user);
          }
          return done(null, false, { msg: "Invalid email or password." });
        });
      })
      .catch((err) => {
        return done(err);
      });
  })
);

/**
 * Sign in with Facebook.
 */
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/facebook/callback`,
      profileFields: ["name", "email", "link", "locale", "timezone", "gender"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      if (req.user) {
        try {
          const existingUser = await User.findOne({
            where: { facebookId: profile.id },
          });
          if (existingUser) {
            req.flash("errors", {
              msg:
                "There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.",
            });
            done(null);
          } else {
            const user = await User.findOne({ where: { id: req.user.id } });
            let tokens = _.cloneDeep(user.tokens);
            tokens.push({ kind: "facebook", accessToken });
            user.set("facebookId", profile.id);
            user.set("tokens", tokens);
            await user.save();

            req.flash("info", { msg: "Facebook account has been linked." });
            done(null, user);
          }
        } catch (err) {
          done(err);
        }
      } else {
        try {
          const existingUser = await User.findOne({
            where: { facebookId: profile.id },
          });
          if (existingUser) {
            return done(null, existingUser);
          }
          const existingEmailUser = await User.findOne({
            where: { email: profile._json.email },
          });
          if (existingEmailUser) {
            req.flash("errors", {
              msg:
                "There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.",
            });
            done(null);
          } else {
            const user = await User.create({
              email: profile._json.email,
              facebookId: profile.id,
            });
            await user.save();
            const tokens = _.cloneDeep(user.tokens);
            tokens.push({ kind: "facebook", accessToken });
            user.set("tokens", tokens);
            await user.save();
            done(null, user);
          }
        } catch (err) {
          done(err);
        }
      }
    }
  )
);

/**
 * Sign in with Twitter.
 */
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/twitter/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, tokenSecret, profile, done) => {
      if (req.user) {
        try {
          const existingUser = await User.findOne({
            where: { twitterId: profile.id },
          });
          if (existingUser) {
            req.flash("errors", {
              msg:
                "There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.",
            });
            done(null);
          } else {
            const user = await User.findOne({
              where: { id: req.user.id },
            });
            let tokens = _.cloneDeep(user.tokens);
            tokens.push({ kind: "twitter", accessToken, tokenSecret });
            user.set("twitterId", profile.id);
            user.set("tokens", tokens);
            await user.save();
            req.flash("info", { msg: "Twitter account has been linked." });
            done(null, user);
          }
        } catch (err) {
          done(err);
        }
      } else {
        try {
          const existingUser = await User.findOne({
            where: { twitterId: profile.id },
          });
          if (existingUser) {
            return done(null, existingUser);
          }
          // Twitter will not provide an email address.  Period.
          // But a person’s twitter username is guaranteed to be unique
          // so we can "fake" a twitter email address as follows:
          const user = await User.create({
            email: `${profile.username}@twitter.com`,
            twitterId: profile.id,
          });
          await user.save();
          let tokens = _.cloneDeep(user.tokens);
          tokens.push({ kind: "twitter", accessToken, tokenSecret });
          user.set("tokens", tokens);
          await project.save();
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    }
  )
);

/**
 * Sign in with Google.
 */
const googleStrategyConfig = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, params, profile, done) => {
    if (req.user) {
      try {
        const existingUser = await User.findOne({
          where: { googleId: profile.id },
        });
        if (existingUser && existingUser.id !== req.user.id) {
          req.flash("errors", {
            msg:
              "There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.",
          });
          done(null);
        } else {
          const user = await User.findOne({ where: { id: req.user.id } });
          const tokens = _.cloneDeep(user.tokens);
          tokens.push({
            kind: "google",
            accessToken,
            accessTokenExpires: moment()
              .add(params.expires_in, "seconds")
              .format(),
            refreshToken,
          });
          user.set("googleId", profile.id);
          user.set("tokens", tokens);
          await user.save();
          req.flash("info", { msg: "Google account has been linked." });
          done(null, user);
        }
      } catch (err) {
        done(err);
      }
    } else {
      try {
        const existingUser = await User.findOne({
          where: { googleId: profile.id },
        });
        if (existingUser) {
          return done(null, existingUser);
        }
        const existingEmailUser = await User.findOne({
          where: { email: profile.emails[0].value },
        });
        if (existingEmailUser) {
          req.flash("errors", {
            msg:
              "There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.",
          });
          done(null);
        } else {
          const user = await User.create({
            email: profile.emails[0].value,
            googleId: profile.id,
          });
          await user.save();
          const tokens = _.cloneDeep(user.tokens);
          tokens.push({
            kind: "google",
            accessToken,
            accessTokenExpires: moment()
              .add(params.expires_in, "seconds")
              .format(),
            refreshToken,
          });
          user.set("tokens", tokens);
          await user.save();
          done(null, user);
        }
      } catch (err) {
        done(err);
      }
    }
  }
);
passport.use("google", googleStrategyConfig);
refresh.use("google", googleStrategyConfig);

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split("/")[2];
  const token = req.user.tokens.find((token) => token.kind === provider);
  if (token) {
    // Is there an access token expiration and access token expired?
    // Yes: Is there a refresh token?
    //     Yes: Does it have expiration and if so is it expired?
    //       Yes, Quickbooks - We got nothing, redirect to res.redirect(`/auth/${provider}`);
    //       No, Quickbooks and Google- refresh token and save, and then go to next();
    //    No:  Treat it like we got nothing, redirect to res.redirect(`/auth/${provider}`);
    // No: we are good, go to next():
    if (
      token.accessTokenExpires &&
      moment(token.accessTokenExpires).isBefore(moment().subtract(1, "minutes"))
    ) {
      if (token.refreshToken) {
        if (
          token.refreshTokenExpires &&
          moment(token.refreshTokenExpires).isBefore(
            moment().subtract(1, "minutes")
          )
        ) {
          res.redirect(`/auth/${provider}`);
        } else {
          refresh.requestNewAccessToken(
            `${provider}`,
            token.refreshToken,
            (err, accessToken, refreshToken, params) => {
              User.findById(req.user.id, (err, user) => {
                user.tokens.some((tokenObject) => {
                  if (tokenObject.kind === provider) {
                    tokenObject.accessToken = accessToken;
                    if (params.expires_in)
                      tokenObject.accessTokenExpires = moment()
                        .add(params.expires_in, "seconds")
                        .format();
                    return true;
                  }
                  return false;
                });
                req.user = user;
                user.markModified("tokens");
                user.save((err) => {
                  if (err) console.log(err);
                  next();
                });
              });
            }
          );
        }
      } else {
        res.redirect(`/auth/${provider}`);
      }
    } else {
      next();
    }
  } else {
    res.redirect(`/auth/${provider}`);
  }
};

exports.isInRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const hasRole = roles.find((role) => req.user.profile.role === role);
  if (!hasRole) {
    return res.redirect("/login");
  }

  return next();
};
