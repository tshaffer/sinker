const fs = require('fs')
const path = require('path')
const axios = require('axios')

var MediaItem = require('../models/mediaItem');
var pug = require('pug');
const WebSocket = require('ws')

const baseDir = '/Users/brightsign/Documents/mediaItems';

exports.downloadMediaItems = function (request, response) {
    const wss = new WebSocket.Server({ port: 8080 })

    var messageData = {};

    console.log('setup wss');
    wss.on('connection', ws => {
        ws.on('message', message => {
            console.log(`Received message => ${message}`)
        })
        console.log('connection on');
        // ws.send('Preparing download...')
        messageData = {
            type: 'OverallStatus',
            data: 'Preparing download...'
        };
        ws.send(JSON.stringify(messageData));

        MediaItem.find({ 'downloaded': false }, 'id productUrl baseUrl fileName', (err, cloudMediaItems) => {
            messageData = {
                type: 'OverallStatus',
                data: 'Remaining media items to download: ' + cloudMediaItems.length.toString() 
            };
            ws.send(JSON.stringify(messageData));
            // ws.send('Remaining media items to download: ' + cloudMediaItems.length.toString());

            var executeDownloadMediaItems = (cloudMediaItemIndex) => {
                const mediaItem = cloudMediaItems[cloudMediaItemIndex];
                downloadMediaItem(mediaItem).then(() => {
                    console.log('downloaded mediaItem: ', mediaItem.fileName);

                    // update db - set downloaded flag to true
                    mediaItem.set( { downloaded: true });
                    mediaItem.save( (err, updatedMediaItem) => {
                        if (err) debugger;
                        console.log(updatedMediaItem);
                    });

                    messageData = {
                        type: 'ProgressItem',
                        data: 'Downloaded mediaItem: ' + mediaItem.fileName 
                    };
                    ws.send(JSON.stringify(messageData));        
                    cloudMediaItemIndex = cloudMediaItemIndex + 1;
                    if (cloudMediaItemIndex > 9) {
                        debugger;
                    }
                    executeDownloadMediaItems(cloudMediaItemIndex);
                }).catch((err) => {
                    console.log(err);
                    debugger;
                });
            }
            
            executeDownloadMediaItems(0);
        });
    })

    console.log('render mediaItemsDownloader');
    response.render('mediaItemsDownloader');
}

function downloadMediaItem(mediaItem) {

    return new Promise((resolve, reject) => {

        var url = mediaItem.baseUrl;
        console.log('baseUrl');
        console.log(url);
        console.log(url);

        var fileName = mediaItem.fileName;
        console.log('filename');
        console.log(fileName);

        const filePath = path.join(baseDir, fileName);

        const writer = fs.createWriteStream(filePath)

        axios({
            method: 'get',
            url,
            responseType: 'stream'
        }).then((response) => {
            response.data.pipe(writer);
            writer.on('finish', resolve)
            writer.on('error', reject)
        });
    });
}
