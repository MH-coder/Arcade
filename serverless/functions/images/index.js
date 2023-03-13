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
  const objectUrl = objectKey.replace("assets/images/", "");
  const partials = objectUrl.split("/");

  const client = await pool.connect();
  try {
    let result = null;
    let parentId = 0;
    let i = 0;
    for (i = 0; i < partials.length - 1; i++) {
      result = await client.query(
        'SELECT * FROM public."Images" WHERE "name"=$1 AND "parentId"=$2',
        [partials[i], parentId]
      );

      if (result.rows.length == 0) {
        result = await client.query(
          'INSERT INTO public."Images" ("name", "url", "parentId", "createdAt", "updatedAt") VALUES ($1, $2, $3, Now(), Now()) RETURNING id;',
          [partials[i], null, parentId]
        );
      }
      parentId = result.rows[0].id;
    }
    if (partials[i]) {
      result = await client.query(
        'SELECT * FROM public."Images" WHERE "name"=$1 AND "parentId"=$2',
        [partials[i], parentId]
      );

      if (result.rows.length == 0) {
        await client.query(
          'INSERT INTO public."Images" ("name", "url", "parentId", "createdAt", "updatedAt") VALUES ($1, $2, $3, Now(), Now());',
          [partials[i], objectKey, parentId]
        );
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
  }
};
