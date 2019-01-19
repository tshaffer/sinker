var express = require('express');
var router = express.Router();

var oauth2Controller = require('../controllers/oauth2Controller');
var syncerHomeController = require('../controllers/syncerHomeController');
var syncerController = require('../controllers/syncerController');
var mediaItemsDownloadController  = require('../controllers/mediaItemsDownloadController');

router.get('/', oauth2Controller.getCode);
router.get('/authCallback.*', oauth2Controller.handleAuthCallback);
router.get('/syncerHome', syncerHomeController.index);
router.get('/downloadMediaItems', mediaItemsDownloadController.downloadMediaItems);
router.get('/syncer', syncerController.startSync);

module.exports = router;
