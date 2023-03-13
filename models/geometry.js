'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Geometry extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.User, {
        through: "UserGeometries",
        as: "users",
        foreignKey: "geometryId",
        otherKey: "userId"
      });
    }
  };
  Geometry.init({
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    thumbUrl: DataTypes.STRING,
    parentId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Geometry',
  });
  return Geometry;
};