'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Airports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id: {
        type: Sequelize.INTEGER
      },
      ident: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING,
        collate: 'utf8mb4_general_ci'
      },
      latitude_deg: {
        type: Sequelize.FLOAT
      },
      longitude_deg: {
        type: Sequelize.FLOAT
      },
      elevation_ft: {
        type: Sequelize.INTEGER
      },
      continent: {
        type: Sequelize.STRING
      },
      iso_country: {
        type: Sequelize.STRING
      },
      iso_region: {
        type: Sequelize.STRING
      },
      municipality: {
        type: Sequelize.STRING
      },
      scheduled_service: {
        type: Sequelize.STRING
      },
      gps_code: {
        type: Sequelize.STRING
      },
      iata_code: {
        type: Sequelize.STRING
      },
      local_code: {
        type: Sequelize.STRING
      },
      home_link: {
        type: Sequelize.STRING
      },
      wikipedia_link: {
        type: Sequelize.STRING
      },
      keywords: {
        type: Sequelize.TEXT('long')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('Airports', ['name'], {
      name: 'name_index',
      using: 'BTREE'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Airports');
  }
};