const requestPromise = require('request-promise');

var oauth2Controller = require('./oauth2Controller');

exports.startSync = function(request, response, next) {
  response.render('syncer');

  var access_token = oauth2Controller.getAccessToken();
  console.log('start sync process');
  console.log(access_token);

  const apiEndpoint = 'https://photoslibrary.googleapis.com';

  console.log('invoke: ', apiEndpoint + '/v1/albums');

  requestPromise.get(apiEndpoint + '/v1/albums', {
    headers: {'Content-Type': 'application/json'},
    json: true,
    auth: {'bearer': access_token},
  }).then( (result) => {
    console.log(result);
  });

}
