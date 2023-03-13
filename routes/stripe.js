const express = require("express");
const paymentController = require("../controllers/payment.js");

module.exports = function (app) {
  app.post("/payment/stripe-webhook", express.raw({ type: 'application/json' }), paymentController.postStripeWebhook);
}