const { SES, SendRawEmailCommand } = require("@aws-sdk/client-ses");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const { S3 } = require("@aws-sdk/client-s3");

const s3 = new S3({
  region: process.env.S3_REGION || "us-east-2",
});

const _SES = new SES({
  apiVersion: "2010-12-01",
  region: "us-east-2",
})
const nodeMailerSES = {
  ses: _SES,
  aws: { SendRawEmailCommand },
};

module.exports = {
  nodeMailerSES,
  getSignedUrl,
  s3,
  S3
}
