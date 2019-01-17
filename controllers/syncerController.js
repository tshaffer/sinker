const requestPromise = require('request-promise');
// const axios = require('axios');

var oauth2Controller = require('./oauth2Controller');

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
      console.log(result.mediaItems.length);
      console.log(result.nextPageToken);

      if (result.mediaItems.length === 0 || result.nextPageToken === undefined) {
        console.log('retrieved all mediaItems');
        debugger;
      }
      else {
        totalNumberOfMediaItems = totalNumberOfMediaItems + result.mediaItems.length;
        console.log('running total is: ', totalNumberOfMediaItems);
        processGetMediaFiles(result.nextPageToken);
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
