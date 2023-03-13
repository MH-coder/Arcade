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
        "UserAnimations",
        "folderId",
        {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 0
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "UserAudios",
        "folderId",
        {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 0
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "UserEnvironments",
        "folderId",
        {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 0
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "UserGeometries",
        "folderId",
        {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 0
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "UserImages",
        "folderId",
        {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 0
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "UserMaterials",
        "folderId",
        {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 0
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "UserVideos",
        "folderId",
        {
          type: Sequelize.DataTypes.INTEGER,
          defaultValue: 0
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
      await queryInterface.removeColumn("UserAnimations", "folderId", { transaction });
      await queryInterface.removeColumn("UserAudios", "folderId", { transaction });
      await queryInterface.removeColumn("UserEnvironments", "folderId", { transaction });
      await queryInterface.removeColumn("UserGeometries", "folderId", { transaction });
      await queryInterface.removeColumn("UserImages", "folderId", { transaction });
      await queryInterface.removeColumn("UserMaterials", "folderId", { transaction });
      await queryInterface.removeColumn("UserVideos", "folderId", { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
