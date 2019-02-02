var fs = require('fs');
var cloudconvert = new (require('cloudconvert'))('njk3d6nMW4YwESyySBwBPDY30DMtwjeXjrvuUMInXBGdG1fWPBO5fgVhDMOsF8LK');

const requestPromise = require('request-promise');

var oauth2Controller = require('./oauth2Controller');
var MediaItem = require('../models/mediaItem');
var Album = require('../models/album');


exports.startSync = function (request, response, next) {

  response.render('syncer');

  fs.createReadStream('/Volumes/SHAFFEROTO/toConvert.jpg')
    .pipe(cloudconvert.convert({
      "input": "upload",
      "inputformat": "heic",
      "outputformat": "jpg",
      "converteroptions.quality": {
        "quality": "100"
      }
    }))
    .pipe(fs.createWriteStream('/Volumes/SHAFFEROTO/converted.jpg'));
}

fetchAlbumContents = function (access_token, albums) {

  return new Promise((resolve, reject) => {

    const apiEndpoint = 'https://photoslibrary.googleapis.com/v1/mediaItems:search?pageSize=100';

    const albumsById = {};

    var processFetchAlbumContents = (albumIdIndex, pageToken) => {

      const albumId = albums[albumIdIndex].id;

      let apiEndpoint = 'https://photoslibrary.googleapis.com/v1/mediaItems:search?pageSize=100';
      if (pageToken !== '' && (typeof pageToken !== 'undefined')) {
        apiEndpoint = apiEndpoint + '&pageToken=' + pageToken;
      }

      requestPromise.post(apiEndpoint, {
        headers: { 'Content-Type': 'application/json' },
        json: true,
        auth: { 'bearer': access_token },
        body: { albumId },
      }).then((result) => {
        let mediaItemIdsInAlbum = result.mediaItems.map((mediaItem) => {
          return mediaItem.id;
        });
        // concat data from prior call on same album
        if (albumsById[albumId]) {
          mediaItemIdsInAlbum = albumsById[albumId].concat(mediaItemIdsInAlbum);
        }
        albumsById[albumId] = mediaItemIdsInAlbum;

        if (result.nextPageToken === undefined) {
          albumIdIndex = albumIdIndex + 1;
          if (albumIdIndex >= albums.length) {
            console.log(albumsById);
            return resolve(albumsById);
          }
        }
        processFetchAlbumContents(albumIdIndex, result.nextPageToken);
      }).catch((err) => {
        debugger;
      });
    }

    processFetchAlbumContents(0, '');
  });
}

exports.startSyncGetAlbums = function (request, response, next) {
  // exports.startSync = function (request, response, next) {

  response.render('syncer');

  var access_token = oauth2Controller.getAccessToken();
  console.log('start sync process');
  console.log(access_token);

  const apiEndpoint = 'https://photoslibrary.googleapis.com';

  console.log('invoke: ', apiEndpoint + '/v1/albums');

  var totalNumberOfAlbums = 0;
  var albums = [];

  // TODO - assumes all albums can be retrieved in a single call. must fix in future.
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
        fetchAlbumContents(access_token, albums).then((albumContentsByAlbumId) => {
          console.log('All album related information retrieved');
          console.log('Albums:');
          console.log(albums);
          console.log('Album contents by albumId');
          console.log(albumContentsByAlbumId);
          debugger;

          var dbAlbums = [];
          for (var i = 0; i < albums.length; i++) {
            var dbAlbumData = albums[i];
            var dbAlbum = {
              id: dbAlbumData.id,
              title: dbAlbumData.title,
              mediaItemIds: albumContentsByAlbumId[dbAlbumData.id],
            };
            dbAlbums.push(dbAlbum);
          }
          var promise = Album.insertMany(dbAlbums);
          promise
            .then((promiseResults) => {
              console.log('all albums added to db');
              debugger;
            })
            .catch((err) => {
              console.log(err);
              debugger;
            });
        }).catch((err) => {
          debugger;
        });
      }
      else {
        for (var i = 0; i < result.albums.length; i++) {
          var downloadedAlbum = result.albums[i];
          const id = downloadedAlbum.id;
          var title = downloadedAlbum.title;
          var album = {
            id,
            title,
          };
          albums.push(album);
        }
        processGetAlbums(result.nextPageToken);
      }
    });
  };

  processGetAlbums('');
}

exports.startSyncGetMediaItems = function (request, response, next) {
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

exports.startSyncCreateManifest = function (request, response, next) {

  response.render('syncer');

  MediaItem.find(null, 'id fileName creationTime width height', (err, dbMediaItems) => {
    Album.find(null, 'item title mediaItemIds', (err, dbAlbumItems) => {
      var mediaItemsById = {};
      for (var i = 0; i < dbMediaItems.length; i++) {
        var dbMediaItem = dbMediaItems[i];
        mediaItemsById[dbMediaItem.id] = {
          id: dbMediaItem.id,
          fileName: dbMediaItem.fileName,
          width: dbMediaItem.width,
          height: dbMediaItem.height,
        };
      }

      var albumItemsByAlbumName = {};
      for (var i = 0; i < dbAlbumItems.length; i++) {
        var dbAlbumItem = dbAlbumItems[i];
        var albumName = dbAlbumItem.title;
        var mediaItemIdsInAlbum = [];
        var dbMediaItemIdsInAlbum = dbAlbumItem.mediaItemIds;
        for (var j = 0; j < dbMediaItemIdsInAlbum.length; j++) {
          mediaItemIdsInAlbum.push(dbMediaItemIdsInAlbum[j]);
        }
        albumItemsByAlbumName[albumName] = dbMediaItemIdsInAlbum;
      }

      var manifestFile = {
        'mediaItemsById': mediaItemsById,
        'albums': albumItemsByAlbumName
      };
      var json = JSON.stringify(manifestFile, null, 2);
      fs.writeFile('photoCollectionManifest.json', json, 'utf8', function (err) {
        if (err) {
          console.log('err');
          console.log(err);
        }
        else {
          console.log('photoCollectionManifest.json successfully written');
        }
      });
    });
  });

}
