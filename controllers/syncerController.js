
const requestPromise = require('request-promise');

var oauth2Controller = require('./oauth2Controller');
var MediaItem = require('../models/mediaItem');

fetchAlbumContents = function(access_token, albums) {

  const apiEndpoint = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
  const url = apiEndpoint;

  const albumId = albums[0].id;
  console.log(albumId);

  requestPromise.post(url, {
    headers: { 'Content-Type': 'application/json' },
    json: true,
    auth: { 'bearer': access_token },
    body: { albumId },
  }).then((result) => {
    debugger;
  }).catch( (err) => {
    debugger;
  });
}

exports.startSync = function (request, response, next) {

  response.render('syncer');

  var access_token = oauth2Controller.getAccessToken();
  console.log('start sync process');
  console.log(access_token);

  const apiEndpoint = 'https://photoslibrary.googleapis.com';

  console.log('invoke: ', apiEndpoint + '/v1/albums');

  var totalNumberOfAlbums = 0;
  var albums = [];

  var processGetAlbums = (pageToken) => {
    var url = apiEndpoint + '/v1/albums?pageSize=50'
    if (pageToken !== '') {
      url = url + '&pageToken=' + pageToken;
    }
    requestPromise.get(url, {
      headers: { 'Content-Type': 'application/json' },
      json: true,
      auth: { 'bearer': access_token },
    }).then((result) => {

      console.log(result.albums.length);
      console.log(result.nextPageToken);

      if (result.albums.length === 0 || result.nextPageToken === undefined) {
        console.log('retrieved all albums');
        fetchAlbumContents(access_token, albums);
      }
      else {
        for (var i = 0; i < result.albums.length; i++) {
          var downloadedAlbum = result.albums[i];
          const id = downloadedAlbum.id;
          var title = downloadedAlbum.title;
          var album = {
            id,
            title,
            // coverPhotoBaesUrl
            // coverPhotoMediaItemId
            // productUrl
          };
          albums.push(album);
        }
        processGetAlbums(result.nextPageToken);
      }
    });
  };

  processGetAlbums('');
}

exports.startSyncOld = function (request, response, next) {
  response.render('syncer');

  // get list of photo's currently in db
  var mediaItemIdsInDb;

  MediaItem.find(null, 'id', (err, cloudMediaItems) => {
    mediaItemIdsInDb = cloudMediaItems.map((cloudMediaItem) => {
      return cloudMediaItem.id;
    })

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

        console.log(result.mediaItems.length);
        console.log(result.nextPageToken);

        if (result.mediaItems.length === 0 || result.nextPageToken === undefined) {
          console.log('retrieved all mediaItems');
          debugger;
        }
        else {
          totalNumberOfMediaItems = totalNumberOfMediaItems + result.mediaItems.length;
          console.log('running total is: ', totalNumberOfMediaItems);

          var mediaItems = [];
          for (var i = 0; i < result.mediaItems.length; i++) {
            var downloadedMediaItem = result.mediaItems[i];

            const id = downloadedMediaItem.id;
            if (mediaItemIdsInDb.indexOf(id) < 0) {
              var creationTime = null;
              var width = null;
              var height = null;
              if (typeof downloadedMediaItem.mediaMetadata === 'object') {
                var mediaMetadata = downloadedMediaItem.mediaMetadata;
                if (typeof mediaMetadata.creationTime === 'string') {
                  creationTime = new Date(mediaMetadata.creationTime);
                }
                if (typeof mediaMetadata.width === 'string') {
                  width = Number(mediaMetadata.width);
                }
                if (typeof mediaMetadata.height === 'string') {
                  height = Number(mediaMetadata.height);
                }
              }
              var mediaItem = {
                id,
                baseUrl: downloadedMediaItem.baseUrl,
                fileName: downloadedMediaItem.filename,
                productUrl: downloadedMediaItem.productUrl,
                mimeType: downloadedMediaItem.mimeType,
                creationTime,
                width,
                height,
              };
              mediaItems.push(mediaItem);
            }
          }
          var promise = MediaItem.insertMany(mediaItems);
          promise
            .then((promiseResults) => {
              console.log('all media items added to db');
              processGetMediaFiles(result.nextPageToken);
            })
            .catch((err) => {
              console.log(err);
              debugger;
            });
        }
      });
    };

    processGetMediaFiles('');
  });

  // var downloadedFile = result.mediaItems[0];

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

