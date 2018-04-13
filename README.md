# facebook-post-crawling
Facebook API를 사용한 공개 페이지 게시물 크롤링

 * 최신 업데이트   
## 2018/03/22 facebook newsroom - Cracking Down on Platform Abuse
페이스북은 플랫폼 남용으로부터 앱 사용자의 정보 보호를 위해 데이터 접근 권한을 더 강화하였다.
크롤링을 위해 API 요청 시, 아래의 오류 정보가 뜬다면 최근 3개월간 사용하지 않은 앱에 대해서는 접근이 불가능하다는 것을 알려준다.
```
(#200) Access to this data is temporarily disabled for non-active apps or apps that have not recently accessed this data due to changes we are making to the Facebook Platform. https://developers.facebook.com/status/issues/205942813488872/'
```
page 'post', 'feed' etc... deprecated (post, feed 기능은 중단될 것으로 보인다)
   
## 가이드  
#### * Facebook Developers 페이지에서 Facebook 아이디와 시크릿 토큰을 발급    

```
npm install
- set facebook-config (원하는 config 설정 방식 사용)
- [option] set db-config (원하는 db, config 설정, 예제는 mongoDB를 사용)
node app.js or node index.js  
``` 

## 설정      

#### set facebook-config
./config/ex-fb-config.json 수정
```
{
  "clientId" : "FBDEV_CLIENT_ID",
  "clientSecret" : "FBDEV_CLIENT_SECRET",
  "grantType" : "client_credentials"
}
```
1. clientId : 페이스북 개발자 아이디
2. clientSecret : 페이스북 개발자 시크릿 토큰
3. grantType : "client_credentials"를 사용    

#### set db-config (MongoDB 사용)
./model/fbpostmodel.js 수정
```
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
```
순서대로 게시물ID, 페이지정보, 게시물내용, 포스팅시간, 사진, 사진링크, 동영상을 저장    

저장하고 싶은 타입으로 형식을 변경하면 된다.     

## 테스트 실행   

#### 공개페이지 토큰 설정
페이지 요청을 위한 토큰값은 리눅스에서 curl 명령을 사용하여 얻었다.

* curl -skA "Mozilla/5.0" https://www.facebook.com/PAGE_NAME/ | grep -oE "fb://[^\"]+"
```
var pageLink = ""; // 타겟 공개페이지의 토큰 값
```   

#### 요청 인자 설정
원하는 데이터를 설정한다. Facebook Graph API 참조
```
var args = {
  // 가져올 데이터 설정
  fields: ['id', 'from', 'message', 'link', 'created_time', 'full_picture', 'source'],
limit: 10
};
```
* id : 게시물 토큰 ID
* from : 공개페이지 정보(페이지명, 아이디 등)
* message : 포스팅 내용
* link : 게시물 링크
* created_time : 포스팅 날짜
* full_picture : 원본 사진
* source : 동영상
* limit : 가져올 게시물 수 제한
요청 시, 해당하는 속성이 없으면 반환하지 않는다.     

#### node index.js
* 기본적인 게시물 크롤링
* limit=25개의 게시물을 한 번만 요청
* DB 설정과 이벤트 에미터, 카운트 등 모두 주석처리    

#### node app.js
* 카운트를 설정한 만큼 게시물을 크롤링 해오며 좋아요, 댓글, 리액션을 추가로 요청
* model 설정에 따라서 디비에 적재 (예제는 좋아요,댓글,리액션을 한 객체에 담았다.)
* 재귀를 사용한 크롤링 방식을 주석처리하고 prototype, Event Emitter를 사용
* app.js는 간단한 초기설정만 적혀있고, 실질적인 크롤링 처리부분은 ./src/fb-post-v2.js에서 수행
* fb-post-v2는 v1에서 오류가 발생했던 부분을 수정했고, [좋아요,댓글,리액션] 크롤링 방식을 개선     
    
## 개선이 필요한 사항
node.js를 통한 비동기 실행의 이점으로 빠르게 데이터를 가져올 수 있다. 하지만 페이스북 데이터의 구조 특성상 모든 데이터는 id값을 요청 쿼리에 담아서 보내야 하기 때문에 많은 부가 데이터를 얻기 위해서는 (예를 들어, 한 게시물의 댓글,좋아요 또 그 좋아요를 누른 사람의 정보, 사진 정보, 공유 정보 등) 꼬리에 꼬리를 무는 방식으로인해 많은 시간이 소요된다. 또한 비동기 특성상, 게시물과 부가정보는 독립적인 요청이기 때문에 원하는 기준(게시물수,날짜 등)에 맞춰 크롤링을 원한다면 동기화 문제도 고려해보아야 한다.
