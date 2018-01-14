var FB = require('fb'),
    EVENT = require('events'),
    util = require('util'),
    url = require('url');

function FacebookPost(link, args, nextEmitter) {
  this.link = link;
  this.args = args;
  this.nm = nextEmitter;

  this.nm.on("access-error", function(error) {
    console.log(error);
    process.exit(1);
  });

  this.nm.on("access-ok", function(access_token, this_post) {
    FB.setAccessToken(access_token);
    console.log("Access Token set");
    this_post.__proto__.getPagePosts(this_post.link, this_post.args); // 포스트 요청
  });

  this.nm.on('next-post', function(req, this_post) {
  	console.log('------------------------------------------------------------------');
    this_post.__proto__.getPagePosts(req.link, req.args); // 다음 요청 실행
  });

}

FacebookPost.prototype.getAccessToken = function(fb_config) {
  var this_post = this;
  var nextEmitter = this.nm;
  FB.api('oauth/access_token', {
    client_id: fb_config.clientId,
    client_secret: fb_config.clientSecret,
    grant_type: fb_config.grantType
  },
  function(response) {
    if(response.error)
      nextEmitter.emit("access-error", response.error);
    else
      nextEmitter.emit("access-ok", response.access_token, this_post);
  });
}

FacebookPost.prototype.getPagePosts = function(link, args) {
  var this_post = this;
  var nextEmitter = this.nm;
  console.log(this);
  console.log(nextEmitter);
  FB.api(link + '/posts', 'get', args, function(res) {
    if(res.error) {
      console.log(res.error);
      process.exit(1); // 프로세스 종료
    }

    var data = res.data; // 요청 data
    console.log(data);

    // 다음 피드가 있는 경우
    if(res.paging && res.paging.next !== undefined) {
      var nextLinkParts = url.parse(res.paging.next, true); // url 파싱을 통한 다음 포스트 토큰과 액세스 토큰 분리
      var nextArgs = {
        link: link,
        args: args
      };
      nextArgs.args.after = nextLinkParts.query.after;
      nextArgs.args.access_token = nextLinkParts.query.access_token;

      nextEmitter.emit('next-post', nextArgs, this_post); // 이벤트를 통한 다음 요청 전달
    }
  });
}

module.exports = FacebookPost;
