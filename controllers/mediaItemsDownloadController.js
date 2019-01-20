const fs = require('fs')
const path = require('path')
const axios = require('axios')

var MediaItem = require('../models/mediaItem');
var pug = require('pug');
const WebSocket = require('ws')

const baseDir = '/Users/brightsign/Documents/mediaItems';

exports.downloadMediaItems = function (request, response) {
    const wss = new WebSocket.Server({ port: 8080 })

    console.log('setup wss');
    wss.on('connection', ws => {
        ws.on('message', message => {
            console.log(`Received message => ${message}`)
        })
        console.log('connection on');
        ws.send('Preparing download...')

        MediaItem.find({ 'downloaded': false }, 'id productUrl fileName', (err, cloudMediaItems) => {
            ws.send('Remaining media items to download: ' + cloudMediaItems.length.toString());

            const mediaItem = cloudMediaItems[0];
            downloadMediaItem(mediaItem).then(() => {
                console.log('downloaded complete');
                debugger;
            }).catch((err) => {
                console.log(err);
                debugger;
            })
        });
    })

    console.log('render mediaItemsDownloader');
    response.render('mediaItemsDownloader');
}

function downloadMediaItem(mediaItem) {

    return new Promise((resolve, reject) => {

        var url = mediaItem.productUrl;
        console.log('productUrl');
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