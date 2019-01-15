var express = require('express');
var router = express.Router();

var oauth2Controller = require('../controllers/oauth2Controller');

router.get('/', oauth2Controller.getCode);
router.get('/authCallback.*', oauth2Controller.handleAuthCallback);

module.exports = router;
