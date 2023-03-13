'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
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
  Transaction.init({
    powerupId: DataTypes.STRING,
    paymentId: DataTypes.INTEGER,
    title: DataTypes.STRING,
    cost: DataTypes.INTEGER,
    subscriptionId: DataTypes.STRING,
    minusPlus: DataTypes.STRING,
    cycle: DataTypes.STRING,
    paymentTitle: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    date: DataTypes.DATEONLY
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};