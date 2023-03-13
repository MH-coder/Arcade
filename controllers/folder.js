const db = require("../models");

exports.postCreate = async (req, res) => {
  const data = {
    ...req.body,
    userId: req.user.id,
  };
  const folder = await db.Folder.create(data);
  res.status(200).send(folder);
};

exports.postDelete = async (req, res) => {
  await db.Folder.destroy({
    where: { id: req.params.id },
  });

  res.status(200).send({ msg: "success" });
};

exports.postUpdate = async (req, res) => {
  await db.Folder.update(req.body, {
    where: { id: req.params.id },
  });

  res.status(200).send({ msg: "success" });
};

exports.postDuplicate = async (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;
  const data = {
    name,
    type: type.toLowerCase(),
    userId: req.user.id,
  };
  const folder = await db.Folder.create(data);

  const items = await db["User" + type].findAll({
    where: { userId: req.user.id, folderId: id },
  });

  await db["User" + type].bulkCreate(items);

  res.status(200).send(folder);
};
