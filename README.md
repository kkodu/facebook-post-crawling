# facebook-post-crawling
Facebook API를 사용한 공개 페이지 게시물 크롤링

##### * Facebook Developers 페이지에서 Facebook 아이디와 시크릿 토큰을 발급
..
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
..
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
..
저장하고 싶은 타입으로 형식을 변경하면 된다.
..
### 테스트 실행
#### 공개페이지 토큰 설정
페이지 요청을 위한 토큰값은 리눅스에서 curl 명령을 사용하여 얻었다.
..
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
요청 시, 해당하는 속성이 없으면 반환하지 않는다.
..
#### node index.js
* 기본적인 게시물 크롤링
* limit=25개의 게시물을 한 번만 요청
* DB 설정과 이벤트 에미터, 카운트 등 모두 주석처리
..
#### node app.js
* 카운트를 설정한 만큼 게시물을 크롤링 해오며 좋아요, 댓글, 리액션을 추가로 요청
* model 설정에 따라서 디비에 적재 (예제는 좋아요,댓글,리액션을 한 객체에 담았다.)
* 재귀를 사용한 크롤링 방식을 주석처리하고 prototype, Event Emitter를 사용
* app.js는 간단한 초기설정만 적혀있고, 실질적인 크롤링 처리부분은 ./src/fb-post-v2.js에서 수행
* fb-post-v2는 v1에서 오류가 발생했던 부분을 수정했고, [좋아요,댓글,리액션] 크롤링 방식을 개선
..
