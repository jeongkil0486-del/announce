let isPaused=false, currentSentenceIndex=0, speechParts=[];
let varValues={}, translateTimer=null;


window.onload=function(){ loadTemplate(); };

function toggleTuning(){
    const p=document.getElementById('tuningPanel'), a=document.getElementById('tuningArrow');
    const s=p.style.display!=='none'; p.style.display=s?'none':'block'; a.textContent=s?'▼':'▲';
}
function updateLabel(id){ document.getElementById(id+'_label').textContent=document.getElementById(id).value; }

function initSelectBoxes(){
    // Firebase 구독으로 초기화 — 여기선 아무것도 안 함
}
function renderSelectOptions(statusList, langList){
    const ss=document.getElementById('status'),ls=document.getElementById('language');
    const sv=ss.value,lv=ls.value;
    ss.innerHTML=""; statusList.forEach(i=>{const o=document.createElement('option');o.value=i.id;o.text=i.name;ss.appendChild(o);});
    ls.innerHTML=""; langList.forEach(i=>{const o=document.createElement('option');o.value=i.id;o.text=i.name;ls.appendChild(o);});
    if(sv&&ss.querySelector(`option[value="${sv}"]`)) ss.value=sv;
    if(lv&&ls.querySelector(`option[value="${lv}"]`)) ls.value=lv;
}
function addStatusItem(){const n=document.getElementById('newStatusInput').value.trim();if(!n)return alert("이름을 입력하세요.");const id="status_"+Date.now();const l=[...window._statusList,{id,name:n}];db.ref('master/status').set(l);document.getElementById('newStatusInput').value="";}
function renameStatusItem(){const s=document.getElementById('status');const n=document.getElementById('renameStatusInput').value.trim();if(!n)return alert("이름을 입력하세요.");const l=window._statusList.map(x=>x.id===s.value?{...x,name:n}:x);db.ref('master/status').set(l);}
function deleteStatusItem(){const s=document.getElementById('status');if(window._statusList.length<=1)return alert("최소 한 개는 있어야 합니다.");if(!confirm("정말 삭제하시겠습니까?"))return;db.ref('master/status').set(window._statusList.filter(i=>i.id!==s.value));}
function addLangItem(){const n=document.getElementById('newLangInput').value.trim();if(!n)return alert("이름을 입력하세요.");const id="lang_"+Date.now();const l=[...window._langList,{id,name:n}];db.ref('master/lang').set(l);document.getElementById('newLangInput').value="";}
function renameLangItem(){const s=document.getElementById('language');const n=document.getElementById('renameLangInput').value.trim();if(!n)return alert("이름을 입력하세요.");const l=window._langList.map(x=>x.id===s.value?{...x,name:n}:x);db.ref('master/lang').set(l);}
function deleteLangItem(){const s=document.getElementById('language');if(window._langList.length<=1)return alert("최소 한 개는 있어야 합니다.");if(!confirm("정말 삭제하시겠습니까?"))return;db.ref('master/lang').set(window._langList.filter(i=>i.id!==s.value));}

function getStorageKey(){return`tway_final_${document.getElementById('status').value}_${document.getElementById('language').value}`;}
function loadTemplate(){
    const ss=document.getElementById('status'),ls=document.getElementById('language');
    if(!ss.options.length||!ls.options.length)return;
    document.getElementById('renameStatusInput').value=ss.options[ss.selectedIndex].text;
    document.getElementById('renameLangInput').value=ls.options[ls.selectedIndex].text;
    const key=getStorageKey(),saved=localStorage.getItem(key),combo=`${ss.value}_${ls.value}`;
    document.getElementById('templateInput').value=saved||defaultTemplates[combo]||`Trinity 안내 방송입니다.\n[편명] 및 [목적지]를 입력하세요.`;
    const unlocked=!document.getElementById('templateInput').readOnly;
    document.getElementById('master-management-panel').style.display=unlocked?'block':'none';
    // varValues 유지 — 항목 바뀌어도 기존 입력값 보존 후 즉시 재번역
    stopTTSComplete();
    renderDynamicInputs();
    // 기존 값이 있으면 바로 재번역해서 반영
    Object.keys(varValues).forEach(key=>{ if(varValues[key]?.ko) autoTranslateVar(key); });
}
function saveTemplate(){
    const key=getStorageKey(),val=document.getElementById('templateInput').value;
    localStorage.setItem(key,val);
    saveTemplateToFirebase(key,val);
    alert('💾 저장되었습니다.');
    lockTemplate();
}
function unlockTemplate(){
    if(document.getElementById('passwordInput').value===ADMIN_PASSWORD){
        const ti=document.getElementById('templateInput');
        ti.readOnly=false;ti.disabled=false;ti.style.background='#fff';
        document.getElementById('save-control-group').classList.add('show');
        document.getElementById('master-management-panel').style.display='block';
        document.getElementById('tuningBlock').style.display='block';
    } else alert("❌ 비밀번호가 올바르지 않습니다.");
}
function lockTemplate(){
    const ti=document.getElementById('templateInput');
    ti.readOnly=true;ti.disabled=true;ti.style.background='';
    document.getElementById('save-control-group').classList.remove('show');
    document.getElementById('master-management-panel').style.display='none';
    document.getElementById('tuningBlock').style.display='none';
    document.getElementById('passwordInput').value='';
}
function resetDefaultTemplate(){if(confirm("기본 양식으로 복원하시겠습니까?")){localStorage.removeItem(getStorageKey());loadTemplate();}}

// ── 공란 변수 추출 — [ ] 형태만 공란으로 인식 ──────────
function extractVariables(template){
    const seen=new Map();
    const re=/\[([^\]]+)\]/g;
    let m;
    while((m=re.exec(template))!==null){
        const raw=m[1].trim();
        if(!seen.has(raw)) seen.set(raw,raw);
    }
    return Array.from(seen.entries()).map(([k,l])=>({key:k,label:l}));
}

function renderDynamicInputs(){
    const template=document.getElementById('templateInput').value;
    const container=document.getElementById('dynamic-inputs-container');
    const vars=extractVariables(template);
    if(vars.length===0){document.getElementById('dynamic-section').style.display='none';return;}
    document.getElementById('dynamic-section').style.display='block';

    const prev={};
    vars.forEach(v=>{const el=document.getElementById('var_'+v.key);prev[v.key]=el?el.value:(varValues[v.key]?.ko||'');});

    container.innerHTML=vars.map(v=>`
        <div class="dyn-grp">
            <label>${getVarIcon(v.key)}${v.label}</label>
            <input type="text" id="var_${v.key}" value="${prev[v.key]||''}" placeholder="${v.label} 입력" oninput="onVarInput('${v.key}')">
        </div>`).join('');
    composeFinalScript();
}

function getVarIcon(k){ if(k.includes('편명')||k.toLowerCase().includes('flight')) return '✈️ '; if(k.includes('목적지')||k.toLowerCase().includes('dest')) return '📍 '; return '📝 '; }

function onVarInput(key){
    if(translateTimer) clearTimeout(translateTimer);
    translateTimer=setTimeout(()=>autoTranslateVar(key),700);
    composeFinalScript();
}

async function autoTranslateVar(key){
    const el=document.getElementById('var_'+key);
    if(!el) return;
    const koVal=el.value.trim();
    if(!koVal) return;

    // 편명 → 숫자 변환만
    if(key.includes('편명')||key.toLowerCase().includes('flight')){
        varValues[key]={ko:expandFlight(koVal,'ko'),en:expandFlight(koVal,'en'),ja:expandFlight(koVal,'ja'),zh:expandFlight(koVal,'zh')};
        composeFinalScript(); return;
    }
    // 사전 우선
    if(translationDic[koVal]){
        varValues[key]={ko:koVal,...translationDic[koVal]};
        composeFinalScript(); return;
    }
    // Google Translate
    document.getElementById('translatingBadge').style.display='inline-block';
    try {
        const [en,ja,zh]=await Promise.all([gTranslate(koVal,'en'),gTranslate(koVal,'ja'),gTranslate(koVal,'zh')]);
        varValues[key]={ko:koVal,en,ja,zh};
    } catch(e){ varValues[key]={ko:koVal,en:koVal,ja:koVal,zh:koVal}; }
    document.getElementById('translatingBadge').style.display='none';
    composeFinalScript();
}

async function gTranslate(text,target){
    const resp=await fetch(`https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TTS_KEY}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({q:text,source:'ko',target,format:'text'})
    });
    const data=await resp.json();
    return data?.data?.translations?.[0]?.translatedText||text;
}

function expandFlight(f,lang){
    const ko={'0':'영','1':'일','2':'이','3':'삼','4':'사','5':'오','6':'육','7':'칠','8':'팔','9':'구'};
    const ja={'0':'ゼロ','1':'いち','2':'に','3':'さん','4':'よん','5':'ご','6':'ろく','7':'なな','8':'はち','9':'きゅう'};
    const zh={'0':'零','1':'一','2':'二','3':'三','4':'四','5':'五','6':'六','7':'七','8':'八','9':'九'};
    if(lang==='en'){
        // 알파벳 코드는 붙이고, 숫자만 공백으로 분리 (ex: TW123 → "TW 1 2 3")
        const alpha=f.replace(/[0-9]/g,'').trim();
        const digits=f.replace(/[^0-9]/g,'').split('').join(' ');
        return (alpha+(digits?' '+digits:'')).trim();
    }
    return f.split('').map(c=>{
        if(/[0-9]/.test(c)){if(lang==='ko')return ko[c];if(lang==='ja')return ja[c];if(lang==='zh')return zh[c];}
        return c;
    }).join(' ');
}

function composeFinalScript(){
    const vars=extractVariables(document.getElementById('templateInput').value);
    const origLines=document.getElementById('templateInput').value.split('\n');

    const resultLines=origLines.map(origLine=>{
        let line=origLine;
        // 언어는 원본 줄 기준으로 판별 (치환 전)
        const lang=detectOrigLang(origLine);
        vars.forEach(v=>{
            const vals=varValues[v.key];
            const el=document.getElementById('var_'+v.key);
            const ko=vals?vals.ko:(el?el.value:'___');
            const en=vals?vals.en:ko;
            const ja=vals?vals.ja:ko;
            const zh=vals?vals.zh:ko;
            const k=escRe(v.key);

            // [] → 줄 언어에 맞는 값으로
            let replaceVal=ko;
            if(lang==='en-US') replaceVal=en;
            else if(lang==='ja-JP') replaceVal=ja;
            else if(lang==='zh-CN') replaceVal=zh;
            line=line.replace(new RegExp(`\\[${k}\\]`,'g'),replaceVal);

            // 명시적 괄호 형태
            line=line.replace(new RegExp(`\\(${k}\\)`,'g'),en);
            line=line.replace(new RegExp(`（${k}）`,'g'),ja);
            line=line.replace(new RegExp(`\\{${k}\\}`,'g'),zh);
        });
        return line;
    });

    document.getElementById('scriptPreview').innerText=resultLines.join('\n');
}

// 원본 템플릿 줄의 언어 판별 — [변수명] 플레이스홀더 무시하고 주변 텍스트로 판별
function detectOrigLang(line){
    const stripped=line.replace(/\[[^\]]+\]/g,'').replace(/\([^)]+\)/g,'').replace(/（[^）]+）/g,'').replace(/\{[^}]+\}/g,'');
    if(/[가-힣]/.test(stripped)) return 'ko-KR';
    if(/[ぁ-んァ-ン]/.test(stripped)) return 'ja-JP';
    if(/[一-龥]/.test(stripped)) return 'zh-CN';
    if(/[A-Za-z]{3,}/.test(stripped)) return 'en-US';
    if(/[가-힣]/.test(line)) return 'ko-KR';
    if(/[ぁ-んァ-ン]/.test(line)) return 'ja-JP';
    if(/[一-龥]/.test(line)) return 'zh-CN';
    if(/[A-Za-z]/.test(line)) return 'en-US';
    return 'ko-KR';
}

function escRe(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

// ── Google Cloud TTS ─────────────────────────────────
function playTTS(){ stopTTSComplete(); playGoogleTTS(); }

async function playGoogleTTS(){
    speechParts=buildSpeechParts();
    if(speechParts.length===0) return;
    const btn=document.getElementById('pauseBtn');
    btn.innerText='⏳ 생성 중...'; btn.disabled=true;
    try {
        // 모든 오디오 미리 fetch (base64 저장)
        const results=await Promise.all(speechParts.map(item=>fetchGoogleAudio(item)));
        speechParts.forEach((item,i)=>{ item.audioData=results[i]; });
    } catch(e){ alert('Google TTS 오류: '+e.message); btn.disabled=false; resetPauseButton(); return; }
    btn.disabled=false; resetPauseButton();
    currentSentenceIndex=0; isPaused=false;
    // 첫 재생은 여기서 직접 시작 (user gesture 컨텍스트 안)
    playNext();
}

async function fetchGoogleAudio(item){
    const voice=GOOGLE_VOICES[item.lang]||GOOGLE_VOICES['ko-KR'];
    const rate=item.lang==='ja-JP'?parseFloat(document.getElementById('rateJA').value):
               item.lang==='ko-KR'?parseFloat(document.getElementById('rateKO').value):
               item.lang==='zh-CN'?0.95:
               parseFloat(document.getElementById('rateEN').value);
    const pitch=item.lang==='ja-JP'?parseFloat(document.getElementById('pitchJA').value):
                item.lang==='ko-KR'?parseFloat(document.getElementById('pitchKO').value):
                item.lang==='zh-CN'?0:
                parseFloat(document.getElementById('pitchEN').value);
    const resp=await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({input:{text:item.text},voice,audioConfig:{audioEncoding:'MP3',speakingRate:rate,pitch}})
    });
    if(!resp.ok){const e=await resp.json();throw new Error(e.error?.message||resp.statusText);}
    const data=await resp.json();
    return data.audioContent; // base64 문자열 그대로 보관
}

function playNext(){
    if(isPaused||currentSentenceIndex>=speechParts.length){
        if(currentSentenceIndex>=speechParts.length) resetPauseButton();
        return;
    }
    const item=speechParts[currentSentenceIndex];
    const audio=new Audio('data:audio/mpeg;base64,'+item.audioData);
    audio.preload='auto';
    window._currentAudio=audio;
    audio.addEventListener('ended',function(){
        currentSentenceIndex++;
        // iOS: setTimeout 안에서 new Audio().play() 차단됨 → 딜레이 없이 즉시 호출
        // 단락 사이 묵음은 TTS API audioConfig에서 처리
        playNext();
    });
    audio.addEventListener('error',function(){
        currentSentenceIndex++;
        playNext();
    });
    var p=audio.play();
    if(p!==undefined){ p.catch(function(){}); }
}

function playGoogleQueue(){ playNext(); }

function buildSpeechParts(){
    const parts=[];
    // scriptPreview 대신 templateInput 원본을 기준으로 언어 판별
    // → composeFinalScript의 join('\n') 으로 빈줄이 사라져도 언어 판별 정확도 유지
    const templateLines=document.getElementById('templateInput').value.split('\n');
    const previewLines=document.getElementById('scriptPreview').innerText.split('\n');

    // 원본 줄 언어 + 미리보기 줄 텍스트를 1:1 매핑
    const linePairs=templateLines.map((tLine,i)=>({
        lang: detectOrigLang(tLine),
        text: (previewLines[i]||'').trim()
    })).filter(p=>p.text);

    // 인접한 같은 언어 줄을 하나의 단락으로 합치기
    const paragraphs=[];
    linePairs.forEach(({lang,text})=>{
        if(paragraphs.length>0 && paragraphs[paragraphs.length-1].lang===lang){
            paragraphs[paragraphs.length-1].text+=' '+text;
        } else {
            paragraphs.push({text, lang});
        }
    });

    paragraphs.forEach(para=>{
        const {text,lang}=para;
        if(lang==='en-US'){
            parts.push({text,lang:'en-US'});
        } else if(lang==='ja-JP'){
            const segs=text.split(/([。！？])/);let acc="";
            segs.forEach(p=>{if(!p)return;if(/^[。！？]$/.test(p)){if(acc.trim()){parts.push({text:acc.trim()+p,lang:'ja-JP'});acc="";}}else acc+=p;});
            if(acc.trim()) parts.push({text:acc.trim(),lang:'ja-JP'});
        } else if(lang==='zh-CN'){
            const segs=text.split(/([。！？，、])/);let acc="";
            segs.forEach(p=>{if(!p)return;if(/^[。！？，、]$/.test(p)){if(acc.trim()){parts.push({text:acc.trim()+p,lang:'zh-CN'});acc="";}}else acc+=p;});
            if(acc.trim()) parts.push({text:acc.trim(),lang:'zh-CN'});
        } else {
            const segs=text.split(/([.!?,，])/);let acc="";
            segs.forEach(p=>{
                if(!p)return;
                if(/^[.!?,，]$/.test(p)){
                    if(acc.trim().length>1){const t=acc.trim()+(p===','||p==='，'?'':p);parts.push({text:t,lang:'ko-KR'});acc="";}
                } else acc+=p;
            });
            if(acc.trim().length>1) parts.push({text:acc.trim(),lang:'ko-KR'});
        }
    });
    return parts;
}

function detectLang(t){
    if(/[가-힣]/.test(t)) return 'ko-KR';
    if(/[ぁ-んァ-ン]/.test(t)) return 'ja-JP';
    if(/[一-龥]/.test(t)) return 'zh-CN';
    if(/[A-Za-z]/.test(t)) return 'en-US';
    return 'ko-KR';
}

// 단락 전체 언어 판별
function detectParaLang(t){
    if(/[ぁ-んァ-ン]/.test(t)) return 'ja-JP';
    if(/[一-龥]/.test(t)) return 'zh-CN';
    // 숫자/공백/편명용 한글 숫자 제거 후 순수 한글·영문자만 비교
    const onlyLetters=t.replace(/[일이삼사오육칠팔구영\d\s]/g,'');
    const hasKorean=/[가-힣]/.test(onlyLetters);
    const enChars=(onlyLetters.match(/[A-Za-z]/g)||[]).length;
    const total=onlyLetters.length;
    if(!hasKorean && total>0 && enChars/total>0.5) return 'en-US';
    if(hasKorean) return 'ko-KR';
    return 'ko-KR';
}

function togglePause(){
    const btn=document.getElementById('pauseBtn');
    if(!isPaused){
        isPaused=true;
        if(window._currentAudio){ window._currentAudio.pause(); }
        btn.innerText="▶ 방송 재개";btn.style.background='var(--green)';
    } else {
        isPaused=false;
        btn.innerText="⏸ 일시 정지";btn.style.background='';
        if(window._currentAudio){
            var p=window._currentAudio.play();
            if(p!==undefined){ p.catch(function(){}); }
        } else {
            playNext();
        }
    }
}
function stopTTSComplete(){
    if(window._currentAudio){ window._currentAudio.pause(); window._currentAudio=null; }
    window.speechSynthesis?.cancel();
    isPaused=false;currentSentenceIndex=0;resetPauseButton();
}
function resetPauseButton(){
    isPaused=false;
    const btn=document.getElementById('pauseBtn');
    btn.innerText="⏸ 일시 정지";btn.style.background='';btn.disabled=false;
}
