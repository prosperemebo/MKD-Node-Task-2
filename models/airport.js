'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Airport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Airport.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    ident: DataTypes.STRING,
    type: DataTypes.STRING,
    name: {
      type: DataTypes.STRING,
      collate: 'utf8mb4_general_ci'
    },
    latitude_deg: DataTypes.FLOAT,
    longitude_deg: DataTypes.FLOAT,
    elevation_ft: DataTypes.INTEGER,
    continent: DataTypes.STRING,
    iso_country: DataTypes.STRING,
    iso_region: DataTypes.STRING,
    municipality: DataTypes.STRING,
    scheduled_service: DataTypes.STRING,
    gps_code: DataTypes.STRING,
    iata_code: DataTypes.STRING,
    local_code: DataTypes.STRING,
    home_link: DataTypes.STRING,
    wikipedia_link: DataTypes.STRING,
    keywords: {
      type: DataTypes.TEXT('long') 
    }
  }, {
    sequelize,
    modelName: 'Airport',
    timestamps: true,
  });

  return Airport;
};