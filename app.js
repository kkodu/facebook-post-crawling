var express = require('express');
var app = express();

app.listen(3000, function(req, res) {
  console.log("Server starts on port 3000");
});

/* 이벤트 설정 */
var EventEmitter = require('events');
var util = require('util');
var url = require('url');

// 추가 피드 요청 이벤트 에미터
function nextPostEmitter() {
	EventEmitter.call(this);
}
util.inherits(nextPostEmitter, EventEmitter);

// 몽구스 접속 후 페이스북 토큰 요청 이벤트 에미터
function nextMongoEmitter() {
  EventEmitter.call(this);
}
util.inherits(nextMongoEmitter, EventEmitter);

var npEmitter = new nextPostEmitter();
var nmEmitter = new nextMongoEmitter();

/* 몽구스 설정 */
var mongoose = require('mongoose');
var mg_config = require('./config/mg-config.json');
var MODEL = require('./model/fbpostmodel.js');
mongoose.Promise = global.Promise;

var conn = mongoose.connection;
conn.on("error", console.error.bind(console, "mongoose connection error! --"));
conn.openUri(`mongodb://${mg_config.userId}:${mg_config.userPass}@${mg_config.userLocal}/${mg_config.db}`);
conn.once("open", function() {
  console.log("mongoose successfully connected @");
  nmEmitter.emit('req-fb-access', "event request received.. starts getting facebook access token");
});


/* 페이스북 설정 */
var FB = require('fb'); // 페이스북 API 모듈
var fb_config = require('./config/fb-config.json'); // 페이스북 개발자 접근 권한 환경 변수

var pageLink = "973432719345219"; // 크롤링 하려는 공개 페이지 토큰
var args = {
  // 가져올 데이터 설정
  fields: ['id', 'object_id', 'properties', 'from', 'message', 'link', 'created_time', 'full_picture', 'source'],
  limit: 10
};

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

// limit request count
var lrc = (function() {
  var count = 0;
  return count;
}());

var getPagePosts = function(link, args) {
  if(lrc > 2) process.exit(1);

  // 해당 페이지 게시물 수집
  FB.api(link + '/posts', 'get', args, function(res) {
    if(res.error) {
      console.log(res.error);
      process.exit(1); // 프로세스 종료
    }

    var data = res.data; // 요청 data
    console.log(`\n[${lrc}]-----------------------------------------------------------\n`, data);

    // 다음 피드가 있는 경우
    if(res.paging && res.paging.next !== undefined) {
      var nextLinkParts = url.parse(res.paging.next, true); // url 파싱을 통한 다음 포스트 토큰과 액세스 토큰 분리
      var nextArgs = {
        link: link,
        args: args
      };
      nextArgs.args.after = nextLinkParts.query.after;
      nextArgs.args.access_token = nextLinkParts.query.access_token;
      lrc++;

      npEmitter.emit('event', nextArgs); // 이벤트를 통한 다음 요청 전달
    }
  });
};

// 추가 피드 요청 이벤트 응답
npEmitter.on('event', function(req) {
	console.log('------------------------------------------------------------------');
  getPagePosts(req.link, req.args); // 다음 요청 실행
});

// 몽구스 접속 후 이벤트 발생을 통한 페이스북 크롤링
nmEmitter.on('req-fb-access', function(msg) {
  console.log(msg);
  // Promise 실행
  getAccessToken().then(
    function(accessToken) {
      FB.setAccessToken(accessToken) // 동기 처리
      console.log("Access Token set")
      getPagePosts(pageLink, args); // 포스트 요청
    },
    function(error) {
      console.log(error);
    });
});
