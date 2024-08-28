var axios = require('axios');

async function getPopularPosts(ip) {
  var apiUrl = 'https://www.reddit.com/r/programming.json';

  var response = await axios.get(apiUrl);

  return response.data;
}

module.exports = { getPopularPosts };
