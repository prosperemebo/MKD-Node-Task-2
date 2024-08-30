var express = require('express');
var router = express.Router();
var speakeasy = require('speakeasy');
var qrcode = require('qrcode');

router.get('/setup', (req, res) => {
  var secret = speakeasy.generateSecret({ name: 'MKD Dashboard' });

  req.session.twoFactorSecret = secret.base32;

  qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
    if (err) {
      console.error('Error generating QR code:', err);

      res.render('2fa-setup', {
        title: '2FA Verification Failed',
        token: 'Failed to generate QR code. Please try again later.',
      });

      return res.status(500).json({ status: 'fail', message: 'Failed to generate QR code. Please try again later.' });
    }

    res.render('2fa-setup', {
      title: '2FA Verification',
      qrcode: data_url,
      token: secret.base32,
    });
  });
});

router.get('/verify', (req, res) => {
  if (!req.session.twoFactorSecret) {
    return res.redirect('/2fa/setup');
  }

  res.render('2fa-verify', {
    title: 'Verify 2FA Token',
  });
});

router.post('/verify', (req, res) => {
  var { token } = req.body;

  if (!req.session.twoFactorSecret) {
    return res.status(403).json({ status: 'fail', message: '2FA not set up. Please complete the setup first.' });
  }

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return res.status(400).json({ status: 'fail', message: 'Invalid token. Please enter a valid 2FA token.' });
  }

  var verified = speakeasy.totp.verify({
    secret: req.session.twoFactorSecret,
    encoding: 'base32',
    token,
  });

  if (verified) {
    req.session.authenticated = true;
    res.json({ status: 'success', message: '2FA verified!' });
  } else {
    res.status(401).json({ status: 'fail', message: 'Invalid 2FA token. Please try again.' });
  }
});


module.exports = router;
