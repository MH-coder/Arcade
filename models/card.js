'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Card extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Payment, {
        foreignKey: 'paymentableId',
        constraints: false,
        scope: {
          paymentableType: 'card'
        }
      });
    }
  };
  Card.init({
    paymentMethodId: DataTypes.STRING,
    last4: DataTypes.STRING,
    month: DataTypes.STRING,
    year: DataTypes.STRING,    
    extraData: DataTypes.JSONB
  }, {
    sequelize,
    modelName: 'Card',
  });
  return Card;
};