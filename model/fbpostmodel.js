var mongoose = require('mongoose');

// Define Schemas
var schema = new mongoose.Schema({
  storyid: Number,
  name: String,
  message: String,
  created_time: Number,
  picture: String,
  picture_link: String,
  source: String,
},
{
  versionKey: false
});

// Create Model & export
module.exports = mongoose.model("fbposts", schema);
