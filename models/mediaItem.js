var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var MediaItemSchema = new Schema(
  {
      id: {type: String, required: true},
      base_url: {type: String, required: true},
      filename: {type: String, required: true},
      product_url: {type: String},
  }
);


//Export model
module.exports = mongoose.model('MediaItem', MediaItemSchema);
