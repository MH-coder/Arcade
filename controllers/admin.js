"use strict";

const { Sample } = require("../models");

exports.index = async (req, res) => {
  let samples = null;
  try {
    samples = await Sample.findAll({
      order: [["order", "ASC"]],
    });
  } catch (err) {
    samples = [];
  }
  res.render("admin", {
    title: "Explore",
    isAdmin: true,
    samples,
  });
};

exports.createSample = async (req, res) => {
  try {
    const sample = await Sample.create({
      title: null,
      author: null,
      slug: null,
      thumbnail: null,
    });
    const count = await Sample.count();

    sample.set({ order: count });
    await sample.save();

    return res.send({
      status: "success",
      sample,
    });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.updateSample = async (req, res) => {
  try {
    await Sample.update(req.body, {
      where: { id: req.params.id },
    });

    return res.send({ status: "success" });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.deleteSample = async (req, res) => {
  try {
    await Sample.destroy({
      where: { id: req.params.id },
    });

    return res.send({ status: "success" });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.uploadSampleThumbnail = async (req, res) => {
  try {
    const url = req.file.location;
    await Sample.update(
      {
        thumbnail: url,
      },
      {
        where: { id: req.body.id },
      }
    );

    return res.send({ status: "success", url });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.reorderSample = async (req, res) => {
  try {
    const order = req.body.order;
    const samples = await Promise.all(
      order.map((id) => Sample.findOne({ where: { id } }))
    );

    await Promise.all(
      samples.map((sample, i) => {
        sample.set({ order: i });
        return sample.save();
      })
    );

    return res.send({ status: "success" });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};
