var express = require('express');
var timeUtils = require('../utils/time');
var weatherUtils = require('../utils/weather');

const { Op } = require('sequelize');
var { Airport } = require('../models');

var router = express.Router();

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    var weatherData = await weatherUtils.getWeather(req.ip)

    var { london, est, nigeria, pakistan } = timeUtils.getTimezones();

    var condition = weatherData.current?.condition;

    var weatherIcon = `https:${condition.icon}`;
    var temperature = weatherData.current?.temp_c;

    var nigeriaTime = timeUtils.formatTime(nigeria);
    var pakistanTime = timeUtils.formatTime(pakistan);
    var londonTime = timeUtils.formatTime(london);
    var estTime = timeUtils.formatTime(est);

    res.render('index', {
      title: 'Express',
      weatherIcon,
      weatherDescription: condition?.text,
      temperature,
      nigeriaTime,
      pakistanTime,
      londonTime,
      estTime,
    });
  } catch (error) {
    console.error('Error fetching data from API:', error);
    next(error);
  }
});

router.get('/timezones', (req, res) => {
  var { london, est, nigeria, pakistan } = timeUtils.getTimezones();

  var response = {
    status: 'success',
    data: {
      london: london.toISOString(),
      est: est.toISOString(),
      nigeria: nigeria.toISOString(),
      pakistan: pakistan.toISOString(),
    },
  };

  res.json(response);
});

router.get('/weather', async function (req, res, next) {
  try {
    var weatherData = await weatherUtils.getWeather(req.ip)

    var response = {
      status: 'success',
      data: weatherData
    };
    

    res.json(response);
  } catch (error) {
    console.error('Error fetching data from API:', error);
    next(error);
  }
});

router.get('/airports', async (req, res) => {
  var searchQuery = req.query.search;

  if (!searchQuery || searchQuery.length < 3) {
    var response = {
      status: 'success',
      message: 'Found zero airports',
      count: 0,
      data: []
    }

    return res.json(response);
  }

  var results = await Airport.findAll({
    where: {
      name: {
        [Op.like]: `%${searchQuery}%`
      }
    },
    limit: 10
  });

  var response = {
    status: 'success',
    message: `Found ${results.length} airports`,
    count: results.length,
    data: results
  }

  res.json(response);
});

module.exports = router;
