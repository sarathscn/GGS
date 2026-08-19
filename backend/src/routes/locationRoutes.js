const express = require('express');
const router = express.Router();
const { KERALA_CITIES } = require('../utils/constants');

router.get('/locations', (req, res) => {
  return res.status(200).json({ locations: KERALA_CITIES });
});

module.exports = router;
