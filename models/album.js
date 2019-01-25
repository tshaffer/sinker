var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// album
//  id: string
//  title: string
//  mediaItemIds: ObjectIds

var AlbumSchema = new Schema(
  {
      id: {type: String, required: true},
      title: {type: String, required: true},
      mediaItemIds: [Schema.Types.ObjectId],
  }
);

//Export model
module.exports = mongoose.model('Album', AlbumSchema);
