'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserEnvironment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  UserEnvironment.init({
    userId: DataTypes.INTEGER,
    environmentId: DataTypes.INTEGER,
    projectId: DataTypes.INTEGER,
    folderId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UserEnvironment',
  });
  return UserEnvironment;
};