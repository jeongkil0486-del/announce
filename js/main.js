let isPaused = false;
let currentSentenceIndex = 0;
let speechParts = [];
let varValues = {};
let translateTimer = null;
let freeBroadcastTimer = null;
let freeBroadcastRequestId = 0;
let freeBroadcastPreviewText = "";

const FREE_STATUS_ID = "status_free";
const FREE_STATUS_NAME = "자유 방송";
const FREE_LANG_OPTIONS = [
    { id: "free_lang_ko", name: "한국어", voiceLang: "ko-KR", translateTarget: null },
    { id: "free_lang_en", name: "영어", voiceLang: "en-US", translateTarget: "en" },
    { id: "free_lang_ja", name: "일본어", voiceLang: "ja-JP", translateTarget: "ja" },
    { id: "free_lang_zh", name: "중국어", voiceLang: "zh-CN", translateTarget: "zh-CN" }
];

window.onload = function () {
    bindAnnouncementEvents();
    loadTemplate();
};

function bindAnnouncementEvents() {
    const statusSelect = document.getElementById("status");
    const languageSelect = document.getElementById("language");
    const freeBroadcastInput = document.getElementById("freeBroadcastInput");

    if (statusSelect && !statusSelect.dataset.boundChange) {
        statusSelect.addEventListener("change", onBroadcastSelectionChange);
        statusSelect.dataset.boundChange = "true";
    }

    if (languageSelect && !languageSelect.dataset.boundChange) {
        languageSelect.addEventListener("change", onBroadcastSelectionChange);
        languageSelect.dataset.boundChange = "true";
    }

    if (freeBroadcastInput && !freeBroadcastInput.dataset.boundInput) {
        freeBroadcastInput.addEventListener("input", onFreeBroadcastInput);
        freeBroadcastInput.dataset.boundInput = "true";
    }
}

function onBroadcastSelectionChange() {
    loadTemplate();

    if (isFreeBroadcastMode()) {
        updateFreeBroadcastPreview();
    }
}

function toggleTuning() {
    const panel = document.getElementById("tuningPanel");
    const arrow = document.getElementById("tuningArrow");
    const isOpen = panel.style.display !== "none";
    panel.style.display = isOpen ? "none" : "block";
    arrow.textContent = isOpen ? "▾" : "▴";
}

function updateLabel(id) {
    document.getElementById(id + "_label").textContent = document.getElementById(id).value;
}

function initSelectBoxes() {}

function getAugmentedStatusList(statusList) {
    const nextList = Array.isArray(statusList) ? [...statusList] : [];
    if (!nextList.some((item) => item.id === FREE_STATUS_ID)) {
        nextList.push({ id: FREE_STATUS_ID, name: FREE_STATUS_NAME });
    }
    return nextList;
}

function isFreeBroadcastMode() {
    return document.getElementById("status")?.value === FREE_STATUS_ID;
}

function getCurrentLanguageOptions(statusValue, langList) {
    return statusValue === FREE_STATUS_ID ? FREE_LANG_OPTIONS : (Array.isArray(langList) ? langList : []);
}

function getSelectedFreeLanguage() {
    const selectedId = document.getElementById("language")?.value;
    return FREE_LANG_OPTIONS.find((item) => item.id === selectedId) || FREE_LANG_OPTIONS[0];
}

function renderSelectOptions(statusList, langList) {
    const statusSelect = document.getElementById("status");
    const languageSelect = document.getElementById("language");
    const previousStatus = statusSelect.value;
    const previousLanguage = languageSelect.value;
    const nextStatusList = getAugmentedStatusList(statusList);

    statusSelect.innerHTML = "";
    nextStatusList.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.text = item.name;
        statusSelect.appendChild(option);
    });

    const activeStatus = nextStatusList.some((item) => item.id === previousStatus)
        ? previousStatus
        : (nextStatusList[0]?.id || "");
    if (activeStatus) {
        statusSelect.value = activeStatus;
    }

    const nextLangList = getCurrentLanguageOptions(statusSelect.value, langList);
    languageSelect.innerHTML = "";
    nextLangList.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.text = item.name;
        languageSelect.appendChild(option);
    });

    const activeLanguage = nextLangList.some((item) => item.id === previousLanguage)
        ? previousLanguage
        : (nextLangList[0]?.id || "");
    if (activeLanguage) {
        languageSelect.value = activeLanguage;
    }
}

function addStatusItem() {
    const name = document.getElementById("newStatusInput").value.trim();
    if (!name) return alert("이름을 입력하세요.");
    const id = "status_" + Date.now();
    const list = [...window._statusList, { id, name }];
    db.ref("master/status").set(list);
    document.getElementById("newStatusInput").value = "";
}

function renameStatusItem() {
    const statusSelect = document.getElementById("status");
    if (statusSelect.value === FREE_STATUS_ID) return alert("자유 방송 항목은 별도 고정 항목입니다.");
    const name = document.getElementById("renameStatusInput").value.trim();
    if (!name) return alert("이름을 입력하세요.");
    const list = window._statusList.map((item) => item.id === statusSelect.value ? { ...item, name } : item);
    db.ref("master/status").set(list);
}

function deleteStatusItem() {
    const statusSelect = document.getElementById("status");
    if (statusSelect.value === FREE_STATUS_ID) return alert("자유 방송 항목은 삭제할 수 없습니다.");
    if (window._statusList.length <= 1) return alert("최소 1개 항목은 유지해야 합니다.");
    if (!confirm("선택한 항목을 삭제하시겠습니까?")) return;
    db.ref("master/status").set(window._statusList.filter((item) => item.id !== statusSelect.value));
}

function addLangItem() {
    const name = document.getElementById("newLangInput").value.trim();
    if (!name) return alert("이름을 입력하세요.");
    const id = "lang_" + Date.now();
    const list = [...window._langList, { id, name }];
    db.ref("master/lang").set(list);
    document.getElementById("newLangInput").value = "";
}

function renameLangItem() {
    if (isFreeBroadcastMode()) return alert("자유 방송 언어는 고정 항목입니다.");
    const languageSelect = document.getElementById("language");
    const name = document.getElementById("renameLangInput").value.trim();
    if (!name) return alert("이름을 입력하세요.");
    const list = window._langList.map((item) => item.id === languageSelect.value ? { ...item, name } : item);
    db.ref("master/lang").set(list);
}

function deleteLangItem() {
    if (isFreeBroadcastMode()) return alert("자유 방송 언어는 삭제할 수 없습니다.");
    const languageSelect = document.getElementById("language");
    if (window._langList.length <= 1) return alert("최소 1개 항목은 유지해야 합니다.");
    if (!confirm("선택한 항목을 삭제하시겠습니까?")) return;
    db.ref("master/lang").set(window._langList.filter((item) => item.id !== languageSelect.value));
}

function getStorageKey() {
    return `tway_final_${document.getElementById("status").value}_${document.getElementById("language").value}`;
}

function loadTemplate() {
    const statusSelect = document.getElementById("status");
    const languageSelect = document.getElementById("language");
    if (!statusSelect.options.length || !languageSelect.options.length) return;

    renderSelectOptions(window._statusList || [], window._langList || []);

    const statusText = statusSelect.options[statusSelect.selectedIndex]?.text || "";
    const languageText = languageSelect.options[languageSelect.selectedIndex]?.text || "";
    document.getElementById("renameStatusInput").value = statusText;
    document.getElementById("renameLangInput").value = languageText;

    if (isFreeBroadcastMode()) {
        toggleModeSections(true);
        stopTTSComplete();
        updateFreeBroadcastPreview();
        return;
    }

    toggleModeSections(false);

    const key = getStorageKey();
    const saved = localStorage.getItem(key);
    const combo = `${statusSelect.value}_${languageSelect.value}`;
    document.getElementById("templateInput").value =
        saved ||
        defaultTemplates[combo] ||
        "Trinity 안내 방송입니다.\n[편명] 편과 [목적지]를 입력하세요.";

    const unlocked = !document.getElementById("templateInput").readOnly;
    document.getElementById("master-management-panel").style.display = unlocked ? "block" : "none";
    document.getElementById("save-control-group").classList.toggle("show", unlocked);
    document.getElementById("tuningBlock").style.display = unlocked ? "block" : "none";

    stopTTSComplete();
    renderDynamicInputs();
    Object.keys(varValues).forEach((keyName) => {
        if (varValues[keyName]?.ko) autoTranslateVar(keyName);
    });
}

function toggleModeSections(isFreeMode) {
    const templateAdminRow = document.getElementById("template-admin-row");
    const templateInput = document.getElementById("templateInput");
    const freeSection = document.getElementById("free-broadcast-section");
    const saveGroup = document.getElementById("save-control-group");
    const dynamicSection = document.getElementById("dynamic-section");
    const managementPanel = document.getElementById("master-management-panel");
    const tuningBlock = document.getElementById("tuningBlock");

    templateAdminRow.style.display = isFreeMode ? "none" : "flex";
    templateInput.style.display = isFreeMode ? "none" : "block";
    freeSection.style.display = isFreeMode ? "block" : "none";
    dynamicSection.style.display = isFreeMode ? "none" : dynamicSection.style.display;

    if (isFreeMode) {
        saveGroup.classList.remove("show");
        managementPanel.style.display = "none";
        tuningBlock.style.display = "none";
    }
}

function saveTemplate() {
    const key = getStorageKey();
    const value = document.getElementById("templateInput").value;
    localStorage.setItem(key, value);
    saveTemplateToFirebase(key, value);
    alert("저장되었습니다.");
    lockTemplate();
}

function unlockTemplate() {
    if (document.getElementById("passwordInput").value === ADMIN_PASSWORD) {
        const templateInput = document.getElementById("templateInput");
        templateInput.readOnly = false;
        templateInput.disabled = false;
        templateInput.style.background = "#fff";
        document.getElementById("save-control-group").classList.add("show");
        document.getElementById("master-management-panel").style.display = isFreeBroadcastMode() ? "none" : "block";
        document.getElementById("tuningBlock").style.display = "block";
    } else {
        alert("관리자 비밀번호가 올바르지 않습니다.");
    }
}

function lockTemplate() {
    const templateInput = document.getElementById("templateInput");
    templateInput.readOnly = true;
    templateInput.disabled = true;
    templateInput.style.background = "";
    document.getElementById("save-control-group").classList.remove("show");
    document.getElementById("master-management-panel").style.display = "none";
    document.getElementById("tuningBlock").style.display = "none";
    document.getElementById("passwordInput").value = "";
}

function resetDefaultTemplate() {
    if (confirm("기본 양식으로 복원하시겠습니까?")) {
        localStorage.removeItem(getStorageKey());
        loadTemplate();
    }
}

function extractVariables(template) {
    const seen = new Map();
    const matcher = /\[([^\]]+)\]/g;
    let match;
    while ((match = matcher.exec(template)) !== null) {
        const raw = match[1].trim();
        if (!seen.has(raw)) seen.set(raw, raw);
    }
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
}

function renderDynamicInputs() {
    if (isFreeBroadcastMode()) {
        document.getElementById("dynamic-section").style.display = "none";
        return;
    }

    const template = document.getElementById("templateInput").value;
    const container = document.getElementById("dynamic-inputs-container");
    const vars = extractVariables(template);
    if (vars.length === 0) {
        document.getElementById("dynamic-section").style.display = "none";
        return;
    }

    document.getElementById("dynamic-section").style.display = "block";

    const prev = {};
    vars.forEach((item) => {
        const input = document.getElementById("var_" + item.key);
        prev[item.key] = input ? input.value : (varValues[item.key]?.ko || "");
    });

    container.innerHTML = vars.map((item) => `
        <div class="dyn-grp">
            <label>${getVarIcon(item.key)}${item.label}</label>
            <input type="text" id="var_${item.key}" value="${escapeHtmlAttr(prev[item.key] || "")}" placeholder="${escapeHtmlAttr(item.label)} 입력" oninput="onVarInput('${escapeJsString(item.key)}')">
        </div>
    `).join("");

    composeFinalScript();
}

function getVarIcon(key) {
    if (key.includes("편명") || key.toLowerCase().includes("flight")) return "✈ ";
    if (key.includes("목적지") || key.toLowerCase().includes("dest")) return "📍 ";
    return "📝 ";
}

function onVarInput(key) {
    if (translateTimer) clearTimeout(translateTimer);
    translateTimer = setTimeout(() => autoTranslateVar(key), 700);
    composeFinalScript();
}

async function autoTranslateVar(key) {
    const input = document.getElementById("var_" + key);
    if (!input) return;
    const koValue = input.value.trim();
    if (!koValue) return;

    if (key.includes("편명") || key.toLowerCase().includes("flight")) {
        varValues[key] = {
            ko: expandFlight(koValue, "ko"),
            en: expandFlight(koValue, "en"),
            ja: expandFlight(koValue, "ja"),
            zh: expandFlight(koValue, "zh")
        };
        composeFinalScript();
        return;
    }

    if (translationDic[koValue]) {
        varValues[key] = { ko: koValue, ...translationDic[koValue] };
        composeFinalScript();
        return;
    }

    document.getElementById("translatingBadge").style.display = "inline-block";
    try {
        const [en, ja, zh] = await Promise.all([
            gTranslate(koValue, "en"),
            gTranslate(koValue, "ja"),
            gTranslate(koValue, "zh-CN")
        ]);
        varValues[key] = { ko: koValue, en, ja, zh };
    } catch (error) {
        console.error("Variable translation failed:", error);
        varValues[key] = { ko: koValue, en: koValue, ja: koValue, zh: koValue };
    }
    document.getElementById("translatingBadge").style.display = "none";
    composeFinalScript();
}

function onFreeBroadcastInput() {
    if (freeBroadcastTimer) clearTimeout(freeBroadcastTimer);
    freeBroadcastTimer = setTimeout(() => {
        updateFreeBroadcastPreview();
    }, 250);
    if (!getSelectedFreeLanguage().translateTarget) {
        freeBroadcastPreviewText = document.getElementById("freeBroadcastInput").value;
        document.getElementById("scriptPreview").innerText = freeBroadcastPreviewText;
    }
}

async function updateFreeBroadcastPreview() {
    if (!isFreeBroadcastMode()) return;

    const input = document.getElementById("freeBroadcastInput").value;
    const selectedLanguage = getSelectedFreeLanguage();
    const preview = document.getElementById("scriptPreview");
    const badge = document.getElementById("translatingBadge");
    const requestId = ++freeBroadcastRequestId;

    stopTTSComplete();

    if (!input.trim()) {
        freeBroadcastPreviewText = "";
        preview.innerText = "";
        badge.style.display = "none";
        return;
    }

    if (!selectedLanguage.translateTarget) {
        freeBroadcastPreviewText = input;
        preview.innerText = input;
        badge.style.display = "none";
        return;
    }

    badge.style.display = "inline-block";
    freeBroadcastPreviewText = "";
    preview.innerText = "번역 중...";

    try {
        const translated = await gTranslate(input, selectedLanguage.translateTarget);
        if (requestId !== freeBroadcastRequestId) return;
        freeBroadcastPreviewText = translated;
        preview.innerText = translated;
    } catch (error) {
        if (requestId !== freeBroadcastRequestId) return;
        console.error("Free broadcast translation failed:", error);
        freeBroadcastPreviewText = input;
        preview.innerText = input;
    } finally {
        if (requestId === freeBroadcastRequestId) {
            badge.style.display = "none";
        }
    }
}

async function gTranslate(text, target) {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TTS_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, source: "ko", target, format: "text" })
    });
    const data = await response.json();

    if (!response.ok || data?.error) {
        const message = data?.error?.message || response.statusText || "Translate request failed";
        throw new Error(message);
    }

    const translatedText = data?.data?.translations?.[0]?.translatedText;
    if (!translatedText) {
        throw new Error(`No translation returned for target ${target}`);
    }

    return translatedText;
}

function expandFlight(flight, lang) {
    const ko = { "0": "공", "1": "일", "2": "이", "3": "삼", "4": "사", "5": "오", "6": "육", "7": "칠", "8": "팔", "9": "구" };
    const ja = { "0": "ゼロ", "1": "イチ", "2": "ニ", "3": "サン", "4": "ヨン", "5": "ゴ", "6": "ロク", "7": "ナナ", "8": "ハチ", "9": "キュウ" };
    const zh = { "0": "零", "1": "一", "2": "二", "3": "三", "4": "四", "5": "五", "6": "六", "7": "七", "8": "八", "9": "九" };

    if (lang === "en") {
        const alpha = flight.replace(/[0-9]/g, "").trim();
        const digits = flight.replace(/[^0-9]/g, "").split("").join(" ");
        return (alpha + (digits ? " " + digits : "")).trim();
    }

    return flight.split("").map((char) => {
        if (/[0-9]/.test(char)) {
            if (lang === "ko") return ko[char];
            if (lang === "ja") return ja[char];
            if (lang === "zh") return zh[char];
        }
        return char;
    }).join(" ");
}

function composeFinalScript() {
    if (isFreeBroadcastMode()) {
        document.getElementById("scriptPreview").innerText = freeBroadcastPreviewText;
        return;
    }

    const template = document.getElementById("templateInput").value;
    const vars = extractVariables(template);
    const originalLines = template.split("\n");

    const resultLines = originalLines.map((originalLine) => {
        let line = originalLine;
        const lang = detectOrigLang(originalLine);

        vars.forEach((item) => {
            const values = varValues[item.key];
            const input = document.getElementById("var_" + item.key);
            const ko = values ? values.ko : (input ? input.value : "___");
            const en = values ? values.en : ko;
            const ja = values ? values.ja : ko;
            const zh = values ? values.zh : ko;
            const escapedKey = escRe(item.key);

            let replaceValue = ko;
            if (lang === "en-US") replaceValue = en;
            else if (lang === "ja-JP") replaceValue = ja;
            else if (lang === "zh-CN") replaceValue = zh;

            line = line.replace(new RegExp(`\\[${escapedKey}\\]`, "g"), replaceValue);
            line = line.replace(new RegExp(`\\(${escapedKey}\\)`, "g"), en);
            line = line.replace(new RegExp(`（${escapedKey}）`, "g"), ja);
            line = line.replace(new RegExp(`\\{${escapedKey}\\}`, "g"), zh);
        });

        return line;
    });

    document.getElementById("scriptPreview").innerText = resultLines.join("\n");
}

function detectOrigLang(line) {
    const stripped = line
        .replace(/\[[^\]]+\]/g, "")
        .replace(/\([^)]+\)/g, "")
        .replace(/（[^）]+）/g, "")
        .replace(/\{[^}]+\}/g, "");

    if (/[가-힣]/.test(stripped)) return "ko-KR";
    if (/[\u3040-\u30ff]/.test(stripped)) return "ja-JP";
    if (/[A-Za-z]{3,}/.test(stripped)) return "en-US";
    if (/[\u4e00-\u9fff]/.test(stripped)) return "zh-CN";

    if (/[가-힣]/.test(line)) return "ko-KR";
    if (/[\u3040-\u30ff]/.test(line)) return "ja-JP";
    if (/[A-Za-z]/.test(line)) return "en-US";
    if (/[\u4e00-\u9fff]/.test(line)) return "zh-CN";

    return "ko-KR";
}

function escRe(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtmlAttr(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeJsString(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function playTTS() {
    stopTTSComplete();
    playGoogleTTS();
}

async function playGoogleTTS() {
    speechParts = buildSpeechParts();
    if (speechParts.length === 0) return;

    const pauseButton = document.getElementById("pauseBtn");
    pauseButton.innerText = "음성 생성 중...";
    pauseButton.disabled = true;

    try {
        const results = await Promise.all(speechParts.map((item) => fetchGoogleAudio(item)));
        speechParts.forEach((item, index) => {
            item.audioData = results[index];
        });
    } catch (error) {
        alert("Google TTS 오류: " + error.message);
        pauseButton.disabled = false;
        resetPauseButton();
        return;
    }

    pauseButton.disabled = false;
    resetPauseButton();
    currentSentenceIndex = 0;
    isPaused = false;
    playNext();
}

async function fetchGoogleAudio(item) {
    const voice = GOOGLE_VOICES[item.lang] || GOOGLE_VOICES["ko-KR"];
    const rate = item.lang === "ja-JP"
        ? parseFloat(document.getElementById("rateJA").value)
        : item.lang === "ko-KR"
            ? parseFloat(document.getElementById("rateKO").value)
            : item.lang === "zh-CN"
                ? 0.95
                : parseFloat(document.getElementById("rateEN").value);

    const pitch = item.lang === "ja-JP"
        ? parseFloat(document.getElementById("pitchJA").value)
        : item.lang === "ko-KR"
            ? parseFloat(document.getElementById("pitchKO").value)
            : item.lang === "zh-CN"
                ? 0
                : parseFloat(document.getElementById("pitchEN").value);

    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            input: { text: item.text },
            voice,
            audioConfig: { audioEncoding: "MP3", speakingRate: rate, pitch }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || response.statusText);
    }

    const data = await response.json();
    return data.audioContent;
}

function playNext() {
    if (isPaused || currentSentenceIndex >= speechParts.length) {
        if (currentSentenceIndex >= speechParts.length) resetPauseButton();
        return;
    }

    const item = speechParts[currentSentenceIndex];
    const audio = new Audio("data:audio/mpeg;base64," + item.audioData);
    audio.preload = "auto";
    window._currentAudio = audio;

    audio.addEventListener("ended", function () {
        currentSentenceIndex++;
        playNext();
    });

    audio.addEventListener("error", function () {
        currentSentenceIndex++;
        playNext();
    });

    const playing = audio.play();
    if (playing !== undefined) {
        playing.catch(function () {});
    }
}

function playGoogleQueue() {
    playNext();
}

function buildSpeechParts() {
    if (isFreeBroadcastMode()) {
        const text = (freeBroadcastPreviewText || document.getElementById("scriptPreview").innerText || "").trim();
        if (!text) return [];
        return splitTextForTTS(text, getSelectedFreeLanguage().voiceLang);
    }

    const parts = [];
    const templateLines = document.getElementById("templateInput").value.split("\n");
    const previewLines = document.getElementById("scriptPreview").innerText.split("\n");

    const linePairs = templateLines.map((templateLine, index) => ({
        lang: detectOrigLang(templateLine),
        text: (previewLines[index] || "").trim()
    })).filter((item) => item.text);

    const paragraphs = [];
    linePairs.forEach(({ lang, text }) => {
        if (paragraphs.length > 0 && paragraphs[paragraphs.length - 1].lang === lang) {
            paragraphs[paragraphs.length - 1].text += " " + text;
        } else {
            paragraphs.push({ text, lang });
        }
    });

    paragraphs.forEach(({ text, lang }) => {
        parts.push(...splitTextForTTS(text, lang));
    });

    return parts;
}

function splitTextForTTS(text, lang) {
    const parts = [];
    const pattern = lang === "ja-JP" || lang === "zh-CN"
        ? /([^。！？!?]+[。！？!?]?)/g
        : /([^.!?\n]+[.!?]?)/g;

    const matches = text.match(pattern) || [text];
    matches.forEach((chunk) => {
        const trimmed = chunk.trim();
        if (trimmed) {
            parts.push({ text: trimmed, lang });
        }
    });

    return parts;
}

function detectLang(text) {
    if (/[가-힣]/.test(text)) return "ko-KR";
    if (/[\u3040-\u30ff]/.test(text)) return "ja-JP";
    if (/[\u4e00-\u9fff]/.test(text)) return "zh-CN";
    if (/[A-Za-z]/.test(text)) return "en-US";
    return "ko-KR";
}

function detectParaLang(text) {
    return detectLang(text);
}

function togglePause() {
    const button = document.getElementById("pauseBtn");
    if (!isPaused) {
        isPaused = true;
        if (window._currentAudio) window._currentAudio.pause();
        button.innerText = "방송 재개";
        button.style.background = "var(--green)";
    } else {
        isPaused = false;
        button.innerText = "일시 정지";
        button.style.background = "";
        if (window._currentAudio) {
            const playing = window._currentAudio.play();
            if (playing !== undefined) {
                playing.catch(function () {});
            }
        } else {
            playNext();
        }
    }
}

function stopTTSComplete() {
    if (window._currentAudio) {
        window._currentAudio.pause();
        window._currentAudio = null;
    }
    window.speechSynthesis?.cancel();
    isPaused = false;
    currentSentenceIndex = 0;
    resetPauseButton();
}

function resetPauseButton() {
    isPaused = false;
    const button = document.getElementById("pauseBtn");
    button.innerText = "일시 정지";
    button.style.background = "";
    button.disabled = false;
}
