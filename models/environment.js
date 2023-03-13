'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Environment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.User, {
        through: "UserEnvironments",
        as: "users",
        foreignKey: "environmentId",
        otherKey: "userId"
      });
    }
  };
  Environment.init({
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    thumbUrl: DataTypes.STRING,
    parentId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Environment',
  });
  return Environment;
};
