const express = require('express');
const router = express.Router();
const legalController = require('../controllers/legalController');

router.get('/:type', legalController.getLegalContent);

module.exports = router;
