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
  const objectUrl = objectKey.replace("assets/geometries/", "");
  const partials = objectUrl.split("/");

  const client = await pool.connect();
  try {
    let result = null;
    let id = 0;
    let i = 0;
    for (i = 0; i < partials.length - 1; i++) {
      result = await client.query(
        'SELECT * FROM public."Geometries" WHERE "name"=$1 AND "parentId"=$2',
        [partials[i], id]
      );

      if (result.rows.length == 0) {
        result = await client.query(
          'INSERT INTO public."Geometries" ("name", "url", "thumbUrl", "parentId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, Now(), Now()) RETURNING id;',
          [partials[i], null, null, id]
        );
      }
      id = result.rows[0].id;
    }
    if (partials[i]) {
      const name = partials[i - 1];
      const url = partials[i];

      if (url.startsWith("object")) {
        await client.query(
          'UPDATE public."Geometries" SET "url"=$1 WHERE "name"=$2 AND "id"=$3',
          [objectKey, name, id]
        );
      } else {
        await client.query(
          'UPDATE public."Geometries" SET "thumbUrl"=$1 WHERE "name"=$2 AND "id"=$3',
          [objectKey, name, id]
        );
      }
    }
  } finally {
    client.release();
  }
};
