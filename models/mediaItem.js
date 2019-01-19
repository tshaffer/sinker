var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// mediaItem
//  baseUrl: string
//  filename: string
//  id: string
//  mediaMetadata: object
//    creationTime: string
//    height: string
//    photo: object
//      apertureFNumber: number
//      cameraMake: string
//      focalLength: number
//      isoEquivalent: number
//    width: string
//  mimeType: string
//  productUrl: string

var MediaItemSchema = new Schema(
  {
      id: {type: String, required: true},
      baseUrl: {type: String, required: true},
      fileName: {type: String, required: true},
      downloaded: {type: Boolean, default: false},
      filePath: {type: String, default: ''},
      productUrl: {type: String},
      mimeType: {type: String},
      creationTime: {type: Date},
      width: {type: Number},
      height: {type: Number},
  }
);


//Export model
module.exports = mongoose.model('MediaItem', MediaItemSchema);
