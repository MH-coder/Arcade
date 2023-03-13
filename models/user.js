"use strict";

const bcrypt = require("bcrypt");
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Payment, { foreignKey: "userId" });
      this.hasMany(models.Folder, { foreignKey: "userId" });
      this.hasMany(models.Project, { foreignKey: "userId" });
      this.hasMany(models.Publish, { foreignKey: "userId" });
      this.hasMany(models.Font, { foreignKey: "userId" });
      this.belongsToMany(models.Audio, {
        through: "UserAudios",
        as: "audios",
        foreignKey: "userId",
        otherKey: "audioId",
      });
      this.belongsToMany(models.Environment, {
        through: "UserEnvironments",
        as: "environments",
        foreignKey: "userId",
        otherKey: "environmentId",
      });
      this.belongsToMany(models.Geometry, {
        through: "UserGeometries",
        as: "geometries",
        foreignKey: "userId",
        otherKey: "geometryId",
      });
      this.belongsToMany(models.Image, {
        through: "UserImages",
        as: "images",
        foreignKey: "userId",
        otherKey: "imageId",
      });
      this.belongsToMany(models.Material, {
        through: "UserMaterials",
        as: "materials",
        foreignKey: "userId",
        otherKey: "materialId",
      });
      this.belongsToMany(models.Video, {
        through: "UserVideos",
        as: "videos",
        foreignKey: "userId",
        otherKey: "videoId",
      });
      this.belongsToMany(models.Animation, {
        through: "UserAnimations",
        as: "animations",
        foreignKey: "userId",
        otherKey: "animationId",
      });
    }
  }
  User.init(
    {
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      stripeCustomerId: DataTypes.STRING,
      profile: DataTypes.JSONB,
      passwordResetToken: DataTypes.STRING,
      passwordResetExpires: DataTypes.DATE,
      emailVerificationToken: DataTypes.STRING,
      emailVerified: DataTypes.BOOLEAN,
      isActive: DataTypes.BOOLEAN,
      googleId: {
        type: DataTypes.STRING,
        unique: true,
      },
      facebookId: {
        type: DataTypes.STRING,
        unique: true,
      },
      twitterId: {
        type: DataTypes.STRING,
        unique: true,
      },
      tokens: DataTypes.ARRAY(DataTypes.JSONB),
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: (user, options) => {
          user.profile = {
            name: null,
            username: null,
            role: "User",
            membership: {
              active: false,
            },
            portfolio: {
              title: null,
              subTitle: null,
              backgroundUrl: null,
            },
          };
          user.tokens = [];
          if (user.changed("password")) {
            user.password = bcrypt.hashSync(user.password, 10);
          }
        },
        beforeUpdate: (user, options) => {
          if (user.changed("password")) {
            user.password = bcrypt.hashSync(user.password, 10);
          }
        },
      },
    }
  );

  User.prototype.comparePassword = function (candidatePassword, cb) {
    return bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      cb(err, isMatch);
    });
  };

  return User;
};
