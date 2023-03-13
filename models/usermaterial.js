'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserMaterial extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  UserMaterial.init({
    userId: DataTypes.INTEGER,
    materialId: DataTypes.INTEGER,
    projectId: DataTypes.INTEGER,
    folderId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UserMaterial',
  });
  return UserMaterial;
};