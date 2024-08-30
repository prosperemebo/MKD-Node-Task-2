var express = require('express');
var timeUtils = require('../utils/time');
var weatherUtils = require('../utils/weather');
var xmlbuilder = require('xmlbuilder2');
var uuid = require('uuid');
const path = require('path');
var multer = require('multer');

var { Op } = require('sequelize');
var { Airport, Analytic, Image } = require('../models');
var { analyticsRateLimiter } = require('../utils/rate-limiter');
var { getPopularPosts } = require('../utils/reddit');

var router = express.Router();

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuid.v4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

const uploadUserPhoto = upload.single('image');

/* GET home page. */
router.get('/', async function (req, res, next) {
  // if (!req.session.authenticated) {
  //   return res.redirect('/2fa/setup');
  // } 

  try {
    // Timezones
    var { london, est, nigeria, pakistan } = timeUtils.getTimezones();

    var nigeriaTime = timeUtils.formatTime(nigeria);
    var pakistanTime = timeUtils.formatTime(pakistan);
    var londonTime = timeUtils.formatTime(london);
    var estTime = timeUtils.formatTime(est);
    
    // Weather
    var weatherData = await weatherUtils.getWeather(req.ip);
    var condition = weatherData?.current?.condition || 'Error';

    var weatherIcon = condition.icon ? `https:${condition.icon}` : '/images/weather-error.webp';
    var temperature = weatherData?.current?.temp_c || '0.00';

    // Analytics
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
      weatherError: !weatherData,
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

    if (!weatherData) {
      var response = {
        status: 'fail',
        message: 'Unable to get weather data at this time!'
      };
  
      res.status(500).json(response);  
    }

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
      var response = {
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

    var response = {
      status: 'fail',
      message: 'An error occurred while fetching posts!',
    };

    res.status(500).json(response);
  }
});

router.post('/calculate-coins', (req, res) => {
  var { amount } = req.body;

  if (typeof amount !== 'number' || amount < 0) {
    var response = {
      status: 'fail',
      message: 'Invalid amount. Please enter a valid number.',
    };

    return res.status(400).json(response);
  }

  var denominations = [
    { name: '$20 bill', value: 20.0 },
    { name: '$10 bill', value: 10.0 },
    { name: '$5 bill', value: 5.0 },
    { name: '$1 bill', value: 1.0 },
    { name: '25 cent', value: 0.25 },
    { name: '10 cent', value: 0.1 },
    { name: '5 cent', value: 0.05 },
    { name: '1 cent', value: 0.01 },
  ];

  let remainingAmount = amount;
  var result = [];

  denominations.forEach((denomination) => {
    var count = Math.floor(remainingAmount / denomination.value);

    if (count > 0) {
      result.push(`${count} X ${denomination.name}${count > 1 ? 's' : ''}`);

      remainingAmount = (remainingAmount - count * denomination.value).toFixed(
        2
      );
    }
  });

  var response = {
    status: 'success',
    data: result,
  };

  res.status(200).json(response);
});


router.post('/images/upload', uploadUserPhoto, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No file uploaded!',
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const image = await Image.create({ imageUrl });

    const response = {
      status: 'success',
      message: 'Image uploaded successfully!',
      data: image,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);

    const response = {
      status: 'fail',
      message: 'An error occurred while uploading the image!',
    };

    res.status(500).json(response);
  }
});

router.get('/images/recent', async (req, res) => {
  try {
    var imageData = await Image.findOne({
      order: [['createdAt', 'DESC']],
    });

    if (imageData) {
      var response = {
        status: 'success',
        data: imageData,
      };

      res.status(200).json(response);
    } else {
      var response = {
        status: 'success',
        message: 'No image found',
        data: null,
      };

      res.status(404).send(response);
    }
  } catch (error) {
    console.error('Error:', error);

    var response = {
      status: 'fail',
      message: 'An error occurred while fetching the image!',
    };

    res.status(500).json(response);
  }
});

module.exports = router;
