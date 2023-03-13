"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "Users",
        "profile",
        {
          type: Sequelize.DataTypes.JSONB,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Users",
        "passwordResetToken",
        {
          type: Sequelize.DataTypes.STRING,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Users",
        "passwordResetExpires",
        {
          type: Sequelize.DataTypes.DATE,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Users",
        "emailVerificationToken",
        {
          type: Sequelize.DataTypes.STRING,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Users",
        "emailVerified",
        {
          type: Sequelize.DataTypes.BOOLEAN,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Users",
        "googleId",
        {
          type: Sequelize.DataTypes.STRING,
          unique: true
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Users",
        "facebookId",
        {
          type: Sequelize.DataTypes.STRING,
          unique: true
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Users",
        "twitterId",
        {
          type: Sequelize.DataTypes.STRING,
          unique: true
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "Users",
        "tokens",
        {
          type: Sequelize.DataTypes.JSON,
        },
        { transaction }
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn("Users", "profile", { transaction });
      await queryInterface.removeColumn("Users", "passwordResetToken", { transaction });
      await queryInterface.removeColumn("Users", "passwordResetExpires", { transaction });
      await queryInterface.removeColumn("Users", "emailVerificationToken", { transaction });
      await queryInterface.removeColumn("Users", "emailVerified", { transaction });
      await queryInterface.removeColumn("Users", "googleId", { transaction });
      await queryInterface.removeColumn("Users", "facebookId", { transaction });
      await queryInterface.removeColumn("Users", "twitterId", { transaction });
      await queryInterface.removeColumn("Users", "tokens", { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
