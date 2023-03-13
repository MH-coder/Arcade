const { Op } = require("sequelize");
const { Chapter } = require("../models");

exports.postCreate = async (req, res) => {
  const collectionId = req.body.collectionId;
  const order = await Chapter.count({
    where: {
      collectionId,
    },
  });
  const chapter = await Chapter.create({
    title: "untitled",
    video: "00000000",
    order,
    collectionId,
  });
  res.status(200).send(chapter);
};

exports.postUpdate = async (req, res) => {
  await Chapter.update(req.body, {
    where: { id: req.params.id },
  });

  res.status(200).send();
};

exports.postDelete = async (req, res) => {
  const id = req.params.id;
  const chapter = await Chapter.findOne({
    where: { id },
  });
  const chapters = await Chapter.findAll({
    where: {
      order: {
        [Op.gt]: chapter.order,
      },
      collectionId: chapter.collectionId,
    },
  });

  chapters.map(async (c) => {
    await c.update({
      order: c.order - 1,
    });
  });
  await chapter.destroy();

  res.status(200).send();
};

exports.postReorder = async (req, res) => {
  const orders = req.body.orders;

  for (const order of orders) {
    for (let i = 0; i < order.chapterIds.length; i++) {
      await Chapter.update(
        {
          order: i,
          collectionId: order.collectionId,
        },
        {
          where: { id: order.chapterIds[i] },
        }
      );
    }
  }
  res.status(200).send();
};
