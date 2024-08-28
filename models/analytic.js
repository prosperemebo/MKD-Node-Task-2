'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Analytic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

   Analytic.init(
    {
      widget_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      browser_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      create_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Analytic',
      tableName: 'Analytics',
      timestamps: false,
    }
  );

  return Analytic;
};