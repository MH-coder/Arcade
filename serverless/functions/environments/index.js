const { Pool } = require("pg");

const pool = new Pool({
  max: 1,
  min: 0,
  idleTimeoutMillis: 120000,
  connectionTimeoutMillis: 10000,
});

exports.handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const objectKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const objectUrl = objectKey.replace("assets/environments/", "");

  if (!objectUrl.endsWith("/")) {
    const partials = objectUrl.split("/");
    const name = partials[0];
    const url = partials[1];

    const client = await pool.connect();
    try {
      if (url.endsWith(".hdr")) {
        await client.query(
          'INSERT INTO public."Environments" ("name", "url", "createdAt", "updatedAt") VALUES ($1, $2, Now(), Now()) ON CONFLICT("name") DO UPDATE SET "url"=EXCLUDED."url"',
          [name, objectKey]
        );
      } else {
        await client.query(
          'INSERT INTO public."Environments" ("name", "thumbUrl", "createdAt", "updatedAt") VALUES ($1, $2, Now(), Now()) ON CONFLICT("name") DO UPDATE SET "thumbUrl"=EXCLUDED."thumbUrl"',
          [name, objectKey]
        );
      }
    } finally {
      client.release();
    }
  }
};
