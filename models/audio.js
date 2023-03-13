'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Audio extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.User, {
        through: "UserAudios",
        as: "users",
        foreignKey: "audioId",
        otherKey: "userId"
      });
    }
  };
  Audio.init({
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    duration: DataTypes.FLOAT,
    parentId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Audio',
  });
  return Audio;
};