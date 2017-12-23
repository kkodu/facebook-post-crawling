var express = require('express');
var app = express();

app.listen(3000, function(req, res) {
  console.log("Server starts on port 3000");
});

var FB = require('fb'); // 페이스북 API 모듈
var fb_config = require('./config/fb-config.json'); // 페이스북 개발자 접근 권한 환경 변수

var pageLink = "1501408576603144"; // 크롤링 하려는 공개 페이지 토큰

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
      console.log(response);
      if(!response || response.error)
        reject(!res ? 'error occurred' : response.error); // 요청 오류
      else
        resolve(response.access_token); // 응답 액세스 토큰
    });
  });
};

// Promise 실행
getAccessToken().then(
  function(accessToken) {
    console.log(accessToken); // access_token, token_type 형태
  },
  function(error) {
    console.log(error);
  });
