'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  const uppercaseFirst = str => `${str[0].toUpperCase()}${str.substr(1)}`;

  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, { foreignKey: 'userId' });
      this.belongsTo(models.Card, { foreignKey: 'paymentableId', constraints: false });
    }
    getPaymentable(options) {
      if (!this.paymentableType) return Promise.resolve(null);
      const mixinMethodName = `get${uppercaseFirst(this.paymentableType)}`;
      return this[mixinMethodName](options);
    }
  };
  Payment.init({
    title: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    paymentableId: DataTypes.INTEGER,
    paymentableType: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Payment',
  });

  Payment.addHook("afterFind", findResult => {
    if (!Array.isArray(findResult)) findResult = [findResult];
    for (const instance of findResult) {
      if (instance.paymentableType === "card" && instance.card !== undefined) {
        instance.paymentable = instance.card;
      } else if (instance.paymentableType === "paypal" && instance.paypal !== undefined) {
        instance.paymentable = instance.paypal;
      }
      // To prevent mistakes:
      delete instance.card;
      delete instance.dataValues.card;
      delete instance.paypal;
      delete instance.dataValues.paypal;
    }
  });

  return Payment;
};