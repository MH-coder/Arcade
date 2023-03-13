const { promisify } = require("util");
const crypto = require("crypto");
const path = require("path");
const nodemailer = require("nodemailer");
const { nodeMailerSES } = require("../services/aws.services");
const passport = require("passport");
const _ = require("lodash");
const validator = require("validator");
const mailChecker = require("mailchecker");
const { User, Publish } = require("../models");
const { Op } = require("sequelize");
const userService = require("../services/user");
const storageService = require("../services/storage");
const request = require("request");

const randomBytesAsync = promisify(crypto.randomBytes);

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("account/login", {
    title: "Login",
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  const validationErrors = [];

  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (validator.isEmpty(req.body.password))
    validationErrors.push({ msg: "Password cannot be blank." });

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/login");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("errors", info);
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect(req.session.returnTo || "/create");
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  req.session.destroy((err) => {
    if (err)
      console.log("Error : Failed to destroy the session during logout.", err);
    req.user = null;
    res.redirect("/");
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  // 6Lc3uIQcAAAAAC4tA4V-Pp3S827-MZMOcJXCwrk-
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (!validator.isLength(req.body.password, { min: 6 }))
    validationErrors.push({
      msg: "Password must be at least 6 characters long",
    });

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/login");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  userService
    .createUser({ email: req.body.email, password: req.body.password })
    .then(async (user, flash) => {
      if (!user) {
        req.flash("errors", {
          msg: "Account with that email address already exists.",
        })
        return res.redirect("/login")
      }
      req.flash("success", {
        msg: "Please check your email for verification link.",
      })
      registrationNotification(user)
      await sendVerificationLink(user)
      return res.redirect("/login")
    })
    .catch((err) => {
      return next(err)
    })
}

function registrationNotification(user) {
  let transporter = nodemailer.createTransport({
    SES: nodeMailerSES
  });
  const mailOptions = {
    to: "jennifer@arcade.studio",
    from: "jennifer@arcade.studio",
    subject: "User "+ user.email + " signed up",
    text: "User "+ user.email + " signed up",
  };

  transporter
    .sendMail(mailOptions)
    .catch((err) => {
      if (err.message === "self signed certificate in certificate chain") {
        console.log(
          "WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production."
        );
        transporter = nodemailer.createTransport({
          SES: nodeMailerSES,
          tls: {
            rejectUnauthorized: false,
          },
        });
        return transporter
          .sendMail(mailOptions)
          .catch((err) => {
            console.error("nodemailer", err)
          });
      }
      console.error("nodemailer", err)
    });
}

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  res.render("account/myprofile", {
    title: "Account Management",
  });
};

exports.deactivateAccount = async (req, res) => {
  req.user.isActive = false;
  await req.user.save();

  res.send({ status: "success" });
};

/**
 * GET /username
 * User Profile page.
 */
exports.getProfile = async (req, res, next) => {
  const username = req.params.username;
  const user = await User.findOne({
    where: { "profile.username": {[Op.iLike]:  username} },
  });
  if (user) {
    let portfolio = user.profile.portfolio;
    let publishes = await Publish.findAll({
      where: { userId: user.id, "portfolio.active": true },
      order: [["portfolio.order", "ASC"]],
      include: [User]
    });
    const result = [];
    publishes.map((p) => {
      result.push({
        title: p.portfolio.title,
        description: p.portfolio.description ? p.portfolio.description : '',
        slug: p.slug,
        thumbUrl: storageService.getUrl(p.thumbUrl),
        thumbnail: storageService.getUrl(p.thumbUrl),
        author: p.User.profile.username
      });
    });
    return res.render("account/profile", {
      title: "Profile",
      portfolio: {
        title: portfolio.title,
        subTitle: portfolio.subTitle,
        backgroundType: portfolio.backgroundType,
        backgroundUrl:
          portfolio.backgroundType == "app"
            ? portfolio.backgroundUrl
            : storageService.getUrl(portfolio.backgroundUrl),
        items: result,
      },
    });
  }
  next();
};
exports.updateUsername = async (req, res, next) => {
  try {
    const data = req.body;
    if (data["profile.username"]) {
      const count = await User.count({
        where: { "profile.username": {[Op.iLike]: data["profile.username"]} },
      });
      if (count > 0) {
        return res.send({ status: "error", msg: "username is already taken." });
      }
    }
    req.user.set(data);
    await req.user.save();
    return res.send({ status: "success" });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};
/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = async (req, res, next) => {
  try {
    const data = req.body;

    if (data["email"]) {
      const count = await User.count({ where: { email: data["email"] } });
      if (count > 0) {
        return res.send({ status: "error", msg: "email is already taken." });
      }
    }
    if (data["profile.username"]) {
      const count = await User.count({
        where: { "profile.username": {[Op.iLike]: data["profile.username"]} },
      });
      if (count > 0) {
        return res.send({ status: "error", msg: "username is already taken." });
      }
    }
    req.user.set(data);
    await req.user.save();
    return res.send({ status: "success" });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = async (req, res, next) => {
  const user = req.user;
  const currentPassword = req.body.currentPassword;
  const password = req.body.password;

  user.comparePassword(currentPassword, async (err, isMatch) => {
    if (err) {
      return res.send(err.message);
    }
    if (!isMatch) {
      return res.send({ msg: "Current password is incorrect." });
    }
    if (!validator.isLength(password, { min: 6 })) {
      return res.send({ msg: "Password must be at least 6 characters long" });
    }

    user.set("password", password);
    await user.save();

    return res.send({ msg: "Password has been changed." });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.deleteOne({ _id: req.User.id }, (err) => {
    if (err) {
      return next(err);
    }
    req.logout();
    req.flash("info", { msg: "Your account has been deleted." });
    res.redirect("/");
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const { provider } = req.params;
  User.findById(req.User.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user[provider.toLowerCase()] = undefined;
    const tokensWithoutProviderToUnlink = User.tokens.filter(
      (token) => token.kind !== provider.toLowerCase()
    );
    // Some auth providers do not provide an email address in the user profile.
    // As a result, we need to verify that unlinking the provider is safe by ensuring
    // that another login method exists.
    if (
      !(User.email && User.password) &&
      tokensWithoutProviderToUnlink.length === 0
    ) {
      req.flash("errors", {
        msg:
          `The ${_.startCase(
            _.toLower(provider)
          )} account cannot be unlinked without another form of login enabled.` +
          " Please link another account or add an email address and password.",
      });
      return res.redirect("/account");
    }
    User.tokens = tokensWithoutProviderToUnlink;
    User.save((err) => {
      if (err) {
        return next(err);
      }
      req.flash("info", {
        msg: `${_.startCase(_.toLower(provider))} account has been unlinked.`,
      });
      res.redirect("/account");
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  const validationErrors = [];
  if (!validator.isHexadecimal(req.params.token))
    validationErrors.push({ msg: "Invalid Token.  Please retry." });
  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/login");
  }

  const user = await User.findOne({
    where: {
      passwordResetToken: req.params.token,
      passwordResetExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!user) {
    req.flash("errors", {
      msg: "Password reset token is invalid or has expired.",
    });
    return res.redirect("/login");
  }

  res.render("account/reset", {
    title: "Password Reset",
  });
};

/**
 * GET /account/verify/:token
 * Verify email address
 */
exports.getVerifyEmailToken = (req, res, next) => {
  if (req.User.emailVerified) {
    req.flash("info", { msg: "The email address has been verified." });
    return res.redirect("/account");
  }

  const validationErrors = [];
  if (req.params.token && !validator.isHexadecimal(req.params.token))
    validationErrors.push({ msg: "Invalid Token.  Please retry." });
  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/account");
  }

  if (req.params.token === req.User.emailVerificationToken) {
    User.findOne({ email: req.User.email })
      .then((user) => {
        if (!user) {
          req.flash("errors", {
            msg: "There was an error in loading your profile.",
          });
          return res.redirect("back");
        }
        User.emailVerificationToken = "";
        User.emailVerified = true;
        user = User.save();
        req.flash("success", {
          msg: "Thank you for verifying your email address.",
        });
        return res.redirect("/account");
      })
      .catch((error) => {
        console.log(
          "Error saving the user profile to the database after email verification",
          error
        );
        req.flash("errors", {
          msg:
            "There was an error when updating your profile.  Please try again later.",
        });
        return res.redirect("/account");
      });
  } else {
    req.flash("errors", {
      msg: "The verification link was invalid, or is for a different account.",
    });
    return res.redirect("/account");
  }
};

exports.verifyEmail = async (req, res, next) => {
  const { userId, token } = req.params
  const user = await User.findByPk(userId)
  if (!user || user.emailVerified) {
    return res.redirect("/")
  }

  if (token && !validator.isHexadecimal(token)) return res.redirect("/")

  if (token === user.emailVerificationToken) {
    user.emailVerificationToken = ""
    user.emailVerified = true
    await user.save()

    // display success msg
    req.flash("errors", {
      msg: "Your email has been verified, please login.",
    })
    return res.redirect("/success")
  } else {
    return res.redirect("/")
  }
}

const sendVerificationLink = async (user) => {
  const token = await randomBytesAsync(16).then((buf) => buf.toString("hex"))

  user.emailVerificationToken = token
  await user.save()

  let transporter = nodemailer.createTransport({
    SES: nodeMailerSES
  })
  const mailOptions = {
    to: user.email,
    from: "support@arcade.studio",
    subject: "Verify your email with Arcade Studio",
    text: `Please click on the following link, or paste this into your browser to verify your email:\n\n
${process.env.BASE_URL}/account/verify/${user.id}/${token}\n\n
Thank you!\n`,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (err) {
    console.error(err)
  }
}


/**
 * GET /account/verify
 * Verify email address
 */
exports.getVerifyEmail = (req, res, next) => {
  if (req.User.emailVerified) {
    req.flash("info", { msg: "The email address has been verified." });
    return res.redirect("/account");
  }

  if (!mailChecker.isValid(req.User.email)) {
    req.flash("errors", {
      msg:
        "The email address is invalid or disposable and can not be verified.  Please update your email address and try again.",
    });
    return res.redirect("/account");
  }

  const createRandomToken = randomBytesAsync(16).then((buf) =>
    buf.toString("hex")
  );

  const setRandomToken = (token) => {
    User.findOne({ email: req.User.email }).then((user) => {
      User.emailVerificationToken = token;
      user = User.save();
    });
    return token;
  };

  const sendVerifyEmail = (token) => {
    let transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD,
      },
    });
    const mailOptions = {
      to: req.User.email,
      from: "hackathon@starter.com",
      subject: "Please verify your email address on Hackathon Starter",
      text: `Thank you for registering with hackathon-starter.\n\n
        This verify your email address please click on the following link, or paste this into your browser:\n\n
        http://arcade.studio/account/verify/${token}\n\n
        \n\n
        Thank you!`,
    };
    return transporter
      .sendMail(mailOptions)
      .then(() => {
        req.flash("info", {
          msg: `An e-mail has been sent to ${req.User.email} with further instructions.`,
        });
      })
      .catch((err) => {
        if (err.message === "self signed certificate in certificate chain") {
          console.log(
            "WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production."
          );
          transporter = nodemailer.createTransport({
            service: "SendGrid",
            auth: {
              user: process.env.SENDGRID_USER,
              pass: process.env.SENDGRID_PASSWORD,
            },
            tls: {
              rejectUnauthorized: false,
            },
          });
          return transporter.sendMail(mailOptions).then(() => {
            req.flash("info", {
              msg: `An e-mail has been sent to ${req.User.email} with further instructions.`,
            });
          });
        }
        console.log(
          "ERROR: Could not send verifyEmail email after security downgrade.\n",
          err
        );
        req.flash("errors", {
          msg:
            "Error sending the email verification message. Please try again shortly.",
        });
        return err;
      });
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendVerifyEmail)
    .then(() => res.redirect("/account"))
    .catch((...args) => {
      next(...args)
    })
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  const validationErrors = [];
  if (!validator.isLength(req.body.password, { min: 8 }))
    validationErrors.push({
      msg: "Password must be at least 8 characters long",
    });
  if (req.body.password !== req.body.confirm)
    validationErrors.push({ msg: "Passwords do not match" });
  if (!validator.isHexadecimal(req.params.token))
    validationErrors.push({ msg: "Invalid Token.  Please retry." });

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("back");
  }

  const resetPassword = () =>
    User.findOne({
      where: {
        passwordResetToken: req.params.token,
        passwordResetExpires: { [Op.gt]: Date.now() },
      },
    }).then((user) => {
      if (!user) {
        req.flash("errors", {
          msg: "Password reset token is invalid or has expired.",
        });
        return res.redirect("back");
      }
      user.set({
        password: req.body.password,
        passwordResetToken: null,
        passwordResetExpires: null,
      });
      return user.save().then(
        () =>
          new Promise((resolve, reject) => {
            req.logIn(user, (err) => {
              if (err) {
                return reject(err);
              }
              resolve(user);
            });
          })
      );
    });

  const sendResetPasswordEmail = (user) => {
    if (!user) {
      return;
    }
    let transporter = nodemailer.createTransport({
      SES: nodeMailerSES,
    });
    const mailOptions = {
      to: user.email,
      from: "support@arcade.studio",
      subject: "Your Arcade Studio password has been changed",
      text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`,
    };
    return transporter
      .sendMail(mailOptions)
      .then(() => {})
      .catch((err) => {
        if (err.message === "self signed certificate in certificate chain") {
          console.log(
            "WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production."
          );
          transporter = nodemailer.createTransport({
            SES: nodeMailerSES,
            tls: {
              rejectUnauthorized: false,
            },
          });
          return transporter.sendMail(mailOptions).then(() => {
            return;
          });
        }
        console.log(
          "ERROR: Could not send password reset confirmation email after security downgrade.\n",
          err
        );
        req.flash("warning", {
          msg:
            "Your password has been changed, however we were unable to send you a confirmation email. We will be looking into it shortly.",
        });
        return err;
      });
  };

  resetPassword()
    .then(sendResetPasswordEmail)
    .then(() => {
      if (!res.finished) res.redirect("/");
    })
    .catch((err) => next(err));
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.render("account/forgot", {
    title: "Forgot Password",
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = async (req, res, next) => {
  if (!validator.isEmail(req.body.email)) {
    return res.send({ msg: "Please enter a valid email address." });
  }
  const email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  const token = crypto.randomBytes(16).toString("hex");
  const user = await User.findOne({ where: { email: email } });
  if (!user) {
    return res.send({
      msg: "Account with that email address does not exist.",
    });
  }
  user.set({
    passwordResetToken: token,
    passwordResetExpires: Date.now() + 3600000,
  });
  await user.save();

  let transporter = nodemailer.createTransport({
    SES: nodeMailerSES,
  });
  const mailOptions = {
    to: user.email,
    from: "support@arcade.studio",
    subject: "Reset your password on Arcade Studio",
    text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      http://arcade.studio/reset/${token}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.send({
      msg: `An e-mail has been sent to ${user.email} with further instructions.`,
    });
  } catch (err) {
    if (err.message === "self signed certificate in certificate chain") {
      transporter = nodemailer.createTransport({
        SES: nodeMailerSES,
        tls: {
          rejectUnauthorized: false,
        },
      });
      try {
        await transporter.sendMail(mailOptions);
        return res.send({
          msg: `An e-mail has been sent to ${User.email} with further instructions.`,
        });
      } catch (err) {
        return res.send({
          msg:
            "Error sending the password reset message. Please try again shortly.",
        });
      }
    }
    return res.send({
      msg:
        "Error sending the password reset message. Please try again shortly.",
    });
  }
};

exports.postPortfolioThumbnail = async (req, res) => {
  try {
    const uid = req.user.id;
    const thumbnail = req.file;
    const ext = path.extname(thumbnail.originalname);
    const url = `projects/${uid}/portfolio${ext}`;

    req.user.set("profile.portfolio.backgroundUrl", url);
    req.user.set("profile.portfolio.backgroundType", req.body.type);
    await req.user.save();

    return res.send({
      status: "success",
      url: storageService.getUrl(url),
    });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};
