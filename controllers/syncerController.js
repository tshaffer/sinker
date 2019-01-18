const Fs = require('fs')  
const Path = require('path')  
const Axios = require('axios')

const requestPromise = require('request-promise');
// const axios = require('axios');

var oauth2Controller = require('./oauth2Controller');
var MediaItem = require('../models/mediaItem');

exports.startSync = function (request, response, next) {
  response.render('syncer');

  var access_token = oauth2Controller.getAccessToken();
  console.log('start sync process');
  console.log(access_token);

  const apiEndpoint = 'https://photoslibrary.googleapis.com';

  console.log('invoke: ', apiEndpoint + '/v1/mediaItems');

  var totalNumberOfMediaItems = 0;
  var processGetMediaFiles = (pageToken) => {
    var url = apiEndpoint + '/v1/mediaItems?pageSize=100'
    if (pageToken !== '') {
      url = url + '&pageToken=' + pageToken;
    }
    requestPromise.get(url, {
      headers: { 'Content-Type': 'application/json' },
      json: true,
      auth: { 'bearer': access_token },
    }).then((result) => {
      // mediaItem
      //  baseUrl: string
      //  filename: string
      //  id: string
      //  mediaMetadata: object
      //    creationTime: string
      //    height: string
      //    photo: object
      //      apertureFNumber: number
      //      cameraMake: string
      //      focalLength: number
      //      isoEquivalent: number
      //    width: string
      //  mimeType: string
      //  productUrl: string
      console.log(result.mediaItems.length);
      console.log(result.nextPageToken);

      if (result.mediaItems.length === 0 || result.nextPageToken === undefined) {
        console.log('retrieved all mediaItems');
        debugger;
      }
      else {
        totalNumberOfMediaItems = totalNumberOfMediaItems + result.mediaItems.length;
        console.log('running total is: ', totalNumberOfMediaItems);

        var downloadedFile = result.mediaItems[0];

        downloadImage(downloadedFile).then( () => {
          console.log('downloaded complete');
          debugger;
        }).catch( (err) => {
          console.log(err);
          debugger;
        })



        // var mediaItems = [];
        // for (var i = 0; i < 9; i++) {
        //   var downloadedMediaItem = result.mediaItems[i];
        //   var mediaItem = {
        //     id: downloadedMediaItem.id,
        //     base_url: downloadedMediaItem.baseUrl,
        //     filename: downloadedMediaItem.filename,
        //     product_url: downloadedMediaItem.productUrl,
        //   };
        //   mediaItems.push(mediaItem);
        // }
        // var promise = MediaItem.insertMany(mediaItems);
        // promise
        // .then( (promiseResults) => {
        //   console.log('all media items added to db');
        //   debugger;
        // })
        // .catch( (err) => {
        //   console.log(err);
        //   debugger;
        // });

        // var downloadedMediaItem = result.mediaItems[0];
        // var mediaItem = new MediaItem({
        //   id: downloadedMediaItem.id,
        //   base_url: downloadedMediaItem.baseUrl,
        //   filename: downloadedMediaItem.filename,
        //   product_url: downloadedMediaItem.productUrl,
        // });

        // // processGetMediaFiles(result.nextPageToken);

        // mediaItem.save(function(err) {
        //   if (err) {
        //     console.log(err);
        //   }
        //   else {
        //     console.log('mediaItem successfully added to mongo:');
        //     console.log(downloadedMediaItem);
        //   }
        //   debugger;
        // });
      }
    });
  };

  processGetMediaFiles('');

  // requestPromise.get(apiEndpoint + '/v1/albums', {
  //   headers: { 'Content-Type': 'application/json' },
  //   json: true,
  //   auth: { 'bearer': access_token },
  // }).then((result) => {
  //   console.log(result);

  //   // result.albums is an array of albums
  //   // each album object
  //   //    id: string
  //   //    mediaItemsCount: string
  //   //    title: string
  //   //    productUrl: string
  //   //      not clear what would be returned using this url


  // });

}

async function downloadImage (downloadedFile) { 
  var url = downloadedFile.baseUrl;
  console.log('baseUrl');
  console.log(url);

  var filename = downloadedFile.filename;
  console.log('filename');
  console.log(filename);

  const path = Path.resolve(__dirname, 'images', filename)
  const writer = Fs.createWriteStream(path)

  const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}