'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Publish extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, { foreignKey: 'userId' });
    }
  };
  Publish.init({
    title: DataTypes.STRING, 
    slug: DataTypes.STRING,
    stateUrl: DataTypes.STRING,
    thumbUrl: DataTypes.STRING,
    portfolio: DataTypes.JSONB,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Publish',
    hooks: {
      beforeCreate: (publish, options) => {
        publish.portfolio = {
          active: false,
          title: null,
          description: null,
          order: 0
        }
      }
    }
  });
  return Publish;
};
