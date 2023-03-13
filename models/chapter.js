'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Collection, { foreignKey: 'collectionId' });
    }
  };
  Chapter.init({
    title: DataTypes.STRING,
    video: DataTypes.STRING,
    order: DataTypes.INTEGER,
    collectionId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Chapter',
  });
  return Chapter;
};