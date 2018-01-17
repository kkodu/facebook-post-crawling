var express = require('express');
var app = express();

app.listen(3000, function(req, res) {
  console.log("Server starts on port 3000");
});

var fb_config = require('./config/fb-config.json');
var FacebookPost = require('./src/fb-post-v2');

var pageLink = "973432719345219"; // 크롤링 하려는 공개 페이지 토큰
var args = {
  // 가져올 데이터 설정
  fields: ['id', 'from', 'message', 'link', 'created_time', 'full_picture', 'source']
};

var fbposts = new FacebookPost(pageLink, args);
fbposts.accessPage(fb_config);
