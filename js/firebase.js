// Firebase 연결 및 실시간 저장/구독 로직
firebase.initializeApp({
    apiKey:"AIzaSyCE86IpDajP7IsRItC7tc3pnjAZSfhNiI4",
    authDomain:"voice-d6845.firebaseapp.com",
    projectId:"voice-d6845",
    storageBucket:"voice-d6845.firebasestorage.app",
    messagingSenderId:"979498037744",
    appId:"1:979498037744:web:19857cd9406dbf914b6d35",
    databaseURL:"https://voice-d6845-default-rtdb.firebaseio.com"
});
const db=firebase.database();
const SLIDER_IDS=['rateKO','pitchKO','rateJA','pitchJA','rateEN','pitchEN'];

function saveSliderValues(){const v={};SLIDER_IDS.forEach(id=>{v[id]=document.getElementById(id).value;});localStorage.setItem('tway_slider_vals',JSON.stringify(v));}
function loadSliderValues(){const s=localStorage.getItem('tway_slider_vals');if(!s)return;const v=JSON.parse(s);SLIDER_IDS.forEach(id=>{if(v[id]!==undefined){document.getElementById(id).value=v[id];document.getElementById(id+'_label').textContent=v[id];}});}

function subscribeFirebaseMaster(){
    // status 목록 실시간 구독
    db.ref('master/status').on('value',snap=>{
        let data=snap.val();
        if(!data||!Array.isArray(data)||data.length===0){
            // 최초 접속 시 기본값 Firebase에 저장
            data=initialStatusList;
            db.ref('master/status').set(data);
        }
        window._statusList=data;
        const cur=document.getElementById('status').value;
        renderSelectOptions(window._statusList, window._langList||[]);
        if(cur&&document.getElementById('status').querySelector(`option[value="${cur}"]`)) document.getElementById('status').value=cur;
        loadTemplate();
    });
    // lang 목록 실시간 구독
    db.ref('master/lang').on('value',snap=>{
        let data=snap.val();
        if(!data||!Array.isArray(data)||data.length===0){
            data=initialLangList;
            db.ref('master/lang').set(data);
        }
        window._langList=data;
        const cur=document.getElementById('language').value;
        renderSelectOptions(window._statusList||[], window._langList);
        if(cur&&document.getElementById('language').querySelector(`option[value="${cur}"]`)) document.getElementById('language').value=cur;
        loadTemplate();
    });
}

function subscribeFirebaseTemplates(){db.ref('templates').on('value',snap=>{const d=snap.val();if(!d)return;Object.keys(d).forEach(k=>localStorage.setItem('tway_final_'+k,d[k]));loadTemplate();});}
function subscribeFirebaseTuning(){db.ref('tuning').on('value',snap=>{const d=snap.val();if(!d)return;SLIDER_IDS.forEach(id=>{if(d[id]!==undefined){document.getElementById(id).value=d[id];document.getElementById(id+'_label').textContent=parseFloat(d[id]).toFixed(2);}});localStorage.setItem('tway_slider_vals',JSON.stringify(d));});}
function saveTemplateToFirebase(key,value){db.ref('templates/'+key.replace('tway_final_','')).set(value);}
function saveTuningToFirebase(){const v={};SLIDER_IDS.forEach(id=>{v[id]=parseFloat(document.getElementById(id).value);});db.ref('tuning').set(v);}

window.addEventListener('load',function(){
    SLIDER_IDS.forEach(id=>{
        document.getElementById(id).addEventListener('input',saveSliderValues);
        document.getElementById(id).addEventListener('change',saveTuningToFirebase);
    });
    loadSliderValues();
    subscribeFirebaseMaster();
    subscribeFirebaseTemplates();
    subscribeFirebaseTuning();
});
