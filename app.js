var express = require('express');
var app = express();

app.listen(3000, function(req, res) {
  console.log("Server starts on port 3000");
});

var FB = require('fb'); // 페이스북 API 모듈
var fb_config = require('./config/fb-config.json'); // 페이스북 개발자 접근 권한 환경 변수

var pageLink = "1501408576603144"; // 크롤링 하려는 공개 페이지 토큰
var args = { fields: ['id', 'from', 'message', 'link', 'created_time', 'full_picture', 'source'] }; // 가져올 데이터를 설정

// 접근 권한 토큰 생성 함수
var getAccessToken = function() {
  // ES6 Promise 사용
  return new Promise(function(resolve, reject) {
    // 토큰 생성 => facebook.api(url, args, callback function)
    FB.api('oauth/access_token', {
      client_id: fb_config.clientId,
      client_secret: fb_config.clientSecret,
      grant_type: fb_config.grantType
    },
    // 응답 콜백
    function(response) {
      if(response.error)
        reject(response.error); // 요청 오류
      else
        resolve(response.access_token); // 응답 액세스 토큰
    });
  });
};

var getWallFeeds = function(link, args) {
  // 해당 페이지 게시물 수집
  FB.api(link, 'get', args, function(res) {
    if(res.error) throw res.error;

    var data = res.data;

    console.log(res.data);
    if(res.paging.next !== undefined)
      console.log(res.paging.next);
  });
};

// Promise 실행
getAccessToken().then(
  function(accessToken) {
    FB.setAccessToken(accessToken) // 동기 처리
    console.log("Access Token set")
    getWallFeeds(pageLink, args);
  },
  function(error) {
    console.log(error);
  });
