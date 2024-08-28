var express = require('express');
var timeUtils = require('../utils/time');
var weatherUtils = require('../utils/weather');
var xmlbuilder = require('xmlbuilder2');

var { Op } = require('sequelize');
var { Airport, Analytic } = require('../models');
var { analyticsRateLimiter } = require('../utils/rate-limiter');
var { getPopularPosts } = require('../utils/reddit');

var router = express.Router();

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    var weatherData = await weatherUtils.getWeather(req.ip);

    var { london, est, nigeria, pakistan } = timeUtils.getTimezones();

    var condition = weatherData.current?.condition;

    var weatherIcon = `https:${condition.icon}`;
    var temperature = weatherData.current?.temp_c;

    var nigeriaTime = timeUtils.formatTime(nigeria);
    var pakistanTime = timeUtils.formatTime(pakistan);
    var londonTime = timeUtils.formatTime(london);
    var estTime = timeUtils.formatTime(est);

    var analyticsCount = await Analytic.count();

    res.render('index', {
      title: 'Express',
      weatherIcon,
      weatherDescription: condition?.text,
      analyticsCount,
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
    var weatherData = await weatherUtils.getWeather(req.ip);

    var response = {
      status: 'success',
      data: weatherData,
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
      data: [],
    };

    return res.json(response);
  }

  var results = await Airport.findAll({
    where: {
      name: {
        [Op.like]: `%${searchQuery}%`,
      },
    },
    limit: 10,
  });

  var response = {
    status: 'success',
    message: `Found ${results.length} airports`,
    count: results.length,
    data: results,
  };

  res.json(response);
});

router.post('/analytic', analyticsRateLimiter, async (req, res) => {
  var { widget_name, browser_type } = req.body;

  try {
    var analytic = await Analytic.create({
      widget_name,
      browser_type,
      create_at: new Date(),
    });

    var count = await Analytic.count();

    var response = {
      status: 'success',
      message: 'Log created successfully',
      data: analytic,
      count,
    };

    res.status(201).send(response);
  } catch (error) {
    var response = {
      status: 'fail',
      message: 'An error occurred!',
    };

    res.status(500).send(response);
  }
});

router.get('/analytic/count', async (req, res) => {
  try {
    var count = await Analytic.count();

    var response = {
      status: 'success',
      count,
    };

    res.status(200).send(response);
  } catch (error) {
    var response = {
      status: 'fail',
      message: 'An error occurred!',
    };

    res.status(500).send(response);
  }
});

router.get('/analytic/export', async (req, res) => {
  try {
    var analytics = await Analytic.findAll();

    var analyticsData = analytics.map((analytic) => ({
      analytic: {
        id: analytic.id,
        create_at: analytic.create_at.toISOString(),
        widget_name: analytic.widget_name,
        browser_type: analytic.browser_type,
      },
    }));

    var xmlData = xmlbuilder
      .create({ version: '1.0' })
      .ele('analytics')
      .ele(analyticsData)
      .end({ prettyPrint: true });

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics.xml');

    res.send(xmlData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).send('An error occurred during export, try again!');
  }
});

router.get('/posts', async (req, res) => {
  try {
    var postData = await getPopularPosts();

    if (!postData || !postData?.data || !postData?.data?.children) {
      const response = {
        status: 'fail',
        message: 'An error occurred while fetching posts!',
      };

      return res.status(500).json(response);
    }

    var evenPosts = postData.data.children.filter(
      (_, index) => index % 2 === 0
    );

    var topPosts = evenPosts.slice(0, 4).map((post) => ({
      title: post.data.title,
      url: post.data.url,
      author: post.data.author,
    }));

    var response = {
      status: 'success',
      data: topPosts,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching Reddit data:', error);

    const response = {
      status: 'fail',
      message: 'An error occurred while fetching posts!',
    };

    res.status(500).json(response);
  }
});

module.exports = router;
