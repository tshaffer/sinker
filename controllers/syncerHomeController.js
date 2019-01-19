var MediaItem = require('../models/mediaItem');

exports.index = function(request, response) {
    MediaItem.count( {}, (err, count) => {
        if (err) { debugger }
        MediaItem.find( { 'downloaded': true }, 'fileName', (err, downloadedMediaItems) => {
            if (err) debugger;
            response.render('syncerHome', 
            { 
                mediaItemCount: count, 
                mediaItemsDownloadedCount: downloadedMediaItems.length,
                mediaItemsPendingDownloadCount: count - downloadedMediaItems.length,
            });
        });
    });
}
