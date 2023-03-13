const { Op } = require("sequelize");
const { Collection, Chapter } = require("../models");

exports.postCreate = async (req, res) => {
  const order = await Collection.count();
  const collection = await Collection.create({
    title: "untitled",
    order,
  });

  res.status(200).send(collection);
};

exports.postUpdate = async (req, res) => {
  await Collection.update(req.body, {
    where: { id: req.params.id },
  });

  res.status(200).send();
};

exports.postDelete = async (req, res) => {
  const id = req.params.id;
  const collection = await Collection.findOne({
    where: { id },
  });
  const collections = await Collection.findAll({
    where: {
      order: {
        [Op.gt]: collection.order,
      },
    },
  });

  collections.map(async (c) => {
    await c.update({
      order: c.order - 1,
    });
  });
  await Chapter.destroy({
    where: { collectionId: id },
  });
  await collection.destroy();

  res.status(200).send();
};

exports.postReorder = async (req, res) => {
  const ids = req.body.ids;
  for (let i = 0; i < ids.length; i++) {
    await Collection.update(
      {
        order: i,
      },
      {
        where: { id: ids[i] },
      }
    );
  }
  res.status(200).send();
};
