var express = require('express');
var app = express();

app.listen(3000, function(req, res) {
  console.log("Server starts on port 3000");
});

var EVENT = require('events');
var util = require('util');

function eventEmitter() {
  EVENT.call(this);
}
util.inherits(eventEmitter, EVENT);

var nextEmitter = new eventEmitter();

var fb_config = require('./config/fb-config.json');
var FacebookPost = require('./src/fb-post');

var pageLink = "973432719345219"; // 크롤링 하려는 공개 페이지 토큰
var args = {
  // 가져올 데이터 설정
  fields: ['id', 'object_id', 'properties', 'from', 'message', 'link', 'created_time', 'full_picture', 'source'],
  limit: 10
};

var fbposts = new FacebookPost(pageLink, args, nextEmitter);
fbposts.getAccessToken(fb_config);
