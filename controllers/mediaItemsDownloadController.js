var MediaItem = require('../models/mediaItem');
var pug = require('pug');
const WebSocket = require('ws')

exports.downloadMediaItems = function (request, response) {
    const wss = new WebSocket.Server({ port: 8080 })

    console.log('setup wss');
    wss.on('connection', ws => {
        ws.on('message', message => {
            console.log(`Received message => ${message}`)
        })
        console.log('connection on');
        ws.send('ho!')

        MediaItem.find( { 'downloaded': false }, 'id baseUrl fileName', (err, remoteMediaItems) => {
            remoteMediaItems[0].id, .baseUrl, .fileName
            debugger;
        });

    })

    console.log('render mediaItemsDownloader');
    response.render('mediaItemsDownloader');
}