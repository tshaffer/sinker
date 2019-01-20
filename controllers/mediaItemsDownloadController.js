var MediaItem = require('../models/mediaItem');
var pug = require('pug');

exports.downloadMediaItems = function(request, response) {
    console.log('render mediaItemsDownloader');
    response.render('mediaItemsDownloader');
}