"use strict"

const { Payment, Transaction, Card, User } = require("../models")
const stripe = require("stripe")(process.env.STRIPE_SKEY)
const stripeService = require("../services/stripe.service")
const addonsConfig = require("../config/addons")
const stripeConfig = require("../config/stripe")
const querystring = require("querystring")
const moment = require("moment")
const { Op } = require("sequelize")
const storageService = require("../services/storage.js")

exports.updateSubscritpionPaymentMethod = async function (req, res) {
  const paymentableId = req.body.id
  const subscriptionId = req.body.subId
  const pid = req.body.id

  const card = await Card.findOne({
    where: {
      id: paymentableId,
    },
  })

  const payment = await Payment.findOne({
    where: {
      id: pid,
    },
    include: [Card],
  })

  if(subscriptionId) {
    await stripeService.updateSubscription(subscriptionId, {
      default_payment_method: card.dataValues.paymentMethodId,
      metadata: {
        paymentId: pid,
        paymentTitle: payment.dataValues.title,
      },
    });
  }
  await stripeService.updateCustomer(req.user.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: card.dataValues.paymentMethodId,
    },
  })

  res.status(200).send("ok")
}

exports.getPatmentDetails = async function (req, res) {
  const paymentableId = req.body.id
  const subscriptionId = req.body.subId
  const pid = req.body.id

  // const card = await Card.findOne({
  //   where: {
  //     id: paymentableId,
  //   },
  // })

  // console.log(card)

  const payment = await Payment.findOne({
    where: {
      id: pid,
    },
    include: [Card],
  })

  // await stripeService.updateSubscription(subscriptionId, {
  //   default_payment_method: card.dataValues.paymentMethodId,
  //   metadata: {
  //     paymentId: pid,
  //     paymentTitle: payment.dataValues.title,
  //   },
  // })

  res.status(200).send("ok")
}

exports.checkCouponCodeOnStripe = async (req, res) => {
  try {
    const { code: reqCode, planType } = req.body
    let valid = false,
      off = null,
      offType = null

    const promoCode = await stripeService.findPromotionCode(reqCode)
    if (promoCode) {
      const promoPlanType = promoCode.metadata.paymentType

      console.log({ promoCode, promoPlanType })
      if (
        promoPlanType == planType &&
        promoCode.coupon.applies_to &&
        promoCode.coupon.applies_to.products &&
        promoCode.coupon.applies_to.products.includes(stripeConfig.products.PRO_MEMBERSHIP) &&
        !!promoCode.max_redemptions &&
        promoCode.times_redeemed < promoCode.max_redemptions
      ) {
        valid = true
      }

      if (valid) {
        if (!!promoCode.coupon.amount_off) {
          off = promoCode.coupon.amount_off / 100
          offType = "fixed"
        } else {
          off = promoCode.coupon.percent_off
          offType = "percent"
        }
      }
    }
    return res.send({
      valid,
      off,
      offType,
      message: valid ? "Promo Code Applied" : "Invalid Code. Try again.",
    })
  } catch (error) {
    console.error(error)
    return res.send({ valid: false, message: "Invalid Code. Try again." })
  }
}

exports.stripeSavePaymentMethod = async (req, res) => {
  try {
    const { user } = req
    const { paymentMethodId } = req.body
    if (user.stripeCustomerId && paymentMethodId) {
      const paymentMethods = await stripeService.getPaymentMethods(user.stripeCustomerId);
      const paymentMethod = paymentMethods.find((p) => p.id === paymentMethodId);
      if(paymentMethods.length === 1){
        await stripeService.updateCustomer(user.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        })
      }

      const userCard = await Card.create({
        paymentMethodId: paymentMethodId,
        last4: paymentMethod.card.last4,
        month: paymentMethod.card.exp_month,
        year: paymentMethod.card.exp_year,
      })

      const cardTitle = paymentMethod.card.brand + " " + paymentMethod.card.last4
      const payment = await Payment.create({
        title: cardTitle,
        userId: user.id,
        paymentableId: userCard.id,
        paymentableType: "card",
      })
      const subscription = await stripeService.querySubscription({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1
      });
      // var paymentableId = userCard.dataValues.id
      var { id, paymentableId } = payment.dataValues

      return res.json({
        paymentId: id,
        paymentableId,
        title: cardTitle,
        paymentMethodsLength: paymentMethods.length,
        subId: !!subscription ? subscription.id : null
      })
    } else return res.status(400).send()
  } catch (e) {
    console.log(e)
    return res.status(200)
  }
}

exports.getStripeKey = (req, res) => {
  debugger
  res.send({ publicKey: process.env.STRIPE_PKEY })
}

exports.postStripeCreateCustomer = async (req, res) => {
  const customer = await stripeService.createCustomer(req.user)
  if (!customer) {
    res.status(400).send({ message: "Declined" })
  }

  res.json({ customerId: customer.id })
}

exports.getStripePaymentIntent = async (req, res) => {
  // debugger;
  const user = req.user
  let customer = null
  if (!user.stripeCustomerId) {
    customer = await stripeService.createCustomer(user)
  } else customer = await stripeService.getCustomer(user.stripeCustomerId)

  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ["card", "ideal"],
  })
  // console.log({ s: setupIntent.client_secret });
  return res.send({ client_secret: setupIntent.client_secret })
}

exports.postStripeWebhook = async (req, res) => {
  let event
  let signature = req.headers["stripe-signature"]

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.log(`Webhook signature verification failed.`)
    console.error({ err })
    return res.sendStatus(400)
  }

  try {
    const dataObject = event.data.object
    const user = await User.findOne({
      where: { stripeCustomerId: dataObject.customer },
    })

    if (user) {
      console.log(event.type)
      switch (event.type) {
        case "invoice.payment_succeeded":
          let subscription = null
          let pId = dataObject.metadata?.paymentId
          let price = await stripeService.getPrice(stripeConfig.prices.LIFETIME_PRO_MEMBERSHIP)
          if (dataObject.subscription) {
            price = await stripeService.getPrice(stripeConfig.prices.MONTHLY_PRO_MEMBERSHIP)
            subscription = await stripeService.getSubscription(dataObject.subscription)
            pId = subscription.metadata.paymentId
          }
          const payment = await Payment.findOne({ where: { id: pId } })
          const paymentTitle = payment.title
          await Transaction.create({
            paymentId: payment.id,
            title: price.product.name,
            cost: dataObject.amount_paid / 100,
            minusPlus: "-",
            cycle: price.recurring ? price.recurring.interval : price.recurring,
            paymentTitle,
            userId: user.id,
            subscriptionId: dataObject.subscription ? subscription.id : "",
            date: moment().format("YYYY-MM-DD"),
          })

          break
        /*  case "customer.subscription.updated":
           const {default_payment_method, metadata} = event.data.previous_attributes;
           // if user has updated the card for Powerup Subscription & the last invoice is not paid
           if(default_payment_method && metadata.paymentId && dataObject.latest_invoice){
             const invoice = await stripeService.getInvoice(dataObject.latest_invoice);
             if(invoice && invoice.status !== 'paid')
               await stripe.invoices.pay(dataObject.latest_invoice);
           }
           break; */
      }
    }
  } catch (error) {
    console.error(error)
    return res.sendStatus(500)
  }
  res.sendStatus(200)
}

exports.deletePayment = async (req, res) => {
  let id = parseInt(req.body.id)
  let payment = await Payment.findOne({
    where: {
      id: id,
      userId: req.user.id,
    },
  })
  if (payment) {
    const card = await Card.findOne({
      where: {
        id: payment.dataValues.paymentableId,
      },
    })
    const subscriptions = await stripeService.querySubscription({
      customer: req.user.stripeCustomerId,
    })
    const subscription = subscriptions.find(
      (s) => s.default_payment_method === card.dataValues.paymentMethodId
    )
    if (!subscription) {
      await stripeService.detachPaymentMethod(card.dataValues.paymentMethodId)
      await card.destroy()
      await payment.destroy()

      return res.sendStatus(204)
    }
  }

  res.sendStatus(400)
}

exports.updatePowerupPaymentMethod = async (req, res) => {
  try {
    debugger
    const { user } = req
    const { paymentId, powerupId } = req.body
    const payment = await Payment.findOne({
      where: {
        id: paymentId,
        userId: user.id,
      },
      include: [Card],
    })
    const card = await payment.getPaymentable()
    const price = await stripeService.getPrice(stripeConfig["prices"][addonsConfig[powerupId]])
    const subscription = await stripeService.querySubscription({
      customer: user.stripeCustomerId,
      price: stripeConfig["prices"][addonsConfig[powerupId]],
      limit: 1,
    })
    if (
      ["past_due", "unpaid", "incomplete"].includes(subscription.status) &&
      subscription.latest_invoice
    ) {
      const invoice = await stripeService.getInvoice(subscription.latest_invoice)
      if (invoice && invoice.status === "open") {
        try {
          const paidInvoice = await stripe.invoices.pay(subscription.latest_invoice, {
            payment_method: card.paymentMethodId, // Tries charging the new payment method selected by user (marks it default on subscription later)
          })
          if (!paidInvoice || paidInvoice.status !== "paid")
            return res.status(400).send({ error: { message: "Invoice Failed" } })
        } catch (error) {
          console.error(error)
          return res.status(400).send({ error: { message: "Invoice Failed" } })
        }
      }
    }
    console.log({ payment })
    await stripeService.updateSubscription(subscription.id, {
      default_payment_method: card.paymentMethodId,
      metadata: { paymentId: paymentId },
    })

    const userPowerUp = {
      powerupId,
      paymentId,
      paymentMethodId: subscription.default_payment_method,
      userId: user.id,
      refundId: "",
      expireDate: moment.unix(subscription.current_period_end).format("YYYY-MM-DD").toString(),
      extraData: { cancelAtPeriodEnd: subscription.cancel_at_period_end },
      subscriptionStatus: subscription.status,
    }

    const powerup = {
      id: powerupId,
      title: price.product.name,
      description: price.product.description,
      cost: price.unit_amount / 100,
      cycle: price.recurring.interval,
      stripePriceId: price.id,
    }
    const temp = Object.assign({ powerup, payment }, userPowerUp)
    console.log({ temp })
    return res.json({ userPowerup: temp })
  } catch (error) {
    console.error(error)
    res.status(500).send()
  }
}

exports.postPowerupByStripe = async (req, res) => {
  try {
    debugger
    console.log("postPowerupByStripe")
    const paymentId = parseInt(req.body.paymentId)
    const powerupId = req.body.powerupId
    console.log({ paymentId, powerupId })
    const payment = await Payment.findOne({
      where: {
        id: paymentId,
        userId: req.user.id,
      },
      include: [Card],
    })

    if (payment) {
      const card = await payment.getPaymentable()
      const price = await stripeService.getPrice(stripeConfig["prices"][addonsConfig[powerupId]])
      const powerup = {
        id: addonsConfig[powerupId],
        title: price.product.name,
        description: price.product.description,
        cost: price.unit_amount / 100,
        cycle: price.recurring.interval,
        stripePriceId: price.id,
      }

      const paymentMethodId = card.paymentMethodId
      const stripePriceId = powerup.stripePriceId

      await stripeService.updateCustomer(req.user.stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      })

      const subscriptionData = {
        customer: req.user.stripeCustomerId,
        items: [{ price: stripePriceId }],
        default_payment_method: paymentMethodId,
        expand: ["latest_invoice.payment_intent"],
        metadata: { userId: req.user.id, powerupId: powerup.id, paymentId },
      }
      const promoCode = await stripeService.findPromotionCode(req.body.code)
      if (promoCode) subscriptionData.promotion_code = promoCode.id

      const subscription = await stripeService.createSubscription(subscriptionData)
      const invoice = subscription.latest_invoice

      let userPowerup = {
        powerupId: powerup.id,
        paymentId,
        userId: req.user.id,
        refundId: "",
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        expireDate: moment.unix(subscription.current_period_end).format("YYYY-MM-DD").toString(),
        extraData: subscription,
      }

      userPowerup = Object.assign({ powerup, payment }, userPowerup)

      if (invoice && invoice.payment_intent && invoice.payment_intent.status === "succeeded") {
        // actual entry will be on invoice.payment_success
        // following is bcoz of FE dependency - adds new transation row under Transactions tab
        const transaction = {
          powerupId: powerup.id,
          paymentId,
          title: powerup.title,
          cost: invoice.amount_paid / 100,
          minusPlus: "-",
          cycle: powerup.cycle,
          paymentTitle: payment.title,
          userId: req.user.id,
          subscriptionId: subscription.id,
          date: moment().format("YYYY-MM-DD"),
        }

        return res.send({ transaction, userPowerup })
      }

      return res.status(400).send({ userPowerup, error: { message: "Payment Intent failed" } })
    } else return res.status(400).send({ error: { message: `Payment Method doesn't exist` } })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ error: { message: error.message } })
  }
}

exports.stripePowerupSubscriptionUpdate = async (req, res) => {
  try {
    const subscription = await stripeService.querySubscription({
      customer: req.user.stripeCustomerId,
      limit: 1,
    })

    if (subscription) {
      console.log({ sId: subscription.id, status: subscription.status })
      await stripeService.updateSubscription(subscription.id, {
        cancel_at_period_end: !subscription.cancel_at_period_end,
      })
      return res.send({ cancelled: !subscription.cancel_at_period_end })
    }
    return res.status(400).send()
  } catch (error) {
    console.error(error)
    res.sendStatus(500)
  }
}

exports.getViewTransaction = async (req, res) => {
  try {
    let where = {
      userId: req.user.id,
    }

    let id = parseInt(req.query.id)
    if (id != 0) {
      where.paymentId = id
    }
    const transactions = await Transaction.findAll({
      where: where,
      order: [["createdAt", "DESC"]],
    })

    return res.send({ transactions: transactions })
  } catch (error) {
    console.error(error)
    return res.send({ transactions: [] })
  }
}

exports.upgradeToProMembership = async (req, res) => {
  try {
    const paymentId = parseInt(req.body.paymentId)
    const planType = req.body.planType
    const pCode = req.body.code
    const subId = req.body.subId
    const sub = await stripeService.getSubscription(subId)

    const payment = await Payment.findOne({
      where: {
        id: paymentId,
        userId: req.user.id,
      },
      include: [Card],
    })
    const card = await payment.getPaymentable()
    const paymentMethodId = card.paymentMethodId

    const promoCode = await stripeService.findPromotionCode(pCode)
    if (sub && planType === "monthly" && sub.cancel_at_period_end) {
      const subData = {
        cancel_at_period_end: false,
      }
      if (promoCode) subData.promotion_code = promoCode.id
      await stripeService.updateSubscription(subId, subData)

      return res.send({ transaction: {} })
    } else if (sub && planType === "lifetime" && sub.cancel_at_period_end) {
      await stripeService.deleteSubscription(subId)
    }

    await stripeService.updateCustomer(req.user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    if (payment) {
      let invoice = null
      let stripePriceId = stripeConfig["prices"].MONTHLY_PRO_MEMBERSHIP
      // console.log({ stripePriceId, pCode });
      const metadata = {
        stripePriceId,
        userId: req.user.id,
        paymentId,
        paymentTitle: payment.dataValues.title,
        planType,
      }
      if (planType === "monthly") {
        const subscriptionData = {
          customer: req.user.stripeCustomerId,
          items: [{ price: stripePriceId }],
          default_payment_method: paymentMethodId,
          expand: ["latest_invoice.payment_intent"],
          metadata,
        }

        if (promoCode) subscriptionData.promotion_code = promoCode.id

        const subscription = await stripeService.createSubscription(subscriptionData)
        invoice = subscription.latest_invoice
      } else {
        stripePriceId = stripeConfig["prices"].LIFETIME_PRO_MEMBERSHIP

        const invoiceData = {
          customer: req.user.stripeCustomerId,
          metadata,
        }
        const invoiceItem = await stripe.invoiceItems.create({
          ...invoiceData,
          price: stripePriceId,
        })
        invoice = await stripe.invoices.create({
          ...invoiceData,
          auto_advance: true,
          discounts: promoCode ? [{ coupon: promoCode.coupon.id }] : [],
        })
        invoice = await stripe.invoices.pay(invoice.id, { expand: ["payment_intent"] })

        console.log({ invoiceItem })
      }
      console.log({ invoice })
      if (
        (invoice && invoice.payment_intent && invoice.payment_intent.status === "succeeded") ||
        (invoice && invoice.status === "paid")
      ) {
        const price = await stripeService.getPrice(stripePriceId)
        return res.send({
          transaction: {
            title: price.product.name,
            paymentTitle: payment.title,
            cost: invoice.amount_paid / 100,
            date: moment().format("YYYY-MM-DD"),
          },
        })
      }
      return res.status(400).send({ error: { message: "Payment Intent failed" } })
    } else return res.status(400).send({ error: { message: `Payment Method doesn't exist` } })
  } catch (error) {
    console.error(error)
    return res.status(500).send({ error: { message: error.message } })
  }
}

exports.deletePrevSubAndApplyNew = async (req, res) => {
  const subId = req.body.subId

  const sub = await stripeService.getSubscription(subId)

  if (sub.cancel_at_period_end) {
    const deleted = await stripeService.deleteSubscription(subId)

    if (deleted) {
    }

    const subReactivated = await stripeService.updateSubscription(subId, {
      cancel_at_period_end: false,
    })
    console.log("Sub cancel_at_period_end reactivated========", subReactivated)
  }
}
