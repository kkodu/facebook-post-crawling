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

  this.setToken = function(token) {
    this.args.access_token = token;
  }

  this.getNextArgs = function(link, args) {
    var nextLinkParts = url.parse(link, true), // url 파싱을 통한 다음 포스트 토큰과 액세스 토큰 분리
        nextArgs = {
          after: nextLinkParts.query.after,
          access_token: args.access_token
        };

    return nextArgs;
  };

  this.nm.on('access-error', function(error) {
    console.log(error);
    process.exit(1);
  });

  this.nm.on('access-ok', function(access_token, _this) {
    FB.setAccessToken(access_token);
    console.log("Access Token set");
    _this.setToken(access_token);
    _this.__proto__.getPagePosts(_this); // 포스트 요청
  });

  this.nm.on('next-args', function(set, _this) {
    //
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
  var reactionArgs = {
    fields: ['id', 'name', 'type']
  };

  _this.__proto__.reqFbApi(id, 'comments', _this.args, _this);
  _this.__proto__.reqFbApi(id, 'reactions', reactionArgs, _this);
};

FacebookPost.prototype.getNextFeed = function(set, _this) {
  if(set.type === 'posts')
    _this.__proto__.reqFbApi(_this.link, set.type, set.args, _this);
  else {
    _this.__proto__.reqFbApi(set.token, set.type, set.args, _this);
  }
};

FacebookPost.prototype.reqFbApi = function(token, type, args, _this) {
  var nextEmitter = _this.nm;
  // console.log("token: " + token, " type: " + type);
  FB.api(token + '/' + type, 'get', args, function(res) {
    if(res.error) { console.log(res.error); process.exit(1); }
    if(res.data[0] === undefined) return;

    var data = res.data;
    console.log("[type: " + type + "]-----------------------------------------------------------------");
    console.log(data);
    console.log("-----------------------------------------------------------------------------");

    // 이 코드에서 문제가 생김 => 댓글 좋아요등의 요청은 args에 after만 주면 됨..이걸 몰랐음
    if(type === 'posts')
      nextEmitter.emit('data-obj', data, _this);

    // 다음 피드가 있는 경우
    if(res.paging) {
      if(res.paging.next) {
        var nextArgs = _this.getNextArgs(res.paging.next, _this.args);
      } else {
        var nextArgs = {
          after: res.paging.cursors.after,
          access_token: _this.args.access_token
        }
      }
      var set = {
        args: nextArgs,
        type: type,
      };
      if(type !== 'posts') set.token = token;

      nextEmitter.emit('next-args', set, _this);
    }
  });
};

module.exports = FacebookPost;
