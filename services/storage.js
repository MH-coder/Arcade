const { getSignedUrl, s3 } = require("./aws.services");
const moment = require("moment");

const bucket = process.env.S3_BUCKET;

const cfDistribution = process.env.CLOUDFRONT_DISTRIBUTION;

function getCFSignedUrl(key) {
  const url = `${cfDistribution}/${encodeURI(key)}`;
  if (!key) {
    return null;
  }

  const date = moment().utc().add(20, "m").format()
  return getSignedUrl({
    url,
    keyPairId: process.env.AWS_CF_SIGNER_KEY_PAIR_PK,
    dateLessThan: date,
    privateKey: process.env.AWS_CF_SIGNER_KEY_PAIR_PRIVATE_KEY,
  });
}

function getS3SignedUrl(key) {
  const params = {
    Bucket: bucket,
    Key: key,
    Expires: 60 * 60 * 24,
  };

  if (key == null) {
    return null
  } else {
    return s3.getSignedUrl("getObject", params)
  }
}

module.exports = {
  getUrl: (key) => {
    if (!key) {
      return null;
    }
    if (typeof key === 'string') {
      return getCFSignedUrl(key);
    }
    return getS3SignedUrl(key);
  },
  uploadJSON: (key, json) => {
    return s3.putObject(
      {
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(json),
      },
      (err, data) => {
        if (err) console.log(err)
        else {
          console.log("COPY===", data)
          return data
        }
      }
    )
  },
  copy: (src, dest) => {
    const params = {
      Bucket: bucket,
      CopySource: `/${bucket}/${src}`,
      Key: dest,
    };

    return s3.copyObject(params);
  },
  delete: (dest) => {
    const params = {
      Bucket: bucket,
      Key: dest
    };
    return s3.deleteObject(params);
  }
};
