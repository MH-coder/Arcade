"use strict";

const { Paypal, Payment, Powerup, PaymentPowerups, Transaction } = require("../models");
const stripe = require("stripe")(process.env.STRIPE_SKEY);
const paypal = require("paypal-rest-sdk");
const paypalApi = require("paypal-rest-sdk/lib/api");
const { Coupon } = require("../models");
const axios = require('axios');
const querystring = require('querystring');
const moment = require("moment");
const { Op } = require("sequelize")
const storageService = require("../services/storage.js");

var paypalConfig = {
  mode: "sandbox",
  client_id: process.env.PAYPAL_ID,
  client_secret: process.env.PAYPAL_SECRET,
};

paypal.configure(paypalConfig);

const checkCouponCode = async function (code) {
  const coupon = await Coupon.findOne({ where: { code: code } });
  if (coupon) {
    if (coupon.active) {
      return { valid: true, price: coupon.price };
    } else {
      return { valid: false, message: "Code has already been used." };
    }
  }
  return { valid: false, message: "Invalid code. Try again." };
};

const stripeCreateCustomerAndSubscription = async (
  user,
  payment_method,
  coupon_code
) => {
  const membership = user.profile.membership;
  let customer;

  if (membership.stripe) {
    const paymentMethod = await stripe.paymentMethods.attach(payment_method, {
      customer: membership.stripe.customerId,
    });
    await stripe.customers.update(membership.stripe.customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });
    customer = await stripe.customers.retrieve(membership.stripe.customerId);
  } else {
    customer = await stripe.customers.create({
      payment_method: payment_method,
      email: user.email,
      invoice_settings: {
        default_payment_method: payment_method,
      },
    });
  }

  let planId = process.env.STRIPE_DEFAULT_PLAN_ID;
  if (coupon_code) {
    const coupon = await checkCouponCode(coupon_code);
    if (coupon.valid) {
      planId =
        coupon.price == 14
          ? process.env.STRIPE_COUPON1_PLAN_ID
          : process.env.STRIPE_COUPON2_PLAN_ID;
    }
  }

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ plan: planId }],
    expand: ["latest_invoice.payment_intent"],
  });

  const paymentMethod = await stripe.paymentMethods.retrieve(payment_method);

  user.set("profile.membership.active", true);
  user.set("profile.membership.stripe", {
    customerId: customer.id,
    subscriptionId: subscription.id,
    paymentMethod: payment_method,
    last4: paymentMethod.card.last4,
  });
  await user.save();

  return subscription;
};

const stripeCancelSubscription = async (user) => {
  const membership = user.profile.membership;
  const customerId = membership.stripe.customerId;
  let subscription = await stripe.subscriptions.del(
    membership.stripe.subscriptionId
  );
  user.set("profile.membership.stripe", {
    customerId: customerId,
  });
  await user.save();

  return subscription;
};

const paypalCancelSubscription = async (user) => {
  const membership = user.profile.membership;
  const subscriptionId = membership.paypal.subscriptionId;
  const cancel_note = {
    note: "Canceling the agreement",
  };
  return new Promise((resolve, reject) => {
    var baseURL = "https://api-m.sandbox.paypal.com/v1/billing/subscriptions/"
    paypalApi.executeHttp('POST', baseURL + subscriptionId + '/cancel', {}, paypalConfig, async function (
      error,
      response
    ) {
      if (error) {
        console.error(error);
        reject(error);
      }

      user.set("profile.membership.paypal", null);
      await user.save();
      resolve(response);
    });
  });
};

exports.getStripeKey = (req, res) => {
  res.send({ publicKey: process.env.STRIPE_PKEY });
};

exports.postStripeCreateCustomer = async (req, res) => {
  const subscription = await stripeCreateCustomerAndSubscription(
    req.user,
    req.body.payment_method,
    req.body.coupon
  );
  res.send(subscription);
};

exports.postStripeSubscription = async (req, res) => {
  let subscription = await stripe.subscriptions.retrieve(
    req.body.subscriptionId
  );
  user.set("profile.membership.stripe.subscriptionId", subscription.id);
  await user.save();

  res.send(subscription);
};

exports.postStripeUpdateSubscription = async (req, res) => {
  const user = req.user;
  const membership = user.profile.membership;
  const payment_method = req.body.payment_method;

  if (membership.paypal) {
    await paypalCancelSubscription(user);
    const subscription = await stripeCreateCustomerAndSubscription(
      user,
      payment_method
    );
    return res.send(subscription);
  } else {
    const paymentMethod = await stripe.paymentMethods.attach(payment_method, {
      customer: membership.stripe.customerId,
    });
    const subscription = await stripe.subscriptions.update(
      membership.stripe.subscriptionId,
      {
        default_payment_method: paymentMethod.id,
      }
    );
    user.set("profile.membership.stripe.last4", paymentMethod.card.last4);
    await user.save();
    return res.send(subscription);
  }
};

exports.postStripeWebhook = async (req, res) => {
  let data;
  let eventType;
  const user = req.user;
  // Check if webhook signing is configured.
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    data = event.data.object;
    eventType = event.type;

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample
    console.log(data);
    switch (event.type) {
      case "invoice.payment_succeeded":
      case "customer.subscription.created":
        user.set("profile.membership.active", true);
        await user.save();
        res.send({ message: "stripe membership enabled" });
      case "customer.subscription.deleted":
      case "invoice.payment_failed":
        user.set("profile.membership.active", false);
        await user.save();
        res.send({ message: "stripe membership disabled" });
      default:
        // Unexpected event type
        return res.status(400).end();
    }
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  }

  res.sendStatus(200);
};

exports.postPaypalPlan = async (req, res) => {
  let planId = process.env.PAYPAL_DEFAULT_PLAN_ID;
  if (req.body.coupon) {
    const coupon = await checkCouponCode(req.body.coupon);
    if (coupon.valid) {
      planId =
        coupon.price == 14
          ? process.env.PAYPAL_COUPON1_PLAN_ID
          : process.env.PAYPAL_COUPON2_PLAN_ID;
    }
  }
  return res.send({
    planId: planId,
  });
};

exports.postPaypalSubscribe = async (req, res) => {
  const user = req.user;

  user.set("profile.membership.active", true);
  user.set("profile.membership.paypal", {
    subscriptionId: req.body.subscriptionId,
  });
  await user.save();

  return res.send(user);
};

exports.postPaypalUpdate = async (req, res) => {
  const user = req.user;
  const membership = user.profile.membership;
  const subscriptionId = req.body.subscriptionId;

  if (membership.paypal == null) {
    await stripeCancelSubscription(user);
  }
  user.set("profile.membership.paypal", {
    subscriptionId: subscriptionId,
  });
  await user.save();

  return res.send({ subscriptionId });
};

exports.postPaypalWebhook = async (req, res) => {
  res.sendStatus(200);
};

exports.postCancelProUser = async (req, res) => {
  const user = req.user;
  const membership = user.profile.membership;

  user.set("profile.membership.active", false);
  await user.save();

  if (membership.stripe && membership.stripe.subscriptionId) {
    const subscription = await stripeCancelSubscription(user);
    return res.send(subscription);
  } else {
    const response = await paypalCancelSubscription(user);
    return res.send(response);
  }
};

exports.postCoupon = async (req, res) => {
  const msg = await checkCouponCode(code);
  res.send(msg);
};

// AMF
const getPaypalConfig = async (req) => {
  let config = {
    auth: {
      username: process.env.PAYPAL_ID,
      password: process.env.PAYPAL_SECRET
    },
    headers: {
     'Accept': 'application/json',
     'Accept-Language': 'en_US',
    }
  }

  if(req) {
    delete config.auth;
    config.headers.Authorization = 'Bearer ' + req.session.paypalToken;
  }

  return config;
};
const getToken = async () => {
  let config = await getPaypalConfig();
  let data = querystring.stringify({ grant_type: 'client_credentials' });
  return axios.post(process.env.PAYPAL_TOKEN_URL, data, config);
}

/*exports.postAuthorizePaypalFORBILLING = async (req, res) => {
  async function getAgreementToken(req) {
    let config = await getPaypalConfig(req);
    let paypalNickname = req.body.paypal_nickname.trim();
    if(paypalNickname.length == 0) {
      let min = 10000;
      let max = 999999;
      paypalNickname = 'P-' + (Math.floor(Math.random() * (max - min + 1 ) + min));
    }
    let approvalUrl = '/';

    let data = {
      "plan_id": "P-0X802956CU6112323MJOC2LI",
      "application_context": {
        "user_action": "", // SUBSCRIBE_NOW to subscribe immediately
        "return_url": process.env.PAYPAL_RETURN_URL + '?paypal_nickname=' + paypalNickname,
        "cancel_url": process.env.PAYPAL_CANCEL_URL,
      }
    }

    let subscriptionResult = await axios.post(process.env.PAYPAL_BILLING_SUBSCRIPTION_URL, data, config);
    let subscriptionStatus = subscriptionResult.data.status;
    if(subscriptionStatus != 'APPROVED' && subscriptionStatus != 'ACTIVE') {
      let links = subscriptionResult.data.links;
      for (let l = 0; l < links.length; l++) {
        if (links[l].rel === 'approve') {
          approvalUrl = links[l].href;
        }
      }
    }

    return approvalUrl;
  }

  let tokenResult = await getToken();
  req.session.paypalToken = tokenResult.data.access_token;
  let approvalUrl = await getAgreementToken(req);

  res.send(approvalUrl);
}*/

exports.postAuthorizePaypal = async (req, res) => {
  async function getAgreementToken(req) {
    let config = await getPaypalConfig(req);

    let paypalNickname = req.body.paypal_nickname.trim();
    if(paypalNickname.length == 0) {
      let min = 10000;
      let max = 999999;
      paypalNickname = 'P-' + (Math.floor(Math.random() * (max - min + 1 ) + min));
    }

    let params = '?paypal_nickname=' + paypalNickname;

    let continueWith;
    if(req.body.continue_with) {
      continueWith = req.body.continue_with.trim();
      params += '&continue_with=' + continueWith;
    }

    let approvalUrl = '/';
    let data = {
      "description": "Billing Agreement",
      "payer": {
        "payment_method": "PAYPAL"
      },
      "plan": {
        "type": "MERCHANT_INITIATED_BILLING",
        "merchant_preferences": {
          "return_url": process.env.PAYPAL_RETURN_URL + params,
          "cancel_url": process.env.PAYPAL_CANCEL_URL,
          "notify_url": process.env.PAYPAL_NOFITY_URL,
          "accepted_pymt_type": "INSTANT",
          "skip_shipping_address": true,
          "immutable_shipping_address": false
        },
      },
    };

    let agreementTokenResult = await axios.post(process.env.PAYPAL_AGREEMENT_TOKEN_URL, data, config);
    let links = agreementTokenResult.data.links;
    for (let l = 0; l < links.length; l++) {
      if (links[l].rel === 'approval_url') {
        approvalUrl = links[l].href;
      }
    }

    return approvalUrl;
  }

  let tokenResult = await getToken();
  req.session.paypalToken = tokenResult.data.access_token;
  let approvalUrl = await getAgreementToken(req);

  res.send(approvalUrl);
}
exports.getSuccessPaypal = async (req, res) => {
  await getBillingAgreement(req.query);

  async function getBillingAgreement(query) {
    let baToken = query.ba_token;

    let config = await getPaypalConfig(req);
    let billingAgreementResult = await axios.post(process.env.PAYPAL_BILLING_AGREEMENT_URL, {token_id: baToken}, config);
    let billingAgreementData = billingAgreementResult.data;

    let baId = billingAgreementData.id;
    let baState = billingAgreementData.state;
    let paypalNickname = query.paypal_nickname;
    
    const paypal = await Paypal.create({
      baId: baId,
      baState: baState,
      extraData: billingAgreementData,
    });

    Payment.create({
      title: paypalNickname,
      userId: req.user.id,
      paymentableId: paypal.id,
      paymentableType: 'paypal',
    });
  }

  let continueWith = '/create';
  if(req.query.continue_with) {
    continueWith += '?continue_with=' + req.query.continue_with;
  }

  res.redirect(continueWith);
}
exports.getCancelPaypal = async (req, res) => {
  res.redirect('/create');
}
exports.deletePayment = async (req, res) => {
  let id = parseInt(req.body.id);
  let payment = await Payment.findOne({
    where: {
      id: id,
      userId: req.user.id
    }
  });

  if(payment) {
    let userPowerup = await PaymentPowerups.findOne({
      where: {
        paymentId: payment.id,
        userId: req.user.id,
        expireDate: {
          [Op.gte]: moment().format('YYYY-MM-DD')
        },
      }
    });

    if(userPowerup) {
      res.sendStatus(400);
      return;
    } else {
      let paymentableId = payment.paymentableId;
      let paymentableType = payment.paymentableType;

      if(paymentableType == 'paypal') {
        await Paypal.destroy({where: {id: paymentableId}});
      } else if(paymentableType == 'card') {
        await Card.destroy({where: {id: paymentableId}});
      }

      payment.destroy();

      res.sendStatus(204);
    }

  }
}

exports.postPowerupByPaypal = async (req, res) => {
  async function makePayment(req, data) {
    let config = await getPaypalConfig(req);

    let dataToSend = {
      "intent": "sale",
      "payer": {
        "payment_method": "PAYPAL",
        "funding_instruments": [{
          "billing": {
            "billing_agreement_id": data.baId
          }
        }]
      },
      "transactions": [{
        "amount": {
          "currency": "USD",
          "total": data.powerup.cost
        },
        "description": "Payment for (" + data.powerup.title + ").",
        // Maybe to use later...
        /*"custom": "Payment custom field.",
        "note_to_payee": "Note to payee field.",
        "invoice_number": "GDAGDS5754YEK",
        "item_list": {
          "items": [{
            "sku": "skuitemNo1",
            "name": "ItemNo1",
            "description": "The item description.",
            "quantity": "1",
            "price": "1.00",
            "currency": "USD",
            "tax": "0",
            "url": "https://example.com/"
          }]
        }*/
      }],
      /*"redirect_urls": {
        "return_url": process.env.PAYPAL_POWERUP_RETURN_URL,
        "cancel_url": process.env.PAYPAL_POWERUP_CANCEL_URL,
      }*/
    };

    let makePaymentResult =
      await axios.post(process.env.PAYPAL_MAKE_PAYMENT_URL, dataToSend, config)
        .then(function(response) {
          async function insertPowerup(req, response, data) {
            let userPowerup;
            let powerup;
            let payment;
            if(response.data.state == 'approved') {
              let days;
              if(data.powerup.cycle === 'monthly') {
                days = 30;
              } else if(data.powerup.cycle === 'yearly') {
                days = 365;
              }

              const expireDate = moment().add(days, 'days').format('YYYY-MM-DD');

              userPowerup = await PaymentPowerups.findOne({
                where: {
                  powerupId: data.powerup.id,
                  userId: req.user.id,
                }
              });

              let refundId = response.data.transactions[0].related_resources[0].sale.id;
              if(userPowerup) {
                powerup = await Powerup.findOne({
                  where: {
                    id: userPowerup.powerupId
                  },
                });

                payment = await Payment.findOne({
                  where: {
                    id: userPowerup.paymentId
                  },
                  include: [{model: Paypal}], //, {model: Card}
                });

                await PaymentPowerups.update({
                  paymentId: data.payment.id,
                  refundId: refundId,
                  expireDate: expireDate,
                  extraData: response.data,
                }, {
                  where: {
                    paymentId: payment.id,
                    powerupId: powerup.id,
                  }
                });
              } else {
                userPowerup = await PaymentPowerups.create({
                  powerupId: data.powerup.id,
                  paymentId: data.payment.id,
                  userId: req.user.id,
                  refundId: refundId,
                  expireDate: expireDate,
                  extraData: response.data
                });

                powerup = await Powerup.findOne({
                  where: {
                    id: userPowerup.powerupId
                  },
                });

                payment = await Payment.findOne({
                  where: {
                    id: userPowerup.paymentId
                  },
                  include: [{model: Paypal}], //, {model: Card}
                });
              }

              userPowerup = Object.assign({powerup, payment}, userPowerup);
            }

            let transaction = await Transaction.create({
              powerupId: data.powerup.id,
              paymentId: data.payment.id,
              title: data.powerup.title,
              cost: data.powerup.cost,
              minusPlus: '-',
              cycle: data.powerup.cycle,
              paymentTitle: data.payment.title,
              userId: req.user.id,
              data: response.data,
              date: moment().format('YYYY-MM-DD')
            });

            return {transaction, userPowerup};
          }

          return insertPowerup(req, response, data);
          // console.log(response.data);
        })
        .catch(function(response) {
          async function insertTransaction(req, response, data) {
            console.log(response);

            await Transaction.create({
              powerupId: data.powerup.id,
              paymentId: data.payment.id,
              title: data.powerup.title,
              cost: data.powerup.cost,
              minusPlus: '-',
              cycle: data.powerup.cycle,
              paymentTitle: data.payment.title,
              userId: req.user.id,
              data: response,
              date: moment().format('YYYY-MM-DD')
            });
          }

          insertTransaction(req, response, data);
        });

    return makePaymentResult;
  }

  let paymentId = parseInt(req.body.paymentId);

  let payment = await Payment.findOne({
    where: {
      id: paymentId,
      userId: req.user.id
    },
    include: [Paypal] //, Card
  });

  if(payment) {
    let powerupId = parseInt(req.body.powerupId);
    let paymentableId = payment.paymentableId;
    let paymentable = await payment.getPaymentable();
    let powerup = await Powerup.findOne({ where: {id: powerupId} });

    if(paymentable && powerup) {
      let tokenResult = await getToken();
      req.session.paypalToken = tokenResult.data.access_token;
      let makePaymentResult = await makePayment(req, {
        powerup: powerup,
        payment: payment,
        baId: paymentable.baId,
      });

      res.send(makePaymentResult);
    }
  }
}

exports.postCancelPowerupByPaypal = async (req, res) => {
  async function refundPayment(req, data) {
    let refundPaymentResult = false;

    let config = await getPaypalConfig(req);

    let today = moment(new Date()).format('YYYY-MM-DD');
    let expireDate = moment(data.userPowerup.expireDate, 'YYYY-MM-DD');
    let expireDays = expireDate.diff(today, 'days');

    if(expireDays > 0) {
      let days = 0;
      if(data.powerup.cycle == 'monthly') {
        days = 30;
      } else if(data.powerup.cycle == 'yearly') {
        days = 365;
      }

      let costPerDay = data.powerup.cost / days;
      data.totalAmount = expireDays * costPerDay;
      let dataToSend = {
        'amount': {
          'total': data.totalAmount,
          'currency': 'USD'
        },
      };

      let requestTo = process.env.PAYPAL_REFUND_PAYMENT_URL;
      requestTo = requestTo.replace('{sale_id}', data.userPowerup.refundId);

      async function insertTransaction(req, response, data) {
        await Transaction.create({
          powerupId: data.powerup.id,
          paymentId: null,
          title: data.powerup.title,
          cost: data.totalAmount,
          minusPlus: '+',
          cycle: data.powerup.cycle,
          paymentTitle: 'Refund',
          userId: req.user.id,
          data: response.data,
          date: moment().format('YYYY-MM-DD')
        });
      }

      refundPaymentResult =
        await axios.post(requestTo, dataToSend, config)
          .then(function(response) {
            insertTransaction(req, response, data);
            // console.log(response.data);
          })
          .catch(function(response) {
            insertTransaction(req, response, data);
            console.log(response);
          });
    }

    return refundPaymentResult;
  }

  let powerupId = parseInt(req.body.powerupId);
  let userPowerup = await PaymentPowerups.findOne({
    where: {
      powerupId: powerupId,
      userId: req.user.id,
    }
  });

  let powerup = await Powerup.findOne({where: {id: powerupId}});

  if(powerup && userPowerup) {
    let tempUserPowerup = userPowerup;
    let tokenResult = await getToken();
    req.session.paypalToken = tokenResult.data.access_token;

    userPowerup.destroy();

    await refundPayment(req, {
      userPowerup: tempUserPowerup,
      powerup: powerup
    });

    res.sendStatus(200);
  }
}

exports.getViewTransaction = async (req, res) => {
  let id = parseInt(req.query.id);
  let transactions = await Transaction.findAll({
    where: {
      paymentId: id,
      userId: req.user.id
    },
  });

  res.send({transactions: transactions});
}