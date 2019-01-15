var oauth2Controller = require('./oauth2Controller');

exports.startSync = function(req, res, next) {
  res.render('syncer');

  var accessToken = oauth2Controller.getAccessToken();
  console.log('start sync process');
  console.log(accessToken);
}
