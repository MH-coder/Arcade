'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class DeletedProject extends Model {
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
    DeletedProject.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: false,
            primaryKey: true
        },
        name: DataTypes.STRING,
        stateUrl: DataTypes.STRING,
        configUrl: DataTypes.STRING,
        thumbUrl: DataTypes.STRING,
        userId: DataTypes.INTEGER,
        deletedAt: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'DeletedProject',
    });
    return DeletedProject;
};
