var FB = require('fb'),
    EVENT = require('events'),
    util = require('util'),
    url = require('url');

function FacebookPost(link, args) {
  this.link = link;
  this.args = args;
  this.nm = (function() {
    var eventEmitter = function() {
      EVENT.call(this);
    }
    util.inherits(eventEmitter, EVENT);

    return new eventEmitter();
  }());

  this.setArgs = function(next_args) {
    this.args = next_args.args;
  }

  this.nm.on('access-error', function(error) {
    console.log(error);
    process.exit(1);
  });

  this.nm.on('access-ok', function(access_token, this_post) {
    FB.setAccessToken(access_token);
    console.log("Access Token set");
    this_post.__proto__.getPagePosts(this_post); // 포스트 요청
  });

  this.nm.on('next-post', function(this_post) {
    this_post.__proto__.getPagePosts(this_post); // 다음 요청 실행
  });

  this.nm.on('data-obj', function(data) {
    if(!data) {

    }
  })
}

FacebookPost.prototype.accessPage = function(fb_config) {
  var this_post = this;
  var nextEmitter = this.nm;
  FB.api('oauth/access_token', {
    client_id: fb_config.clientId,
    client_secret: fb_config.clientSecret,
    grant_type: fb_config.grantType
  },
  function(response) {
    if(response.error)
      nextEmitter.emit('access-error', response.error);
    else
      nextEmitter.emit('access-ok', response.access_token, this_post);
  });
}

FacebookPost.prototype.getPagePosts = function(this_post) {
  var _this = this_post;
  var nextEmitter = _this.nm;
  FB.api(_this.link + '/posts', 'get', _this.args, function(res) {
    if(res.error) {
      console.log(res.error);
      process.exit(1); // 프로세스 종료
    }

    var data = res.data; // 요청 data
    console.log("[page post]------------------------------------------------------------------");
    console.log(data);
    console.log("-----------------------------------------------------------------------------");

    // 데이터 묶음을 전송하여 각 게시물의 좋아요, 댓글, 반응을 호출하도록 유도
    nextEmitter.emit('data-obj', data);

    // 다음 피드가 있는 경우
    if(res.paging && res.paging.next !== undefined) {
      var nextLinkParts = url.parse(res.paging.next, true); // url 파싱을 통한 다음 포스트 토큰과 액세스 토큰 분리
      var nextArgs = {
        args: _this.args
      };
      nextArgs.args.after = nextLinkParts.query.after;
      nextArgs.args.access_token = nextLinkParts.query.access_token;
      _this.setArgs(nextArgs);

      nextEmitter.emit('next-post', _this); // 이벤트를 통한 다음 요청 전달
    }
  });
}

module.exports = FacebookPost;
