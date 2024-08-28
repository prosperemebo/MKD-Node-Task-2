const redis = require('redis');

const pubClient = redis.createClient();
const dataClient = redis.createClient();

pubClient.on('error', (err) => console.log('Redis Pub/Sub Error', err));
dataClient.on('error', (err) => console.log('Redis Data Error', err));

(async () => {
  try {
    await pubClient.connect();
    console.log('Pub/Sub client connected');

    await dataClient.connect();
    console.log('Data client connected');
  } catch (err) {
    console.error('Error connecting to Redis', err);
  }
})();

module.exports = {
  pubClient,
  dataClient,
};
