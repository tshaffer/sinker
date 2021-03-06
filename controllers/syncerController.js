var fs = require('fs');
var path = require('path');
var fse = require('fs-extra');
const axios = require('axios')

var cloudconvert = new (require('cloudconvert'))('njk3d6nMW4YwESyySBwBPDY30DMtwjeXjrvuUMInXBGdG1fWPBO5fgVhDMOsF8LK');

const requestPromise = require('request-promise');

var oauth2Controller = require('./oauth2Controller');
var MediaItem = require('../models/mediaItem');
var Album = require('../models/album');

const topLevelDirs = {};
const secondLevelDirs = {};

incrementDirCounter = function (dirNamesByKey, dirName) {
  if (dirNamesByKey.hasOwnProperty(dirName)) {
    dirNamesByKey[dirName] = dirNamesByKey[dirName] + 1;
  }
  else {
    dirNamesByKey[dirName] = 1;
  }
}

exports.startSyncShardFiles = function (request, response, next) {

  const files = [];
  const mediaItemsFolder = '/Volumes/SHAFFEROTO/mediaItems/';
  const backupMediaItemsFolder = '/Volumes/SHAFFEROTO/unshardedMediaItems/';

  var numFilesPreviouslyCopied = 0;

  const directoryContents = fs.readdirSync(mediaItemsFolder);

  directoryContents.forEach((directoryContentItem) => {
    if (!directoryContentItem.startsWith('.')) {
      const filePath = path.join(mediaItemsFolder, directoryContentItem);
      const backupPath = path.join(backupMediaItemsFolder, directoryContentItem);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {

        const fileNameWithoutExtension = path.parse(directoryContentItem).name;
        files.push(fileNameWithoutExtension);

        const numChars = fileNameWithoutExtension.length;
        const topLevelDirName = fileNameWithoutExtension.charAt(numChars - 2);
        const secondLevelDirName = topLevelDirName + fileNameWithoutExtension.charAt(numChars - 1);

        incrementDirCounter(topLevelDirs, topLevelDirName);
        incrementDirCounter(secondLevelDirs, secondLevelDirName);

        const targetDirectory = path.join(
          mediaItemsFolder,
          fileNameWithoutExtension.charAt(numChars - 2),
          fileNameWithoutExtension.charAt(numChars - 1)
        );
        const targetFilePath = path.join(targetDirectory, directoryContentItem);
        fsLocalFolderExists(targetDirectory)
          .then((dirExists) => {
            if (dirExists) {
              if (!fs.existsSync(targetFilePath)) {
                fsCopyFile(filePath, targetFilePath);
                // fsMoveFile(filePath, backupPath);
              }
              else {
                // fsMoveFile(filePath, backupPath);
                numFilesPreviouslyCopied++;
                console.log('numFilesPreviousCopied: ', numFilesPreviouslyCopied);
              }
            }
            else {
              fsCreateNestedDirectory(targetDirectory)
                .then(() => {
                  fsCopyFile(filePath, targetFilePath);
                })
                .catch((err) => {
                  debugger;
                })
            }
          })
          .catch((err) => {
            debugger;
          });
      }
    }
  });
}

exports.startSyncCountFilesInSubdirectory = function (request, response, next) {
  const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
      filelist = fs.statSync(path.join(dir, file)).isDirectory()
        ? walkSync(path.join(dir, file), filelist)
        : filelist.concat(path.join(dir, file));

    });
    return filelist;
  }

  var inList = [];
  var outList = walkSync('/Volumes/SHAFFEROTO/newMediaItems', inList);
  debugger;
}

findAndRenameFiles = function (mimeType, extension) {
  MediaItem.find({ "mimeType": mimeType }, 'id', (err, files) => {
    if (err) debugger;
    files.forEach((file) => {
      var fileNameWithoutExtension = '/Volumes/SHAFFEROTO/mediaItems/' + file.id + '.';
      var inputFilePath = fileNameWithoutExtension + 'jpg';
      if (fs.existsSync(inputFilePath)) {
        var outputFilePath = fileNameWithoutExtension + extension;
        console.log('Rename: ' + inputFilePath, ' to: ', outputFilePath);;
        fs.rename(inputFilePath, outputFilePath, (err) => {
          if (err) throw err;
          console.log('Rename complete for: ' + outputFilePath);
        });
      }
      else {
        console.log('File no longer exists: ' + inputFilePath);
      }
    })
  });
}

exports.startSyncRenameFiles = function (request, response, next) {
  findAndRenameFiles('image/png', 'png');
  findAndRenameFiles('video/mp4', 'mp4');
  findAndRenameFiles('image/bmp', 'bmp');
}

convertHeicFiles = function (heicMediaItems) {

  const maxToDownload = 25;

  var convertHeicToJpg = (heicMediaItemIndex) => {

    var id = heicMediaItems[heicMediaItemIndex].id;
    var fileName = id + '.jpg';
    var inputFilePath = '/Volumes/SHAFFEROTO/unshardedMediaItems/' + fileName;
    var outputFilePath = '/Users/tedshaffer/Pictures/sinker/convertedFromHeic/' + fileName;

    console.log('check for existence of ' + inputFilePath);

    if (fs.existsSync(inputFilePath)) {

      console.log(inputFilePath + ' exists');

      fs.createReadStream(inputFilePath)
        .pipe(cloudconvert.convert({
          "input": "upload",
          "inputformat": "heic",
          "outputformat": "jpg",
          "converteroptions.quality": {
            "quality": "100"
          }
        }))
        .pipe(fs.createWriteStream(outputFilePath)
          .on('finish', function () {

            console.log('conversion complete: ', outputFilePath);

            // update the mimeType of the converted file.
            MediaItem.update({ id: id }, { $set: { mimeType: 'image/jpeg' } }, function () {
              console.log('db update complete for: ', id);
            });
            // MediaItem.updateOne(
            //   { id: id }, 
            //   { $set: { mimeType: 'image/jpeg' } },
            //   { upsert: true }
            // );

            heicMediaItemIndex = heicMediaItemIndex + 1;
            if (heicMediaItemIndex < heicMediaItems.length && heicMediaItemIndex < maxToDownload) {
              convertHeicToJpg(heicMediaItemIndex);
            }
            else {
              console.log('all conversions complete');
              return;
            }
          })
          .on('error', (errorArgument) => {
            debugger;
          }));
    }
    else {
      heicMediaItemIndex = heicMediaItemIndex + 1;
      if (heicMediaItemIndex < heicMediaItems.length) {
        convertHeicToJpg(heicMediaItemIndex);
      }
      else {
        debugger;
      }
    }
  }

  if (heicMediaItems.length > 0) {
    convertHeicToJpg(0);
  }
}

exports.startSyncConvertHeicFiles = function (request, response, next) {

  response.render('syncer');

  MediaItem.find({ "mimeType": "image/heif" }, 'id', (err, heicMediaItems) => {
    console.log(heicMediaItems);
    convertHeicFiles(heicMediaItems);
  });
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

function fsLocalFolderExists(fullPath) {
  return Promise.resolve(fse.existsSync(fullPath))
    .then((exists) => {
      if (exists) {
        return fsLocalFileIsDirectory(fullPath);
      }
      return false;
    });
}

function fsCreateNestedDirectory(dirPath) {
  return fse.mkdirp(dirPath);
}

function fsLocalFileIsDirectory(fullPath) {
  return fse.stat(fullPath)
    .then((stat) => stat.isDirectory());
}

function fsCopyFile(sourcePath, destinationPath) {
  // fs.createReadStream(sourcePath).pipe(fs.createWriteStream(destinationPath));
  fse.copySync(sourcePath, destinationPath);
  console.log('copied from: ', sourcePath, ' to ', destinationPath);
}

// this didn't work for me...
function fsMoveFile(sourcePath, destinationPath) {
  fse.move(sourcePath, destinationPath, { overwrite: false });
}

exports.startSyncJoelPhotoTest = function (request, response, next) {

  response.render('syncer');

  var access_token = oauth2Controller.getAccessToken();
  console.log(access_token);

  // id of photo that belongs to shaffer family photo's account
  // const id = 'AEEKk93DRn8g-EAOZulURZgh9N1MFYvkCFPt2rbpjWjx2_qQVn3wzBhCnVB-otHkSqtBGONoCTksMzbxwbjzjgG8i_iVVYRl7Q';
  const id = 'AEEKk92KHM-3CR4soquRLExDGyUhkG5IzMIYSC1XEGQyE2IGCnJZ17zUtbKDX91S4_lXabWb-Omi';
  const apiEndpoint = 'https://photoslibrary.googleapis.com';
  var getMediaItemEndpoint = apiEndpoint + '/v1/mediaItems/' + id;

  requestPromise.get(getMediaItemEndpoint, {
    headers: { 'Content-Type': 'application/json' },
    json: true,
    auth: { 'bearer': access_token },
  }).then((result) => {
    const populatedMediaItem = result;
    var baseUrl = populatedMediaItem.baseUrl;
    console.log('baseUrl: ');
    console.log(baseUrl);

    if (typeof populatedMediaItem.mediaMetadata === 'object') {
      var mediaMetadata = populatedMediaItem.mediaMetadata;
      if (typeof mediaMetadata.width === 'string' && typeof mediaMetadata.height === 'string') {
        width = mediaMetadata.width;
        height = mediaMetadata.height;
        baseUrl = baseUrl + '=w' + width + '-h' + height;
        console.log('baseUrl with dimensions:');
        console.log(baseUrl);
      }
    }

    const baseDir = '/Users/tedshaffer/Pictures/sinker/photosFromJoel/';

    var fileName = id + '.jpg';
    const filePath = path.join(baseDir, fileName);
    const writer = fs.createWriteStream(filePath)
    axios({
      method: 'get',
      url: baseUrl,
      responseType: 'stream'
    }).then((response) => {
      response.data.pipe(writer);
      writer.on('finish', () => {
        console.log('write successful');
      });
      writer.on('error', (err) => {
        console.log('write unsuccessful');
        console.log(err);
      });
    }).catch((err) => {
      console.log('mediaItem file get/write failed for id:');
      console.log(id);
      debugger;
    });
  }).catch((err) => {
    console.log(err);
    debugger;
  });
}

// given a flat directory of photo files
//    determine sharded location
//    if file does not exist in sharded location, copy it there.
//    does not read or write the following
//      database
//      photoCollectionManifest.json
//    100% based on contents of source and target folders, subfolders.
publishFilesToShardedFs = function(unshardedFilesFolder, baseTargetFolder) {

  const files = [];

  var numFilesCopied = 0;
  var numFilesPreviouslyCopied = 0;

  const directoryContents = fs.readdirSync(unshardedFilesFolder);

  directoryContents.forEach((directoryContentItem) => {
    if (!directoryContentItem.startsWith('.')) {
      const filePath = path.join(unshardedFilesFolder, directoryContentItem);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const fileNameWithoutExtension = path.parse(directoryContentItem).name;
        files.push(fileNameWithoutExtension);

        const numChars = fileNameWithoutExtension.length;

        const targetDirectory = path.join(
          baseTargetFolder,
          fileNameWithoutExtension.charAt(numChars - 2),
          fileNameWithoutExtension.charAt(numChars - 1)
        );

        const targetFilePath = path.join(targetDirectory, directoryContentItem);
        fsLocalFolderExists(targetDirectory)
          .then((dirExists) => {
            if (dirExists) {
              if (!fs.existsSync(targetFilePath)) {
                fsCopyFile(filePath, targetFilePath);
                numFilesCopied++;
                console.log('numFilesCopied: ', numFilesCopied);
              }
              else {
                numFilesPreviouslyCopied++;
                console.log('numFilesPreviousCopied: ', numFilesPreviouslyCopied);
              }
            }
            else {
              fsCreateNestedDirectory(targetDirectory)
                  .then(() => {
                    console.log('created directory: ', targetDirectory);
                    fsCopyFile(filePath, targetFilePath);
                    numFilesCopied++;
                    console.log('numFilesCopied: ', numFilesCopied);
                  })
                  .catch((err) => {
                    debugger;
                  })
            }
          })
          .catch((err) => {
            console.log(err);
            debugger;
          });
      }
    }
  });
}

// based on the contents of the photoCollectionManifest file, generate a list of photoIds that are referenced in albums
// but not present in the mediaItems. Download all of those files.
retrieveMissingAlbumPhotos = function () {

  // algorithm
  //    open photoCollectionManifest
  //      get list of all media files
  //      get list of all photos in all albums
  //      determine which are missing
  //      download them
  //

  const manifestPath = '/Users/tedshaffer/Documents/Projects/sinker/photoCollectionManifest.json';

  const manifestContents = fs.readFileSync(manifestPath);
  const photoManifest = JSON.parse(manifestContents);
  console.log(photoManifest);

  const albums = photoManifest.albums;

  const albumPhotoIds = {};

  for (const albumName in albums) {
    if (albums.hasOwnProperty(albumName)) {
      const photosInAlbum = albums[albumName];
      photosInAlbum.forEach((photoId) => {
        if (!albumPhotoIds.hasOwnProperty(photoId)) {
          albumPhotoIds[photoId] = true;
        }
      });
    }
  }

  console.log('number of unique photos in albums: ');
  console.log(Object.keys(albumPhotoIds).length);

  const joelPhotoIds = [];
  const mediaItems = [];

  for (const albumPhotoId in albumPhotoIds) {
    if (albumPhotoIds.hasOwnProperty(albumPhotoId)) {
      if (!photoManifest.mediaItemsById.hasOwnProperty(albumPhotoId)) {
        joelPhotoIds.push(albumPhotoId);
      }
    }
  }

  console.log('number of joel photos to retrieve: ', joelPhotoIds.length);

  var access_token = oauth2Controller.getAccessToken();
  const apiEndpoint = 'https://photoslibrary.googleapis.com';
  const baseDir = '/Users/tedshaffer/Pictures/sinker/photosFromJoel/';

  var totalNumberOfJoelPhotos = joelPhotoIds.length;
  var processGetJoelFile = (fileIndex) => {
    const id = joelPhotoIds[fileIndex];
    var getMediaItemEndpoint = apiEndpoint + '/v1/mediaItems/' + id;

    requestPromise.get(getMediaItemEndpoint, {
      headers: { 'Content-Type': 'application/json' },
      json: true,
      auth: { 'bearer': access_token },
    }).then((result) => {
      const downloadedMediaItem = result;

      var creationTime = null;
      var width = null;
      var height = null;
      var baseUrl = downloadedMediaItem.baseUrl;
      if (typeof downloadedMediaItem.mediaMetadata === 'object') {
        var mediaMetadata = downloadedMediaItem.mediaMetadata;
        if (typeof mediaMetadata.creationTime === 'string') {
          creationTime = new Date(mediaMetadata.creationTime);
        }
        if (typeof mediaMetadata.width === 'string' && typeof mediaMetadata.height === 'string') {
          width = mediaMetadata.width;
          height = mediaMetadata.height;
          baseUrl = baseUrl + '=w' + width + '-h' + height;
        }
      }

      var ext = ".jpg";
      if (result.mimeType === 'image/heif') {
        ext = ".heic"
      }
      var fileName = id + ext;
      const filePath = path.join(baseDir, fileName);
      const writer = fs.createWriteStream(filePath)
      axios({
        method: 'get',
        url: baseUrl,
        responseType: 'stream'
      }).then((response) => {
        response.data.pipe(writer);
        writer.on('finish', () => {

          console.log('write successful for file number: ', fileIndex);

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
          var newMediaItem = new MediaItem(mediaItem);
          newMediaItem.save((err) => {
            if (err) {
              console.log(err);
              debugger;
            }
            console.log('mediaItem saved to db');

            fileIndex++;
            if (fileIndex >= totalNumberOfJoelPhotos) {
              console.log('process complete');
              debugger;
            }
            else {
              processGetJoelFile(fileIndex);
            }
          });
        });
        writer.on('error', (err) => {
          console.log('write unsuccessful');
          console.log(err);
        });
      }).catch((err) => {
        console.log('mediaItem file get/write failed for id:');
        console.log(id);
        debugger;
      });
    }).catch((err) => {
      console.log("error: ", err);
      console.log(id);
      fileIndex++;
      if (fileIndex >= totalNumberOfJoelPhotos) {
        console.log('complete');
        debugger;
      }
      else {
        processGetJoelFile(fileIndex);
      }
    });
  };

  processGetJoelFile(0);
}

// generate the manifest file based on the contents of the database
generateManifestFromDB = function () {

  const manifestPath = '/Users/tedshaffer/Documents/Projects/sinker/photoCollectionManifest.json';

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
      fs.writeFile(manifestPath, json, 'utf8', function (err) {
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

exports.startSync = function (request, response, next) {

  response.render('syncer');

  // generateManifestFromDB();

  // retrieveMissingAlbumPhotos();

  publishFilesToShardedFs(
    '/Users/tedshaffer/Pictures/sinker/photosFromJoel/', 
    '/Volumes/SHAFFEROTO/mediaItems');
}

