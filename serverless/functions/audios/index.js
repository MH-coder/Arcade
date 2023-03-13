const { createWriteStream, unlink } = require("fs");
const { tmpdir } = require("os");
const { join } = require("path");
const { S3 } = require("../../../services/aws.services");

const { Pool } = require("pg");

const tmpDir = process.env.TEMP || tmpdir();
const download = join(tmpDir, "download");
const s3 = new S3();
const pool = new Pool({
  max: 1,
  min: 0,
  idleTimeoutMillis: 120000,
  connectionTimeoutMillis: 10000,
});

const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfprobePath(ffprobePath);

const downloadFile = (bucket) => {
  return new Promise((resolve, reject) => {
    s3.getObject(bucket)
      .createReadStream()
      .on("end", () => {
        console.log("Download finished");
        resolve();
      })
      .on("error", reject)
      .pipe(createWriteStream(download));
  });
};

const removeFile = (localFilePath) => {
  return new Promise((resolve, reject) => {
    unlink(localFilePath, (err, result) =>
      err ? reject(err) : resolve(result)
    );
  });
};

const getDuration = (file) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, function(err, metadata) {
      if (err) reject(err);
      resolve(metadata.format.duration);
    });
  });
};

exports.handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const objectKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const bucketName = event.Records[0].s3.bucket.name;
  const objectUrl = objectKey.replace("assets/audios/", "");
  const partials = objectUrl.split("/");

  const client = await pool.connect();
  try {
    let result = null;
    let parentId = 0;
    let i = 0;
    for (i = 0; i < partials.length - 1; i++) {
      result = await client.query(
        'SELECT * FROM public."Audios" WHERE "name"=$1 AND "parentId"=$2',
        [partials[i], parentId]
      );

      if (result.rows.length == 0) {
        result = await client.query(
          'INSERT INTO public."Audios" ("name", "url", "duration", "parentId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, Now(), Now()) RETURNING id;',
          [partials[i], null, null, parentId]
        );
      }
      parentId = result.rows[0].id;
    }
    if (partials[i]) {
      await downloadFile({
        Bucket: bucketName,
        Key: objectKey,
      });

      const duration = await getDuration(download);
      result = await client.query(
        'SELECT * FROM public."Audios" WHERE "name"=$1 AND "parentId"=$2',
        [partials[i], parentId]
      );

      if (result.rows.length == 0) {
        await client.query(
          'INSERT INTO public."Audios" ("name", "url", "duration", "parentId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, Now(), Now());',
          [partials[i], objectKey, duration, parentId]
        );
      } else {
        await client.query(
          'UPDATE public."Audios" SET "duration"=$1 WHERE "id"=$2',
          [duration, result.rows[0].id]
        );
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    await removeFile(download);
    client.release();
  }
};
