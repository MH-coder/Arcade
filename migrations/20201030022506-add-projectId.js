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
        "UserAudios",
        "projectId",
        {
          type: Sequelize.DataTypes.INTEGER,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "UserEnvironments",
        "projectId",
        {
          type: Sequelize.DataTypes.INTEGER,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "UserGeometries",
        "projectId",
        {
          type: Sequelize.DataTypes.INTEGER,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "UserMaterials",
        "projectId",
        {
          type: Sequelize.DataTypes.INTEGER,
        },
        { transaction }
      );
      await queryInterface.addColumn(
        "UserVideos",
        "projectId",
        {
          type: Sequelize.DataTypes.INTEGER,
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
      await queryInterface.removeColumn("UserAudios", "projectId", { transaction });
      await queryInterface.removeColumn("UserEnvironments", "projectId", { transaction });
      await queryInterface.removeColumn("UserGeometries", "projectId", { transaction });
      await queryInterface.removeColumn("UserMaterials", "projectId", { transaction });
      await queryInterface.removeColumn("UserVideos", "projectId", { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
