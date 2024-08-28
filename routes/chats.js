var express = require('express');
var { Chat } = require('../models');
var { pubClient, dataClient } = require('../services/redisService');

var router = express.Router();

router.get('/room', async (req, res) => {
  try {
    res.render('chatroom', {
      title: 'MKD Chatroom',
    });
  } catch (error) {
    console.error('Error fetching data from API:', error);
    next(error);
  }
});

router.post('/send', async (req, res) => {
  try {
    var { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    await dataClient.rPush('chat_messages', message);

    await pubClient.publish('chat_updates', message);

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error adding chat message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

router.get('/all', async (req, res) => {
  try {
    var messages = await dataClient.lRange('chat_messages', 0, -1);
    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

router.post('/save', async (req, res) => {
  try {
    var chatMessages = await dataClient.lRange('chat_messages', 0, -1);

    await Chat.create({ chat_messages: JSON.stringify(chatMessages) });

    res.status(200).json({ message: 'Chat saved successfully!' });
  } catch (error) {
    console.error('Error saving chat:', error);
    res.status(500).json({ message: 'Failed to save chat' });
  }
});

router.get('/poll', async (req, res) => {
  try {
    var latestMessage = await dataClient.lRange('chat_messages', -1, -1);

    if (latestMessage.length > 0) {
      return res.status(200).json({ newMessages: true });
    } else {
      return res.status(200).json({ newMessages: false });
    }
  } catch (error) {
    console.error('Error in pollMessages:', error);
    res.status(500).json({ message: 'Failed to poll messages' });
  }
});

module.exports = router;
