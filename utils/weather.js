var axios = require('axios');

async function getWeather(ip) {
  try {
    var apiUrl = 'https://api.weatherapi.com/v1/current.json';

    var params = {
      q: ip,
      lang: 'en',
      key: process.env.WEATHER_API_KEY,
    };

    var response = await axios.get(apiUrl, { params });

    return response.data;
  } catch (err) {
    console.log('ERROR:', err) 
  }
}

module.exports = { getWeather };
