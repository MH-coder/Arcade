"use strict";

const path = require("path");
const { Op } = require("sequelize");
const { Publish, Project,User } = require("../models");
const storageService = require("../services/storage.js");

exports.getPublishList = async (req, res) => {
  try {
    const publishes = await Publish.findAll({
      where: { userId: req.user.id },
      include: [User]
    });
    return res.send(
      publishes.map((p) => {
        const pSlug = req.user.profile.username + "/" + p.slug;
        return { id: p.id, slug: pSlug, title: p.title };
      })
    );
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.postCreate = async (req, res) => {
  try {
    console.log(req.user.profile.username);
    if(!req.user.profile.username){
      return res.send({ status: "error", msg: "Username doesnt exists" });
    }
    // return res.send({ status: "error", msg: "Username doesnt exists" });
    const title = req.body.title.trim();
    //remove limit in publishing project
    //comment next lines for this
    //const count = await Publish.count({ where: { userId: req.user.id } });
    //if (!req.user.profile.membership.active && count >= 3) {
    //  return res.send({ status: "limit" });
    //}
    const exists = await Publish.findOne({
      where: { title },
    });
    if (exists) {
      return res.send({ status: "exists" });
    }
    
    const slug = title.split(' ').join('_').toLowerCase();
    const publish = await Publish.create({
      title,
      slug,
      userId: req.user.id,
      stateUrl: null,
      thumbUrl: null,
    });

    await publish.save();
    const pSlug = req.user.profile.username + "/" + slug;
    return res.send({
      status: "success",
      publish: { id: publish.id, slug: pSlug, title },
    });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.postDelete = async (req, res) => {
  try {
    await Publish.destroy({ where: { id: req.body.id } });

    return res.send({ status: "success" });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.postPublish = async (req, res) => {
  try {
    const { id, slug: uNamedSlug } = req.body;
    const slug = uNamedSlug.split('/')[1];
    const publish = await Publish.findOne({
      where: { slug: slug },
    });
    const project = await Project.findOne({
      where: { id: id },
    });

    let stateUrl = null;
    let thumbUrl = null;

    if (project.stateUrl) {
      stateUrl = `publishes/${slug}/state.json`;
      await storageService.copy(project.stateUrl, stateUrl);
    }
    if (project.thumbUrl) {
      thumbUrl = `publishes/${slug}/thumbnail${path.extname(project.thumbUrl)}`;
      //await storageService.copy(project.thumbUrl, thumbUrl);
    }

    if (publish) {
      publish.stateUrl = stateUrl;
      //publish.thumbUrl = thumbUrl;

      await publish.save();
    }

    return res.send({
      status: "success",
      message: "the application is successfully published.",
    });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.getPortfolioList = async (req, res) => {
  try {
    let portfolios = [];
    const publishes = await Publish.findAll({
      where: { userId: req.user.id, "portfolio.active": true },
      order: [["portfolio.order", "ASC"]],
      include: [User],
    });
    publishes.map((publish) =>
      portfolios.push({
        id: publish.id,
        slug: `${publish.User.profile.username}/${publish.slug}`,
        thumbUrl: storageService.getUrl(publish.thumbUrl),
        title: publish.title,
        description: publish.portfolio.description,
        thumbnail: storageService.getUrl(publish.thumbUrl),
        author: publish.User.profile.username
      })
    );

    return res.send({ status: "success", portfolios: portfolios });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.postPortfolioAdd = async (req, res) => {
  try {
    const id = req.body.id;
    const publish = await Publish.findOne({ where: { id: id } });
    if (publish.portfolio.active) {
      return res.send({ status: "error", msg: "already added to portfolio" });
    }
    const count = await Publish.count({
      where: { userId: req.user.id, "portfolio.active": true },
    });
    publish.set({ "portfolio.active": true });
    publish.set({ "portfolio.order": count });
    await publish.save();
    const portfolio = {
      id: publish.id,
      slug: `${req.user.profile.username}/${publish.slug}`,
      thumbUrl: storageService.getUrl(publish.thumbUrl),
      title: publish.title,
    };
    return res.send({ status: "success", portfolio: portfolio });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.postPortfolioDelete = async (req, res) => {
  try {
    const id = req.body.id;
    const publish = await Publish.findOne({ where: { id: id } });
    const publishes = await Publish.findAll({
      where: {
        "portfolio.order": {
          [Op.gt]: publish.portfolio.order,
        },
        userId: req.user.id,
      },
    });

    publishes.map(async (p) => {
      p.set("portfolio.order", p.portfolio.order - 1);
      await p.save();
    });

    publish.set("portfolio.active", false);
    publish.set("portfolio.order", 0);
    publish.set("portfolio.title", null);
    await publish.save();
    return res.send({ status: "success" });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.postPortfolioRename = async (req, res) => {
  try {
    const { id, title } = req.body;
    let maxChars = 40;
    if(title && title.length > maxChars) {
      throw {message: 'The length of title must not be greater than ' + maxChars + '.'};
    }

    const publish = await Publish.findOne({ where: { id: id } });

    publish.set("portfolio.title", title);
    await publish.save();

    return res.send({ status: "success" });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.postPortfolioDescription = async (req, res) => {
  try {
    const { id, description } = req.body;
    let maxChars = 750;
    if(description && description.length > maxChars) {
      throw {message: 'The length of description must not be greater than ' + maxChars + '.'};
    }

    const publish = await Publish.findOne({ where: { id: id } });

    publish.set("portfolio.description", description);
    await publish.save();

    return res.send({ status: "success", message: 'Successfully saved.' });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.postPortfolioReorder = async (req, res) => {
  try {
    const order = req.body.order;
    for (let i = 0; i < order.length; i++) {
      const publish = await Publish.findOne({ where: { id: order[i] } });
      publish.set("portfolio.order", i);
      await publish.save();
    }
    return res.send({ status: "success" });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};

exports.postPortfolioThumbnail = async (req, res) => {
  try {
    let slug = req.body.slug;
    slug = slug.split('/')[1];
    const thumbnail = req.file;
    const ext = path.extname(thumbnail.originalname);
    const thumbUrl = `publishes/${slug}/thumbnail${ext}`;
    const publish = await Publish.findOne({ where: { slug } });

    publish.thumbUrl = thumbUrl;
    await publish.save();

    return res.send({
      status: "success",
      url: storageService.getUrl(thumbUrl),
    });
  } catch (err) {
    return res.send({ status: "error", message: err.message });
  }
};
