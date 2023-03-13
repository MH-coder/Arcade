"use strict"
const { Op, QueryTypes } = require("sequelize")
const path = require("path")
const {
  Project,
  Publish,
  Geometry,
  User,
  Material,
  Image,
  Audio,
  Video,
  Environment,
  Font,
  Animation,
  UserGeometry,
  UserMaterial,
  UserImage,
  UserAudio,
  UserVideo,
  UserEnvironment,
  UserAnimation,
  DeletedProject,
  ExampleProject,
  sequelize,
  Export, ExportLog
} = require("../models");
const storageService = require("../services/storage");
const stripeService = require("../services/stripe.service");
const addonsConfig = require("../config/addons");
const stripeConfig = require("../config/stripe");
const moment = require('moment');

const buildList = (items, parentId, objects, type) => {
  const children = items.filter((g) => g.parentId == parentId)
  for (const child of children) {
    const subchildren = items.filter((g) => g.parentId == child.id)
    if (subchildren.length == 0) {
      objects[child.name] = {
        id: child.id,
      }
      if (type == "Geometry" || type == "Material") {
        objects[child.name]["thumbUrl"] = storageService.getUrl(child.thumbUrl);
      } else if (type == "Environment") {
        objects[child.name]["name"] = child.name;
        objects[child.name]["thumbUrl"] = storageService.getUrl(child.thumbUrl);
      }
      if (type == "Image" || type == "Audio" || type == "Animation") {
        objects[child.name]["url"] = storageService.getUrl(child.url)
      }
      if (type == "Audio") {
        objects[child.name]["duration"] = child.duration
      }
    } else {
      objects[child.name] = {
        children: {},
        id: child.id,
      }
      if (type == "Geometry" || type == "Material") {
        objects[child.name]["thumbUrl"] = storageService.getUrl(child.thumbUrl);
      } else if (type == "Environment") {
        objects[child.name]["name"] = child.name;
        objects[child.name]["thumbUrl"] = storageService.getUrl(child.thumbUrl);
      }
      buildList(items, child.id, objects[child.name].children, type)
    }
  }
}

exports.renderProject = async (req, res) => {
  try {
    const project = await Project.findOne({ where: { id: req.params.id } });
    if (!project) {
      throw new Error('Project does not exist');
    }
    if (project.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }
    return res.render("project", {
      p: {
        id: project.id,
        name: project.name,
        stateUrl: storageService.getUrl(project.stateUrl),
        configUrl: storageService.getUrl(project.configUrl),
        thumbUrl: storageService.getUrl(project.thumbUrl),
      },
      isSuperAdmin: req.user.dataValues.profile && req.user.dataValues.profile.role === 'SuperAdmin',
    })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.renderApp = async (req, res, next) => {
  const slug = req.params.slug.toLowerCase();
  const username = req.params.username.toLowerCase();

  if(username && slug){
    const publish = await Publish.findOne({ where: { slug } });

    if (publish) {
      const user = await User.findOne({
        where: { id: publish.userId }
      });

      
      if(user && user.profile && user.profile.username){
        const actualUsername = user.profile.username.toLowerCase();
        if(actualUsername === username)
          return res.render("app", {
            app: storageService.getUrl(publish.stateUrl),
            image: storageService.getUrl(publish.thumbUrl),
            title: publish.title,
            slug: "https://arcade.studio" + username + "/" + slug,
          })
      }
    }
  }
  next();
}

exports.getProjectList = async (req, res) => {
  try {
    const projects = await req.user.getProjects({ order: [["id", "DESC"]] })
    return res.send(projects)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getProjectStateUrl = async (req, res) => {
  try {
    const project = await Project.findOne({ where: { id: req.query.id } });
    if (!project) {
      throw new Error('Project does not exist');
    }
    if (project.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }
    return res.send({ url: storageService.getUrl(project.stateUrl) });
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postProjectCreate = async (req, res) => {
  try {
    //remove limit in creation project
    //commented next lines for this
    //const count = await Project.count({ where: { userId: req.user.id } });
    //if (!req.user.profile.membership.active && count >= 3) {
    //  return res.send({ status: "limit" });
    //}

    const project = await Project.create({
      name: req.body.name,
      userId: req.user.id,
      category:"recent",
    })
    return res.send({ status: "success", ...project.dataValues })
  } catch (err) {
    return res.status(400).send({ status: "error", message: err.message })
  }
}

exports.postProjectUpdate = async (req, res) => {
  try {
    const { id, data } = req.body;
    const project = await Project.findOne({ where: { id: id } });
    if (!project) {
      throw new Error('Project does not exist');
    }
    if (project.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    project.set(data)
    await project.save()

    return res.send({ status: "success" })
  } catch (err) {
    return res.status(400).send({ status: "error", message: err.message })
  }
}

exports.postProjectDuplicate = async (req, res) => {
  try {
    //remove limit in creation project
    //commented next lines for this
    //const count = await Project.count({ where: { userId: req.user.id } });
    //if (!req.user.profile.membership.active && count == 3) {
    //  return res.send({ status: "limit" });
    //}
    const src = await Project.findOne({ where: { id: req.body.id } });
    if (!src) {
      throw new Error('Project does not exist');
    }
    if (src.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }
    const dest = await Project.create({
      name: src.name + " copy",
      userId: req.user.id,
      category:src.category
    })

    const uid = req.user.id
    let needSave = false
    if (src.configUrl) {
      const srcConfigUrl = src.configUrl
      const destConfigUrl = `projects/${uid}/${dest.id}/config.json`

      await storageService.copy(srcConfigUrl, destConfigUrl)
      dest.configUrl = destConfigUrl
      needSave = true
    }
    if (src.stateUrl) {
      const srcStateUrl = src.stateUrl
      const destStateUrl = `projects/${uid}/${dest.id}/state.json`

      await storageService.copy(srcStateUrl, destStateUrl)
      dest.stateUrl = destStateUrl
      needSave = true
    }
    if (needSave) {
      await dest.save()
    }
    return res.send({ status: "success", id: dest.id, name: dest.name })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}
exports.postProjectAllowDownload = async (req, res) => {
  try {
    if(req.user && req.user.stripeCustomerId) {
      const subscription = await stripeService.querySubscription({
        customer: req.user.stripeCustomerId,
        status: 'active', // status anything other than active blocks user from downloading the assets
        limit: 1
      });
      if (subscription) {
        return res.send({ status: "success", download: true })
      }
    }

    return res.send({ status: "limit", download: false })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postProjectDownload = async (req, res) => {
  try {
    let projectId = parseInt(req.body.projectId);
    let project = await Project.findOne({where: { id: projectId }});

    if(project) {
      let userExport = await Export.findOne({
        where: {
          projectId: projectId,
          userId: req.user.id,
        }
      });

      if(userExport) {
        userExport.times = parseInt(userExport.times) + 1;
        await userExport.save();
      } else {
        userExport = await Export.create({
          userId: req.user.id,
          projectId: projectId,
          times: 1
        });
      }

      await ExportLog.create({
        exportId: userExport.id,
        date: moment().format('YYYY-MM-DD HH:mm:ss'),
        logging: console.log
      });
    }

    return res.sendStatus(204);
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postProjectDelete = async (req, res) => {
  try {
    /* Find the project and insert it into DeletedProject table. */
    const project = await Project.findOne({ where: { id: req.body.id } });
    if (project) {
      await DeletedProject.create({
        id: project.id,
        name: project.name,
        stateUrl: project.stateUrl,
        configUrl: project.configUrl,
        thumbUrl: project.thumbUrl,
        userId: project.userId,
        deletedAt: new Date().toISOString()
      });
    }

    /* Delete the project */
    await Project.destroy({ where: { id: req.body.id } });

    return res.send({ status: "success" })
  } catch (err) {
    return res.status(400).send({ status: "error", message: err.message })
  }
}

exports.postProjectConfig = async (req, res) => {
  try {
    const uid = req.user.id;
    const pid = req.body.id;
    const url = `projects/${uid}/${pid}/config.json`;
    const project = await Project.findOne({ where: { id: pid } });
    if (!project) {
      throw new Error('Project does not exist');
    }
    if (project.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }
    if (project.configUrl == null) {
      project.configUrl = url
      await project.save()
    }
    await storageService.uploadJSON(url, req.body.config)
    return res.send({ status: "success" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postProjectState = async (req, res) => {
  try {
    const uid = req.user.id;
    const pid = req.body.id;
    const waitUpload = req.body.waitUpload;
    const url = `projects/${uid}/${pid}/state.json`;
    const project = await Project.findOne({ where: { id: pid } });
    if (!project) {
      throw new Error('Project does not exist');
    }
    if (project.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }
    if (project.stateUrl == null) {
      project.stateUrl = url
      await project.save()
    }
    if(waitUpload){
      await storageService.uploadJSON(url, req.body.state)
    } else {
      storageService.uploadJSON(url, req.body.state)
    }
    return res.send({ status: "success" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postProjectThumbnail = async (req, res) => {
  try {
    const uid = req.user.id;
    const pid = req.body.id;
    const thumbnail = req.file;
    const thumbUrl = `projects/${uid}/${pid}/thumbnail${path.extname(
      thumbnail.originalname
    )}`;
    const project = await Project.findOne({ where: { id: pid } });
    if (!project) {
      throw new Error('Project does not exist');
    }
    if (project.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    project.thumbUrl = thumbUrl
    await project.save()

    return res.send({
      status: "success",
      url: storageService.getUrl(thumbUrl),
    })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postExampleProjectThumbnail = async (req, res) => {
	try {
		if (!req.user.dataValues.profile || req.user.dataValues.profile.role !== 'SuperAdmin') {
			throw new Error('Unauthorized');
		}

		const uid = req.user.id;
		const pid = req.body.id;
		const thumbnail = req.file;
		const thumbUrl = `examples/${pid}/thumbnail${path.extname(thumbnail.originalname)}`;
		const project = await ExampleProject.findOne({ where: { id: pid } });
		if (!project) {
			throw new Error('Project does not exist');
		}

		project.thumbUrl = thumbUrl;
		await project.save();

		return res.send({
			status: 'success',
			url: storageService.getUrl(thumbUrl),
		});
	} catch (err) {
    console.log({err})
		return res.status(400).send({ status: 'error', message: err.message });
	}
};

exports.createExampleProject = async (req, res) => {
  try {
    // Validate admin role
    if (!req.user.dataValues.profile || req.user.dataValues.profile.role !== 'SuperAdmin') {
      return res.status(403).send('Access denied');
    }

    // Validate request
    if (!req.body || !req.body.projectId) {
      return res.status(400).send('request payload is invalid or missing');
    }
    const project = await Project.findOne({ where: { id: req.body.projectId }, raw: true });

    if (!project) {
			return res.status(400).send('No project found with the given project Id');
		}

    if (!project.stateUrl) {
			return res.status(400).send('state url is required');
		}

    const exampleProject  = await ExampleProject.create({
      name: project.name || 'Example Project',
      title:req.body.title || '',
      description: req.body.description || '',
      vimeoId: req.body.vimeoId || '555383378',
      thumbUrl: req.body.thumbUrl,
      stateUrl: '',
      configUrl: null,
      order: req.body.order || 0
    });

    // Copy the state and config files
    const srcStateUrl = project.stateUrl;
		const destStateUrl = `examples/${exampleProject.id}/state.json`;
    await storageService.copy(srcStateUrl, destStateUrl);
		exampleProject.stateUrl = destStateUrl;

    if (project.configUrl) {
      const srcConfigUrl = project.configUrl;
			const destConfigUrl = `examples/${exampleProject.id}/config.json`;
      await storageService.copy(srcConfigUrl, destConfigUrl);
			exampleProject.configUrl = destConfigUrl;
    }

		await exampleProject.save();

		return res.send({
			...exampleProject.dataValues,
			thumbUrl: storageService.getUrl(exampleProject.thumbUrl),
		});

  } catch (err) {
    return res.status(400).send({ status: "error", message: err.message })
  }
};

exports.getExampleProjectList = async (req, res) => {
  try {
    const projects = await ExampleProject.findAll({ order: [["order", "DESC"]] })
    projects.forEach((project) => {
			project.thumbUrl = storageService.getUrl(project.thumbUrl);
		});
    return res.send(projects)
  } catch (err) {
    return res.status(500).send({ status: "error", message: err.message })
  }
}

exports.updateExampleProject = async (req, res) => {
  try {
    // Validate admin role
    if (!req.user.dataValues.profile || req.user.dataValues.profile.role !== 'SuperAdmin') {
      return res.status(403).send('Access denied');
    }

    // Fetch the project
    const currentProject = (await ExampleProject.findOne({ where: { id: req.params.id } }))?.dataValues;

    if (!currentProject) {
			return res.status(400).send('project does not exist');
		}

    const newProject = { ...currentProject };
    if (!newProject) {
      return res.status(404).send('project does not exist');
    }

    // Validate request
    if (!req.body) {
      return res.status(400).send('request payload is invalid or missing');
    }
    ['title', 'name', 'description', 'vimeoId', 'order'].forEach((prop) => {
			if (req.body[prop]) newProject[prop] = req.body[prop];
		});

    await ExampleProject.update(newProject, {
      where: { id: req.params.id },
    });

    return res.send({ ...newProject, thumbUrl: storageService.getUrl(newProject.thumbUrl) });

  } catch (err) {
    return res.status(400).send({ status: "error", message: err.message })
  }
};

exports.updateExampleProjectsOrder = async (req, res) => {
	try {
		// Validate admin role
		if (!req.user.dataValues.profile || req.user.dataValues.profile.role !== 'SuperAdmin') {
			return res.status(403).send('Access denied');
		}

		// Validate request

		let exampleProjects = req.body;

		if (!exampleProjects || !(exampleProjects instanceof Array)) {
			return res.status(400).send('request payload is invalid or missing');
		}

		let orderUpdates = exampleProjects.map(async (exampleProject) => {
			return await ExampleProject.update(
				{
					order: exampleProject.order,
				},
				{ where: { id: exampleProject.id } }
			);
		});

		Promise.all(orderUpdates)
			.then((resFrom) => {
				return res.sendStatus(200);
			})
			.catch((err) => {
				return res.status(500).send({ status: 'error', message: err.message });
			});
	} catch (err) {
		return res.sendStatus(500);
	}
};

exports.duplicateExampleProject = async (req, res) => {
	try {
		if (!req.user.dataValues.profile || req.user.dataValues.profile.role !== 'SuperAdmin') {
			return res.status(403).send('Access denied');
		}

		const src = await ExampleProject.findOne({ where: { id: req.params.id } });
		if (!src) {
			throw new Error('Project does not exist');
		}

		const srcCopy = { ...src.dataValues };
		delete srcCopy.id;

		const project = await ExampleProject.create({
			...srcCopy,
			name: src.name + ' copy',
			order: !isNaN(src.order) ? src.order + 1 : -1,
		});

		// Copy the state and config files
		const srcStateUrl = src.stateUrl;
		const destStateUrl = `examples/${project.id}/state.json`;
		await storageService.copy(srcStateUrl, destStateUrl);
		project.stateUrl = destStateUrl;

		if (req.body.configUrl) {
			const srcConfigUrl = src.configUrl;
			const destConfigUrl = `examples/${project.id}/config.json`;
			await storageService.copy(srcConfigUrl, destConfigUrl);
			project.configUrl = destConfigUrl;
		}

		await project.save();

		return res.send(project);
	} catch (err) {
		return res.status(400).send({ status: 'error', message: err.message });
	}
};

exports.createProjectFromExampleProject = async (req, res) => {
	try {
		const src = await ExampleProject.findOne({ where: { id: req.params.id } });
		if (!src) {
			throw new Error('Project does not exist');
		}

		const dest = await Project.create({
			name: src.name + ' copy',
			userId: req.user.id,
      category:"recent"
		});

		const uid = req.user.id;
		if (src.configUrl) {
			const srcConfigUrl = src.configUrl;
			const destConfigUrl = `projects/${uid}/${dest.id}/config.json`;

			await storageService.copy(srcConfigUrl, destConfigUrl);
			dest.configUrl = destConfigUrl;
		}
		if (src.stateUrl) {
			const srcStateUrl = src.stateUrl;
			const destStateUrl = `projects/${uid}/${dest.id}/state.json`;

			await storageService.copy(srcStateUrl, destStateUrl);
			dest.stateUrl = destStateUrl;
		}
		await dest.save();
		return res.send({ status: 'success', id: dest.id, name: dest.name });
	} catch (err) {
		return res.status(500).send({ status: 'error', message: err.message });
	}
};

exports.deleteExampleProject = async (req, res) => {
  if (!req.params.id) return res.status(400).send('Project Id missing');

  const project = await ExampleProject.findOne({ where: { id: req.params.id } });
  if (!project) {
    return res.status(404).send('project does not exist');
  }

	project.stateUrl && (await storageService.delete(project.stateUrl));
  if (project.configUrl) {
    await storageService.delete(project.configUrl);
  }
  await ExampleProject.destroy({ where: { id: req.params.id } });
  return res.send({ status: "success" });
};

exports.getGeometryList = async (req, res) => {
  try {
    const geometries = await Geometry.findAll({
      where: { parentId: { [Op.ne]: -1 } },
      order: [["name", "ASC"]],
    })
    let json = {}
    await buildList(geometries, 0, json, "Geometry")

    return res.send(json)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getMyGeometry = async (req, res) => {
  try {
    let result = []
    const geometries = await req.user.getGeometries()
    const folders = await req.user.getFolders({
      where: { type: "geometry" },
      order: [["name", "ASC"]],
    })
    const where = {
      where: { userId: req.user.id },
    };
    if(req.params && req.params.pId){
      where.projectId = req.params.pId
    }
    const userGeometries = await UserGeometry.findAll(where)

    const getItem = (userGeometry) => {
      const geometry = geometries.find((x) => x.id == userGeometry.geometryId)
      return {
        id: userGeometry.id,
        geometryId: geometry.id,
        projectId: userGeometry.projectId,
        name: geometry.name,
        ext: path.extname(geometry.url),
        thumbUrl:
          geometry.parentId == -1 ? geometry.thumbUrl : storageService.getUrl(geometry.thumbUrl),
        url: storageService.getUrl(geometry.url),
      }
    }

    const recentItems = userGeometries.filter((x) => x.folderId == 0)
    result.push({
      id: 0,
      name: "Recent",
      items: recentItems.map(getItem),
    })

    folders.map((folder) => {
      result.push({
        id: folder.id,
        name: folder.name,
        items: userGeometries.filter((x) => x.folderId == folder.id).map(getItem),
      })
    })
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyGeometryAdd = async (req, res) => {
  try {
    const geometry = await Geometry.findOne({ where: { id: req.body.id } })
    const userGeometry = await UserGeometry.create({
      userId: req.user.id,
      projectId: req.body.projectId,
      geometryId: geometry.id,
      folderId: req.body.folderId,
    })

    return res.send({
      id: userGeometry.id,
      geometryId: geometry.id,
      name: geometry.name,
      ext: path.extname(geometry.url),
      thumbUrl: storageService.getUrl(geometry.thumbUrl),
      url: storageService.getUrl(geometry.url),
    })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyGeometryDelete = async (req, res) => {
  try {
    const userGeometry = await UserGeometry.findOne({
      where: { id: req.body.id },
    })
    const geometry = await Geometry.findOne({
      where: { id: userGeometry.geometryId },
    })

    await userGeometry.destroy()

    if (geometry.parentId == -1) {
      await geometry.destroy()
    }

    return res.send({ message: "deleted" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyGeometryUpdate = async (req, res) => {
  try {
    await UserGeometry.update(req.body, {
      where: { id: req.params.id },
    })

    return res.send({ message: "updated" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyGeometryUpload = async (req, res) => {
  try {
    let files = []

    for (const file of req.files) {
      const geometry = await Geometry.create({
        name: file.originalname.split(".").slice(0, -1).join("."),
        url: file.key,
        thumbUrl: "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/gallery/geometry.jpg",
        parentId: -1,
      })
      const userGeometry = await UserGeometry.create({
        userId: req.user.id,
        projectId: req.body.projectId,
        geometryId: geometry.id,
        folderId: req.body.folderId,
      })
      files.push({
        name: file.originalname,
        id: userGeometry.id,
        geometryId: geometry.id,
      })
    }
    res.send({ status: "success", files: files })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getImageList = async (req, res) => {
  try {
    const images = await Image.findAll({
      where: { parentId: { [Op.ne]: -1 } },
      order: [["name", "ASC"]],
    })
    let json = {}
    await buildList(images, 0, json, "Image")

    return res.send(json)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getMyImage = async (req, res) => {
  try {
    let result = []
    const images = await req.user.getImages()
    const folders = await req.user.getFolders({
      where: { type: "image" },
      order: [["name", "ASC"]],
    })
    const where = {
      where: { userId: req.user.id },
    };
    if(req.params && req.params.pId){
      where.projectId = req.params.pId
    }
    const userImages = await UserImage.findAll(where)

    const getItem = (userImage) => {
      const image = images.find((x) => x.id == userImage.imageId)
      return {
        id: userImage.id,
        imageId: image.id,
        projectId: userImage.projectId,
        name: image.name,
        url: storageService.getUrl(image.url),
      }
    }

    const recentItems = userImages.filter((x) => x.folderId == 0)
    result.push({
      id: 0,
      name: "Recent",
      items: recentItems.map(getItem),
    })

    folders.map((folder) => {
      result.push({
        id: folder.id,
        name: folder.name,
        items: userImages.filter((x) => x.folderId == folder.id).map(getItem),
      })
    })
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyImageAdd = async (req, res) => {
  try {
    const image = await Image.findOne({ where: { id: req.body.id } })
    const userImage = await UserImage.create({
      userId: req.user.id,
      projectId: req.body.projectId,
      imageId: image.id,
      folderId: req.body.folderId,
    })

    return res.send({
      id: userImage.id,
      imageId: image.id,
      url: storageService.getUrl(image.url),
    })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyImageUpdate = async (req, res) => {
  try {
    await UserImage.update(req.body, {
      where: { id: req.params.id },
    })

    return res.send({ message: "updated" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyImageDelete = async (req, res) => {
  try {
    const userImage = await UserImage.findOne({
      where: { id: req.body.id },
    })
    const image = await Image.findOne({
      where: { id: userImage.imageId },
    })

    await userImage.destroy()

    if (image.parentId == -1) {
      await image.destroy()
    }

    return res.send({ message: "deleted" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyImageUpload = async (req, res) => {
  try {
    let files = []
    for (const file of req.files) {
      const image = await Image.create({
        name: file.originalname.split(".").slice(0, -1).join("."),
        url: file.key,
        parentId: -1,
      })
      const userImage = await UserImage.create({
        userId: req.user.id,
        projectId: req.body.projectId,
        imageId: image.id,
      })
      files.push({
        name: file.originalname,
        id: userImage.id,
        imageId: image.id,
      })
    }
    res.send({ status: "success", files: files })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getAppImage = async (req, res) => {
  try {
    let result = [{ id: 0, name: "Recent", items: [] }]
    const ids = Array.isArray(req.query.id) ? req.query.id.map((i) => parseInt(i)) : [req.query.id]
    const images = await sequelize.query(
      `
      SELECT "UserImages".*, "Images".name, "Images".url
      FROM "UserImages"
      INNER JOIN "Images" ON "UserImages"."imageId" = "Images"."id"
      WHERE "UserImages"."id" in (${ids.join(",")})
      ORDER BY "Images"."id" ASC`,
      { type: QueryTypes.SELECT }
    )
    for (let image of images) {
      result[0].items.push({
        id: image.id,
        name: image.name,
        url: storageService.getUrl(image.url),
      })
    }
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getAudioList = async (req, res) => {
  try {
    const audios = await Audio.findAll({ order: [["name", "ASC"]] })

    let json = {}
    buildList(audios, 0, json, "Audio")

    return res.send(json)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getMyAudio = async (req, res) => {
  try {
    let result = []
    const audios = await req.user.getAudios()
    const folders = await req.user.getFolders({
      where: { type: "audio" },
      order: [["name", "ASC"]],
    })
    const where = {
      where: { userId: req.user.id },
    };
    if(req.params && req.params.pId){
      where.projectId = req.params.pId
    }
    const userAudios = await UserAudio.findAll(where)

    const getItem = (userAudio) => {
      const audio = audios.find((a) => a.id == userAudio.audioId)
      return {
        id: userAudio.id,
        audioId: audio.id,
        projectId: userAudio.projectId,
        name: audio.name,
        duration: audio.duration,
        url: storageService.getUrl(audio.url),
      }
    }

    const recentItems = userAudios.filter((x) => x.folderId == 0)
    result.push({
      id: 0,
      name: "Recent",
      items: recentItems.map(getItem),
    })

    folders.map((folder) => {
      result.push({
        id: folder.id,
        name: folder.name,
        items: userAudios.filter((x) => x.folderId == folder.id).map(getItem),
      })
    })
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyAudioAdd = async (req, res) => {
  try {
    const audio = await Audio.findOne({ where: { id: req.body.id } })
    const userAudio = await UserAudio.create({
      userId: req.user.id,
      projectId: req.body.projectId,
      audioId: audio.id,
      folderId: req.body.folderId,
    })

    return res.send({
      id: userAudio.id,
      audioId: audio.id,
      name: audio.name,
      duration: audio.duration,
      url: storageService.getUrl(audio.url),
      projectId: req.body.projectId,
    })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyAudioUpdate = async (req, res) => {
  try {
    await UserAudio.update(req.body, {
      where: { id: req.params.id },
    })

    return res.send({ message: "updated" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyAudioDelete = async (req, res) => {
  try {
    const userAudio = await UserAudio.findOne({
      where: { id: req.body.id },
    })
    const audio = await Audio.findOne({
      where: { id: userAudio.audioId },
    })

    await userAudio.destroy()

    if (audio.parentId == -1) {
      await audio.destroy()
    }

    return res.send({ message: "deleted" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyAudioUpload = async (req, res) => {
  try {
    let files = []
    for (const file of req.files) {
      const audio = await Audio.create({
        name: file.originalname,
        url: file.key,
        parentId: -1,
        duration: 0,
      })
      const userAudio = await UserAudio.create({
        userId: req.user.id,
        projectId: req.body.projectId,
        audioId: audio.id,
      })
      files.push({
        name: file.originalname,
        id: userAudio.id,
        audioId: audio.id,
      })
    }
    res.send({ status: "success", files: files })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getAppAudio = async (req, res) => {
  try {
    let result = [{ id: 0, name: "Recent", items: [] }]
    const ids = Array.isArray(req.query.id) ? req.query.id.map((i) => parseInt(i)) : [req.query.id]
    const audios = await sequelize.query(
      `
      SELECT "UserAudios".*, "Audios".name, "Audios".url
      FROM "UserAudios"
      INNER JOIN "Audios" ON public."UserAudios"."audioId" = public."Audios"."id"
      WHERE "UserAudios"."id" in (${ids.join(",")})
      ORDER BY "Audios"."id" ASC`,
      { type: QueryTypes.SELECT }
    )
    for (let audio of audios) {
      result[0].items.push({
        id: audio.id,
        name: audio.name,
        url: storageService.getUrl(audio.url),
      })
    }
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getMaterialList = async (req, res) => {
  try {
    const materials = await Material.findAll({ order: [["name", "ASC"]] })
    let json = {}
    buildList(materials, 0, json, "Material")

    return res.send(json)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getMyMaterial = async (req, res) => {
  try {
    let result = []
    const materials = await req.user.getMaterials()
    const folders = await req.user.getFolders({
      where: { type: "material" },
      order: [["name", "ASC"]],
    })
    const where = {
      where: { userId: req.user.id },
    };
    if(req.params && req.params.pId){
      where.projectId = req.params.pId
    }
    const userMaterials = await UserMaterial.findAll(where)

    const getItem = (userMaterial) => {
      const material = materials.find((m) => m.id == userMaterial.materialId)
      let urls = material.urls

      for (const type in urls) {
        urls[type] = storageService.getUrl(urls[type])
      }
      return {
        id: userMaterial.id,
        materialId: material.id,
        projectId: userMaterial.projectId,
        name: material.name,
        thumbUrl: storageService.getUrl(material.thumbUrl),
        urls: urls,
      }
    }

    const recentItems = userMaterials.filter((x) => x.folderId == 0)
    result.push({
      id: 0,
      name: "Recent",
      items: recentItems.map(getItem),
    })

    folders.map((folder) => {
      result.push({
        id: folder.id,
        name: folder.name,
        items: userMaterials.filter((x) => x.folderId == folder.id).map(getItem),
      })
    })
    res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyMaterialAdd = async (req, res) => {
  try {
    const material = await Material.findOne({ where: { id: req.body.id } })
    const userMaterial = await UserMaterial.create({
      userId: req.user.id,
      projectId: req.body.projectId,
      materialId: material.id,
      folderId: req.body.folderId,
    })

    let urls = material.urls
    for (const type in urls) {
      urls[type] = storageService.getUrl(urls[type])
    }

    return res.send({
      id: userMaterial.id,
      materialId: material.id,
      name: material.name,
      thumbUrl: storageService.getUrl(material.thumbUrl),
      urls: urls,
    })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyMaterialUpdate = async (req, res) => {
  try {
    await UserMaterial.update(req.body, {
      where: { id: req.params.id },
    })

    return res.send({ message: "updated" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyMaterialDelete = async (req, res) => {
  try {
    await UserMaterial.destroy({
      where: { id: req.body.id },
    })

    return res.send({ message: "deleted" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyMaterialUpload = async (req, res) => {
  try {
    let files = []
    for (const file of req.files) {
      const geometry = await Geometry.create({
        name: file.originalname.split(".").slice(0, -1).join("."),
        url: file.key,
        thumbUrl: "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/gallery/geometry.jpg",
        parentId: -1,
      })
      await req.user.addGeometry(geometry)
      files.push({ name: file.originalname, id: geometry.id })
    }
    res.send({ status: "success", files: files })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getAppMaterial = async (req, res) => {
  try {
    let result = [{ id: 0, name: "Recent", items: [] }]
    const ids = Array.isArray(req.query.id) ? req.query.id.map((i) => parseInt(i)) : [req.query.id]
    const materials = await sequelize.query(
      `
      SELECT "UserMaterials".*, "Materials".name, "Materials".urls
      FROM "UserMaterials"
      INNER JOIN "Materials" ON public."UserMaterials"."materialId" = public."Materials"."id"
      WHERE "UserMaterials"."id" in (${ids.join(",")})
      ORDER BY "Materials"."id" ASC`,
      { type: QueryTypes.SELECT }
    )
    for (let material of materials) {
      let urls = material.urls

      for (const type in urls) {
        urls[type] = storageService.getUrl(urls[type])
      }

      result[0].items.push({
        id: material.id,
        name: material.name,
        urls: urls,
      })
    }
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getMyVideo = async (req, res) => {
  try {
    let result = []
    const videos = await req.user.getVideos()
    const folders = await req.user.getFolders({
      where: { type: "video" },
      order: [["name", "ASC"]],
    })
    const where = {
      where: { userId: req.user.id },
    };
    if(req.params && req.params.pId){
      where.projectId = req.params.pId
    }
    const userVideos = await UserVideo.findAll(where)

    const getItem = (userVideo) => {
      const video = videos.find((v) => v.id == userVideo.videoId)
      return {
        id: userVideo.id,
        videoId: video.id,
        projectId: userVideo.projectId,
        name: video.name,
        url: storageService.getUrl(video.url),
      }
    }

    const recentItems = userVideos.filter((x) => x.folderId == 0)
    result.push({
      id: 0,
      name: "Recent",
      items: recentItems.map(getItem),
    })

    folders.map((folder) => {
      result.push({
        id: folder.id,
        name: folder.name,
        items: userVideos.filter((x) => x.folderId == folder.id).map(getItem),
      })
    })
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyVideoAdd = async (req, res) => {
  try {
    const video = await Video.findOne({ where: { id: req.body.id } })
    const userVideo = await UserVideo.create({
      userId: req.user.id,
      projectId: req.body.projectId,
      videoId: video.id,
      folderId: req.body.folderId,
    })

    return res.send({
      id: userVideo.id,
      name: video.name,
      url: storageService.getUrl(video.url),
    })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyVideoUpdate = async (req, res) => {
  try {
    await UserVideo.update(req.body, {
      where: { id: req.params.id },
    })

    return res.send({ message: "updated" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyVideoDelete = async (req, res) => {
  try {
    await UserVideo.destroy({ where: { id: req.body.id } })

    return res.send({ message: "deleted" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyVideoUpload = async (req, res) => {
  try {
    let files = []
    for (const file of req.files) {
      var savename = file.originalname.split(".").slice(0, -1).join(".")
      const video = await Video.create({
        name: savename,
        url: file.key,
      })
      const userVideo = await UserVideo.create({
        userId: req.user.id,
        projectId: req.body.projectId,
        videoId: video.id,
      })
      files.push({ name: file.originalname, videoId: video.id, id: userVideo.id })
      //files.push({ name: savename, videoId: video.id, id: userVideo });
    }
    res.send({ status: "success", files: files })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getAppVideo = async (req, res) => {
  try {
    let result = [{ id: 0, name: "Recent", items: [] }]
    const ids = Array.isArray(req.query.id) ? req.query.id.map((i) => parseInt(i)) : [req.query.id]
    const videos = await sequelize.query(
      `
      SELECT "UserVideos".*, "Videos".name, "Videos".url
      FROM "UserVideos"
      INNER JOIN "Videos" ON public."UserVideos"."videoId" = public."Videos"."id"
      WHERE "UserVideos"."id" in (${ids.join(",")})
      ORDER BY "Videos"."id" ASC`,
      { type: QueryTypes.SELECT }
    )
    for (let video of videos) {
      result[0].items.push({
        id: video.id,
        name: video.name,
        url: storageService.getUrl(video.url),
      })
    }
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getEnvironmentList = async (req, res) => {
  try {
    let result = []
    const environments = await Environment.findAll({
      where: { parentId: { [Op.ne]: -1 } },
      order: [["name", "ASC"]],
    })

    for (let env of environments) {
      result.push({
        id: env.id,
        name: env.name,
        thumbUrl: storageService.getUrl(env.thumbUrl),
      })
    }
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getMyEnvironment = async (req, res) => {
  try {
    let result = []
    const environments = await req.user.getEnvironments()
    const folders = await req.user.getFolders({
      where: { type: "environment" },
      order: [["name", "ASC"]],
    })
    const where = {
      where: { userId: req.user.id },
    };
    if(req.params && req.params.pId){
      where.projectId = req.params.pId
    }
    const userEnvironments = await UserEnvironment.findAll(where)

    const getItem = (userEnvironment) => {
      const environment = environments.find((e) => e.id == userEnvironment.environmentId)
      return {
        id: userEnvironment.id,
        environmentId: environment.id,
        name: environment.name,
        projectId: userEnvironment.projectId,
        thumbUrl: storageService.getUrl(environment.thumbUrl),
        url: storageService.getUrl(environment.url),
      }
    }

    const recentItems = userEnvironments.filter((x) => x.folderId == 0)
    result.push({
      id: 0,
      name: "Recent",
      items: recentItems.map(getItem),
    })

    folders.map((folder) => {
      result.push({
        id: folder.id,
        name: folder.name,
        items: userEnvironments.filter((x) => x.folderId == folder.id).map(getItem),
      })
    })
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyEnvironmentAdd = async (req, res) => {
  try {
    const environment = await Environment.findOne({
      where: { id: req.body.id },
    })
    const userEnvironment = await UserEnvironment.create({
      userId: req.user.id,
      projectId: req.body.projectId,
      environmentId: environment.id,
      folderId: req.body.folderId,
    })

    return res.send({
      id: userEnvironment.id,
      environmentId: environment.id,
      name: environment.name,
      thumbUrl: storageService.getUrl(environment.thumbUrl),
      url: storageService.getUrl(environment.url),
    })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyEnvironmentUpdate = async (req, res) => {
  try {
    await UserEnvironment.update(req.body, {
      where: { id: req.params.id },
    })

    return res.send({ message: "updated" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyEnvironmentDelete = async (req, res) => {
  try {
    await UserEnvironment.destroy({
      where: { id: req.body.id },
    })

    return res.send({ message: "deleted" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyEnvironmentUpload = async (req, res) => {
  try {
    let files = []
    for (const file of req.files) {
      const geometry = await Geometry.create({
        name: file.originalname.split(".").slice(0, -1).join("."),
        url: file.key,
        thumbUrl: "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/gallery/geometry.jpg",
        parentId: -1,
      })
      await req.user.addGeometry(geometry)
      files.push({ name: file.originalname, id: geometry.id })
    }
    res.send({ status: "success", files: files })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getAppEnvironment = async (req, res) => {
  try {
    let result = [{ id: 0, name: "Recent", items: [] }]
    const ids = Array.isArray(req.query.id) ? req.query.id.map((i) => parseInt(i)) : [req.query.id]
    const environments = await sequelize.query(
      `
      SELECT "UserEnvironments".*, "Environments".name, "Environments".url
      FROM "UserEnvironments"
      INNER JOIN "Environments" ON public."UserEnvironments"."environmentId" = public."Environments"."id"
      WHERE "UserEnvironments"."id" in (${ids.join(",")})
      ORDER BY "Environments"."id" ASC`,
      { type: QueryTypes.SELECT }
    )
    for (let env of environments) {
      result[0].items.push({
        id: env.id,
        name: env.name,
        url: storageService.getUrl(env.url),
      })
    }
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getMyFont = async (req, res) => {
  try {
    const fonts = await req.user.getFonts({
      where: { projectId: req.params.projectId },
    })
    const result = fonts.map((font) => ({
      id: font.id,
      name: font.name,
      projectId: font.projectId,
      url: storageService.getUrl(font.url),
    }))
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyFontUpload = async (req, res) => {
  try {
    let files = []
    for (const file of req.files) {
      const font = await Font.create({
        name: file.originalname.split(".").slice(0, -1).join("."),
        url: file.key,
        userId: req.user.id,
        projectId: req.body.projectId,
      })
      files.push({ name: file.originalname, id: font.id })
    }
    res.send({ status: "success", files: files })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getAppFont = async (req, res) => {
  try {
    let result = []
    const ids = Array.isArray(req.query.id) ? req.query.id.map((i) => parseInt(i)) : [req.query.id]
    const fonts = await Font.findAll({ where: { id: ids } })
    for (let font of fonts) {
      result.push({
        id: font.id,
        name: font.name,
        url: storageService.getUrl(font.url),
      })
    }
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getAnimationList = async (req, res) => {
  try {
    const animations = await Animation.findAll({
      where: { parentId: { [Op.ne]: -1 } },
      order: [["name", "ASC"]],
    })
    let json = {}
    await buildList(animations, 0, json, "Animation")

    return res.send(json)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getMyAnimation = async (req, res) => {
  try {
    let result = []
    const animations = await req.user.getAnimations()
    const folders = await req.user.getFolders({
      where: { type: "animation" },
      order: [["name", "ASC"]],
    })
    const where = {
      where: { userId: req.user.id },
    };
    if(req.params && req.params.pId){
      where.projectId = req.params.pId
    }
    const userAnimations = await UserAnimation.findAll(where)

    const getItem = (userAnimation) => {
      const animation = animations.find(
        (i) => i.id == userAnimation.animationId
      );
	  if (!animation) {
		  return null;
	  }
      return {
        id: userAnimation.id,
        animationId: animation.id,
        projectId: userAnimation.projectId,
        name: animation.name,
        url: storageService.getUrl(animation.url),
      }
    }

    const recentItems = userAnimations.filter((x) => x.folderId == 0)
    result.push({
      id: 0,
      name: "Recent",
      items: recentItems.map(getItem).filter((item) => !!item),
    });

    folders.map((folder) => {
      result.push({
        id: folder.id,
        name: folder.name,
        items: userAnimations.filter((x) => x.folderId == folder.id).map(getItem),
      })
    })
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyAnimationAdd = async (req, res) => {
  try {
    const animation = await Animation.findOne({ where: { id: req.body.id } })
    const userAnimation = await UserAnimation.create({
      userId: req.user.id,
      projectId: req.body.projectId,
      animationId: animation.id,
      folderId: req.body.folderId,
    })

    return res.send({
      id: userAnimation.id,
      animationId: animation.id,
      name: animation.name,
      url: storageService.getUrl(animation.url),
    })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyAnimationUpdate = async (req, res) => {
  try {
    await UserAnimation.update(req.body, {
      where: { id: req.params.id },
    })

    return res.send({ message: "updated" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyAnimationDelete = async (req, res) => {
  try {
    const userAnimation = await UserAnimation.findOne({
      where: { id: req.body.id },
    })
    const animation = await Animation.findOne({
      where: { id: userAnimation.animationId },
    })

    await userAnimation.destroy()

    if (animation.parentId == -1) {
      await animation.destroy()
    }

    return res.send({ message: "deleted" })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.postMyAnimationUpload = async (req, res) => {
  try {
    let files = []
    for (const file of req.files) {
      const animation = await Animation.create({
        name: file.originalname.split(".").slice(0, -1).join("."),
        url: file.key,
        parentId: -1,
      })
      const userAnimation = await UserAnimation.create({
        userId: req.user.id,
        projectId: req.body.projectId,
        animationId: animation.id,
      })
      files.push({
        name: file.originalname,
        id: userAnimation.id,
        animationId: animation.id,
      })
    }
    res.send({ status: "success", files: files })
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}

exports.getAppAnimation = async (req, res) => {
  try {
    let result = [{ id: 0, name: "Recent", items: [] }]
    const ids = Array.isArray(req.query.id) ? req.query.id.map((i) => parseInt(i)) : [req.query.id]
    const animations = await sequelize.query(
      `
      SELECT "UserAnimations".*, "Animations".name, "Animations".url
      FROM "UserAnimations"
      INNER JOIN "Animations" ON public."UserAnimations"."animationId" = public."Animations"."id"
      WHERE "UserAnimations"."id" in (${ids.join(",")})
      ORDER BY "Animations"."id" ASC`,
      { type: QueryTypes.SELECT }
    )
    for (let animation of animations) {
      result[0].items.push({
        id: animation.id,
        name: animation.name,
        url: storageService.getUrl(animation.url),
      })
    }
    return res.send(result)
  } catch (err) {
    return res.send({ status: "error", message: err.message })
  }
}
