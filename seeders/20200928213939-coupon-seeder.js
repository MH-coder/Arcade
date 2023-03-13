"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const coupons = [
      {
        active: true,
        code: "123-abc-xyz",
        onetime: true,
        price: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        active: true,
        code: "xyz-abc-123",
        onetime: true,
        price: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        active: true,
        code: "deal123",
        onetime: false,
        price: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        active: true,
        code: "abc-123-xyz",
        onetime: true,
        price: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    return queryInterface.bulkInsert("Coupons", coupons);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Coupons", null, {});
  },
};
