var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/cool', function(req, res, next) {
  res.render('cool', { title: 'Pizza' });
});

router.get('/syncer', function(req, res, next) {
  res.render('syncer');
});

module.exports = router;
