var express = require('express');
var { Chat } = require('../models');
var { pubClient, dataClient } = require('../services/redisService');
var { body, validationResult } = require('express-validator');

var router = express.Router();
var CHATS_KEY = 'mkd_chat_messages_6';

router.get('/room', async (req, res, next) => {
  try {
    res.render('chatroom', {
      title: 'MKD Chatroom',
    });
  } catch (error) {
    console.error('Error fetching data from API:', error);
    next(error);
  }
});

router.post(
  '/send',
  [
    body('message')
      .trim()
      .escape()
      .isLength({ min: 1 })
      .withMessage('Message is required and cannot be empty or whitespace.'),
  ],
  async (req, res) => {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: errors.array()[0].msg
      });
    }


    try {
      var { message } = req.body;

      if (!message.trim()) {
        return res.status(400).json({
          message: 'Message is required and cannot be empty or whitespace.',
        });
      }

      await dataClient.xAdd(CHATS_KEY, '*', { message });
      await pubClient.publish('mkd_chat_updates', message);

      res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
      console.error('Error adding chat message:', error);

      if (error.message.includes('ECONNREFUSED')) {
        res.status(503).json({
          message:
            'Failed to connect to the data service. Please try again later.',
        });
      } else {
        res
          .status(500)
          .json({ message: 'Unexpected server error while sending message.' });
      }
    }
  }
);

router.get('/all', async (req, res) => {
  try {
    var chats = await dataClient.xRead(
      {
        key: CHATS_KEY,
        id: '0-100',
      },
      {
        count: 1000,
      }
    );

    var messages = chats.filter((chat) => chat.name === CHATS_KEY);

    if (!messages.length) {
      var response = {
        status: 'fail',
        message: 'No messsages found',
      };

      res.status(500).json(response);
    }

    var response = {
      status: 'success',
      messages: messages[0].messages,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching messages:', error);

    if (error.message.includes('ECONNREFUSED')) {
      res.status(503).json({
        message:
          'Failed to connect to the data service. Please try again later.',
      });
    } else {
      res.status(500).json({
        message: 'Unexpected server error while fetching messages',
      });
    }
  }
});

router.post('/save', async (req, res) => {
  try {
    var chats = await dataClient.xRead(
      {
        key: CHATS_KEY,
        id: '0-100',
      },
      {
        count: 1000,
      }
    );

    var messages = chats.filter((chat) => chat.name === CHATS_KEY);

    if (!messages.length) {
      var response = {
        status: 'fail',
        message: 'No messsages found',
      };

      res.status(500).json(response);
    }

    await Chat.create({ chat_messages: JSON.stringify(messages[0].messages) });

    res.status(200).json({ message: 'Chat saved successfully!' });
  } catch (error) {
    console.error('Error saving chat:', error);

    if (error.message.includes('ECONNREFUSED')) {
      res.status(503).json({
        message:
          'Failed to connect to the database service. Please try again later.',
      });
    } else if (error.name === 'SequelizeValidationError') {
      res.status(400).json({
        message:
          'Validation error: ' + error.errors.map((e) => e.message).join(', '),
      });
    } else {
      res.status(500).json({
        message: 'Unexpected server error while saving chat.',
      });
    }
  }
});

router.get('/poll', async (req, res) => {
  try {
    var latestMessage = await dataClient.xRead(
      [
        {
          key: CHATS_KEY,
          id: '$',
        },
      ],
      {
        BLOCK: 2000,
        COUNT: 1,
      }
    );

    if (latestMessage) {
      return res.status(200).json({ newMessages: true });
    } else {
      return res.status(200).json({ newMessages: false });
    }
  } catch (error) {
    console.error('Error in pollMessages:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      res
        .status(503)
        .json({
          message:
            'Failed to connect to the data service for polling. Please try again later.',
        });
    } else {
      res
        .status(500)
        .json({
          message:
            'Unexpected server error while polling messages. Please contact support if the issue persists.',
        });
    }
  }
});

module.exports = router;
