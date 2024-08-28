'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Analytics', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      create_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      widget_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      browser_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Analytics');
  },
};
