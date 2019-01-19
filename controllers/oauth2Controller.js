const {google} = require('googleapis');
const requestPromise = require('request-promise');
const syncer = require('./syncerController');

var clientId = '1006826584050-4cad42jrlnu0bmophpuq7rt2nupslmmp.apps.googleusercontent.com';
var clientSecret = 'N3XZuKHm04cMPz8yo6wcgmBw';
var authCallbackUri = 'http://localhost:8080/authCallback.html';

var scope = 'https://www.googleapis.com/auth/photoslibrary.readonly';

var accessToken = '';

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  authCallbackUri
);

exports.getAccessToken = function() {
  return accessToken;
}

exports.getCode = function(req, response) {
  console.log('invoke oauth2Client.generateAuthUrl');
  const oauth2Url = oauth2Client.generateAuthUrl({
    access_type: 'online',
    scope: scope
  });
  console.log('oauth2Url:');
  console.log(oauth2Url);  

  response.writeHead(301,
    {Location: oauth2Url}
  );
  response.end();
}

exports.handleAuthCallback = function(request, response) {
  var url = request.url;
  console.log('request url: ');
  console.log(url);

  var codeIndex = url.indexOf('code=');
  var urlSubstring = url.substring(codeIndex);
  var indexOfNextParam = urlSubstring.indexOf('&');
  var code = urlSubstring.substring(5, indexOfNextParam);

  console.log('code:');
  console.log(code);
  oauth2Client.getToken(code).then( (tokens) => {
  
    oauth2Client.setCredentials(tokens);

    console.log('access token');
    const access_token = tokens.tokens.access_token;
    console.log(access_token);

    accessToken = access_token;

    response.redirect('/syncerHome');
    
    // syncer.startSync(request, response);

    // response.redirect('/users/syncer');
    // response.redirect('/syncer');

    // const apiEndpoint = 'https://photoslibrary.googleapis.com';

    // requestPromise.get(apiEndpoint + '/v1/albums', {
    //   headers: {'Content-Type': 'application/json'},
    //   json: true,
    //   auth: {'bearer': access_token},
    // }).then( (result) => {
    //   console.log(result);

    // });
  });
}
