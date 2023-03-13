const nodemailer = require("nodemailer");
const {
  Sample,
  Collection,
  Chapter,
  Transaction,
  Payment,
  User,
  Card,
  Publish,
  Project,
} = require("../models")
const storageService = require("../services/storage.js")
const roles = require("../config/roles.js")
const stripeConfig = require("../config/stripe")
const addonsConfig = require("../config/addons")
const moment = require("moment")
const { Op } = require("sequelize")
const stripeService = require("../services/stripe.service")

exports.index = async (req, res) => {
  let samples = []
  try {
    const dbSamples = await Sample.findAll({
      order: [["order", "ASC"]],
      raw: true,
    })
    dbSamples.forEach((sample) => {
      samples.push({ ...sample, slug: `/${sample.author}${sample.slug}` })
    })
  } catch (err) {
    samples = []
  }
  res.render("home", {
    title: "Explore",
    samples,
  })
}

exports.learn = async (req, res) => {
  let collections = []
  try {
    collections = await Collection.findAll({
      order: [
        ["order", "ASC"],
        [Chapter, "order", "ASC"],
      ],
      include: [{ model: Chapter }],
    })
  } catch (err) {
    console.log(err)
  }

  res.render(!req.user || req.user.profile.role == roles.User ? "learn_user" : "learn_admin", {
    title: "Learn",
    collections,
  })
}

exports.create = async (req, res) => {
  const { backgroundType, backgroundUrl } = req.user.profile.portfolio
  const user = await User.findOne({
    where: { id: req.user.id },
    include: [{ model: Publish }, { model: Project }, { model: Payment }],
    order: [[{ model: Payment }, "id", "DESC"]],
  })
  const cards = await Card.findAll();
    const subscriptionData = {}
  if (req.user.stripeCustomerId) {
    const stCustomer = await stripeService.getCustomer(req.user.stripeCustomerId);
    if(user.dataValues.Payments && cards){
      user.dataValues.Payments.forEach((p) => {
        const card = cards.find((c) => {
          return c.dataValues.id === p.dataValues.paymentableId}
        );
        if(card && card.dataValues.paymentMethodId === stCustomer.invoice_settings.default_payment_method){
          p.dataValues.isDefault = true;
        } else 
          p.dataValues.isDefault = false;
      });
    }
    const subscription = await stripeService.querySubscription(
      {
        customer: req.user.stripeCustomerId,
        status: "active",
        limit: 1,
      },
      ["data.latest_invoice"]
    )
    if (subscription) {
      let price = subscription.plan.amount / 100
      if (
        subscription.discount &&
        subscription.discount.coupon &&
        subscription.discount.coupon.valid
      ) {
        price = price - price * (subscription.discount.coupon.percent_off / 100)
      }
      subscriptionData["currentPeriodEnd"] = moment
        .unix(subscription.current_period_end)
        .format("MM-DD-YYYY")
        .toString()
      subscriptionData["currentPeriodEndMonth"] = moment
        .unix(subscription.current_period_end)
        .format("DD")
        .toString()
      subscriptionData["cancelAtPeriodEnd"] = subscription.cancel_at_period_end
      subscriptionData["paymentTitle"] = subscription.metadata.paymentTitle
      subscriptionData["paymentId"] = subscription.metadata.paymentId
      subscriptionData["price"] = price
      subscriptionData["planType"] = "monthly"
      subscriptionData["status"] = subscription.status
      subscriptionData["canceledAt"] = subscription.canceled_at
      subscriptionData["cancelAt"] = subscription.cancel_at
        ? moment.unix(subscription.cancel_at).format("MM-DD-YYYY").toString()
        : null
      subscriptionData["paymentMethodId"] = subscription.metadata.paymentId * 1
      subscriptionData["subscriptionId"] = subscription.id
    } else {
      const latestInvoice = await stripeService.getLatestInvoice(req.user.stripeCustomerId)
      if (latestInvoice && latestInvoice.metadata.planType === "lifetime") {
        subscriptionData["paymentTitle"] = latestInvoice.metadata.paymentTitle
        subscriptionData["paymentId"] = latestInvoice.metadata.paymentId
        subscriptionData["planType"] = "lifetime"
        subscriptionData["price"] = latestInvoice.amount_paid / 100
      }
    }
  }
  // Transactions
  let transactions = await Transaction.findAll({
    where: { userId: req.user.id },
    attributes: ["title", "cost", "minusPlus", "paymentTitle", "date"],
  })
  res.render("create", {
    title: "Create",
    user,
    transactions: transactions,
    subscriptionData,
    backgroundType,
    backgroundUrl: backgroundType == "app" ? backgroundUrl : storageService.getUrl(backgroundUrl),
  })
}

exports.contact = (req, res) => {
  let transporter = nodemailer.createTransport({
    SES: new aws.SES({
      apiVersion: "2010-12-01",
      region: "us-east-2",
    }),
  })
  let name = "Job inquiry for arcade.studio"
  if (req.body.type == "contact") {
    name = "contact from arcade.studio"
  }

  const mailOptions = {
    to: "martin@arcade.studio",
    //to: "mikhnenko@gmail.com",
    from: name + " <martin@arcade.studio>",
    //from: req.body.name + " <" + req.body.email + ">",
    replyTo: req.body.name + " <" + req.body.email + ">",
    subject: req.body.type,
    text: "from:" + req.body.name + " <" + req.body.email + ">" + "\n" + req.body.message,
  }

  transporter
    .sendMail(mailOptions)
    .then(() => {
      res.status(200).send()
    })
    .catch((err) => {
      console.log(err)
      if (err.message === "self signed certificate in certificate chain") {
        console.log(
          "WARNING: Self signed certificate in certificate chain. Retrying with the self signed certificate. Use a valid certificate if in production."
        )
        transporter = nodemailer.createTransport({
          SES: new aws.SES({
            apiVersion: "2010-12-01",
            region: "us-east-2",
          }),
          tls: {
            rejectUnauthorized: false,
          },
        })
        return transporter
          .sendMail(mailOptions)
          .then(() => {
            return res.status(200).send()
          })
          .catch((err) => {
            return res.status(400).send()
          })
      }
      console.log(
        "ERROR: Could not send password reset confirmation email after security downgrade.\n",
        err
      )
      req.flash("warning", {
        msg: "Your password has been changed, however we were unable to send you a confirmation email. We will be looking into it shortly.",
      })
      return res.status(400).send()
    })
}
