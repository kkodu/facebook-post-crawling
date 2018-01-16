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

  this.getNextArgs = function(link) {
    var nextLinkParts = url.parse(link, true), // url 파싱을 통한 다음 포스트 토큰과 액세스 토큰 분리
        nextArgs = {
          args: this.args
        };
    nextArgs.args.after = nextLinkParts.query.after;
    nextArgs.args.access_token = nextLinkParts.query.access_token;
    return nextArgs;
  };

  this.nm.on('access-error', function(error) {
    console.log(error);
    process.exit(1);
  });

  this.nm.on('access-ok', function(access_token, _this) {
    FB.setAccessToken(access_token);
    console.log("Access Token set");
    _this.__proto__.getPagePosts(_this); // 포스트 요청
  });

  this.nm.on('next-args', function(set, _this) {
    var args = _this.getNextArgs(set.nextLink);
    set.next = args;
    _this.__proto__.getNextFeed(set, _this);
  });

  this.nm.on('data-obj', function(data, _this) {
    if(!Array.isArray(data)) {
      console.log(">> end point of data!!");
      process.exit(1);
    } else {
      for(var index in data) {
        var id = data[index].id;
        _this.__proto__.getPostSub(id, _this);
      }
    }
  });
}

FacebookPost.prototype.accessPage = function(fb_config) {
  var _this = this;
  var nextEmitter = _this.nm;
  FB.api('oauth/access_token', {
    client_id: fb_config.clientId,
    client_secret: fb_config.clientSecret,
    grant_type: fb_config.grantType
  },
  function(response) {
    if(response.error)
      nextEmitter.emit('access-error', response.error);
    else
      nextEmitter.emit('access-ok', response.access_token, _this);
  });
};

FacebookPost.prototype.getPagePosts = function(_this) {
  _this.__proto__.reqFbApi(_this.link, 'posts', _this.args, _this);
};

FacebookPost.prototype.getPostSub = function(id, _this) {
  // likes의 경우 reactions에 포함이 되므로 현재 생략
  var typeSet = ['comments', 'reactions'];
  for(var index in typeSet)
    _this.__proto__.reqFbApi(id, typeSet[index], _this.args, _this);
};

FacebookPost.prototype.getNextFeed = function(set, _this) {
  if(set.type === 'posts')
    _this.__proto__.reqFbApi(_this.link, set.type, set.next.args, _this);
  else {
    _this.__proto__.reqFbApi(set.token, set.type, set.next.args, _this);
  }
};

FacebookPost.prototype.reqFbApi = function(token, type, args, _this) {
  var nextEmitter = _this.nm;
  FB.api(token + '/' + type, 'get', args, function(res) {
    if(res.error) { console.log(res.error); process.exit(1); }

    console.log("[type: " + type + "]-----------------------------------------------------------------");
    if(res.data) console.log(res.data);
    else console.log("cannot find " + type);
    console.log("-----------------------------------------------------------------------------");

    if(type === 'posts')
      nextEmitter.emit('data-obj', res.data, _this);

    // 다음 피드가 있는 경우
    if(res.paging && res.paging.next !== undefined) {
      var set = {
        nextLink: res.paging.next,
        type: type,
      };
      if(type !== 'posts') set.token = token;

      nextEmitter.emit('next-args', set, _this);
    }
  });
};

module.exports = FacebookPost;
