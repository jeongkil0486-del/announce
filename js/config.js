// 운영 전 주의: API Key/관리자 비밀번호는 프론트에 노출됩니다.
// 실제 운영용은 Firebase Functions 또는 Cloudflare Worker로 서버 분리 권장.
const ADMIN_PASSWORD = "0501";
const GOOGLE_TTS_KEY = 'AIzaSyDPwwNLJSnPoADJn41CuZevx7j6-KWRwiQ';
const GOOGLE_VOICES = {
    'ko-KR':{ languageCode:'ko-KR', name:'ko-KR-Neural2-B', ssmlGender:'FEMALE' },
    'ja-JP':{ languageCode:'ja-JP', name:'ja-JP-Wavenet-B', ssmlGender:'FEMALE' },
    'en-US':{ languageCode:'en-US', name:'en-US-Neural2-F', ssmlGender:'FEMALE' },
    'zh-CN':{ languageCode:'cmn-CN', name:'cmn-CN-Wavenet-D', ssmlGender:'FEMALE' },
};
