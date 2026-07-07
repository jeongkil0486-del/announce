# Trinity 안내 방송 - 분리 버전

기존 단일 HTML 파일을 운영/관리하기 쉽도록 분리했습니다.

## 파일 구조

- `index.html` : 화면 구조
- `css/style.css` : 디자인/CSS
- `js/config.js` : 관리자 비밀번호, Google TTS Key, 음성 설정
- `js/templates.js` : 기본 방송 항목, 언어 목록, 기본 방송문, 번역 사전
- `js/main.js` : 화면 제어, 공란 입력, 번역, 방송문 조합, TTS 재생 로직
- `js/firebase.js` : Firebase 연결, 템플릿/항목/속도 설정 실시간 저장 및 구독

## 적용 방법

기존 단일 `index.html` 대신 이 폴더 전체를 그대로 업로드하세요.
`index.html`만 올리면 안 되고, `css` 폴더와 `js` 폴더도 같이 있어야 합니다.

## 중요 보안 참고

현재 원본 기능 유지를 위해 Google API Key와 관리자 비밀번호는 `js/config.js`에 분리만 해두었습니다.
실제 운영용으로 안전하게 쓰려면 Google TTS/Translate 호출은 Firebase Functions 또는 Cloudflare Worker 같은 서버 쪽으로 이동하는 구조가 더 안전합니다.
