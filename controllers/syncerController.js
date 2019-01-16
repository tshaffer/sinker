const requestPromise = require('request-promise');
const axios = require('axios');

var oauth2Controller = require('./oauth2Controller');

exports.startSync = function (request, response, next) {
  response.render('syncer');

  var access_token = oauth2Controller.getAccessToken();
  console.log('start sync process');
  console.log(access_token);

  const apiEndpoint = 'https://photoslibrary.googleapis.com';

  console.log('invoke: ', apiEndpoint + '/v1/albums');

  // https://stackoverflow.com/questions/40988238/sending-the-bearer-token-with-axios
  // axios.get(apiEndpoint + '/v1/albums',
  // {
  //   headers: { 
  //     'Content-Type': 'application/json',
  //     'Authorization': "bearer " + access_token,    
  //   },
  // }).then((result) => {
  //   console.log(result);
  // }).catch((err) => {
  //   console.log(err);
  // });

  requestPromise.get(apiEndpoint + '/v1/albums', {
    headers: { 'Content-Type': 'application/json' },
    json: true,
    auth: { 'bearer': access_token },
  }).then((result) => {
    console.log(result);

    // result.albums is an array of albums
    // each album object
    //    id: string
    //    mediaItemsCount: string
    //    title: string
    //    productUrl: string
    //      not clear what would be returned using this url


  });

}
