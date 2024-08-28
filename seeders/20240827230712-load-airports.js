'use strict';

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const airports = [];
    const airportsDump = path.resolve(__dirname, '../airports.csv');

    return new Promise((resolve, reject) => {
      fs.createReadStream(airportsDump)
        .pipe(csv())
        .on('data', (row) => {
          const airportData = {
            id: parseInt(row.id, 10),
            name: row.name,
            ident: row.ident,
            latitude_deg: row.latitude_deg ? parseFloat(row.latitude_deg) : null,
            longitude_deg: row.longitude_deg ? parseFloat(row.longitude_deg) : null,
            elevation_ft: row.elevation_ft ? parseInt(row.elevation_ft, 10) : null,
            continent: row.continent,
            iso_region: row.iso_region,
            wikipedia_link: row.wikipedia_link,
            iata_code: row.iata_code,
            municipality: row.municipality,
            scheduled_service: row.scheduled_service,
            iso_country: row.iso_country,
            gps_code: row.gps_code,
            type: row.type,
            local_code: row.local_code,
            home_link: row.home_link,
            keywords: row.keywords,
          }

          airports.push(airportData);
        })
        .on('end', () => {
          queryInterface.bulkInsert('Airports', airports)
            .then(resolve)
            .catch(reject);
        })
        .on('error', reject);
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Airports', null, {});
  }
};
