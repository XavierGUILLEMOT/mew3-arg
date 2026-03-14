// SoundCloud playlist (easy to extend)
const playlist = [
  { title: "EDGE | Adelphe", url: "https://soundcloud.com/czer46/edge-live-xtract" },
  // Add more tracks here (max 5):
  { title: "Dissolving the illusion | Xelacid", url: "https://soundcloud.com/user-915783576/dissolving-the-illussion-back" },
  // { title: "Track Title", url: "https://soundcloud.com/..." },
  // { title: "Track Title", url: "https://soundcloud.com/..." },
  // { title: "Track Title", url: "https://soundcloud.com/..." },
];

let currentTrack = null;
let currentTrackIndex = -1;
let hasUserStartedAudio = false;
let scWidget = null;
let scReady = false;
let playbackConfirmed = false;
let isAudioLoading = false;
let isMuted = false;
let audioError = false;
let widgetReadyPromise = null;
let playAttemptId = 0;
let playTimeoutId = null;
let needsUserGestureRetry = false;
const SOUND_VOLUME = 35;
const PLAY_RETRY_DELAYS = [0, 300, 900, 1800];
const PLAY_ATTEMPT_TIMEOUT = 3200;
let pendingCode = null;
const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL)
  ? window.APP_CONFIG.API_BASE_URL.replace(/\/$/, "")
  : "https://api.mew3.online";
const API_FALLBACK_URL = (window.APP_CONFIG && window.APP_CONFIG.API_FALLBACK_URL)
  ? window.APP_CONFIG.API_FALLBACK_URL.replace(/\/$/, "")
  : "https://mew3-api.mail-xavierguillemot.workers.dev";
const LANGUAGE_STORAGE_KEY = "mew3_lang";
const SUPPORTED_LANGUAGES = ["fr", "en"];
let currentLanguage = "fr";

const I18N = {
  fr: {
    pageTitle: "VOUS ÊTES OBSERVÉ MAINTENANT",
    pageDescription: "VOUS ÊTES OBSERVÉ. Plusieurs clés sont cachées. Premier arrivé, premier servi.",
    ogTitle: "MEW3 - VOUS ÊTES OBSERVÉ MAINTENANT",
    ogDescription: "Plusieurs clés sont cachées. Premier arrivé, premier servi. Les trouverez-vous ?",
    twitterTitle: "MEW3 - VOUS ÊTES OBSERVÉ MAINTENANT",
    twitterDescription: "Plusieurs clés sont cachées. Premier arrivé, premier servi. Les trouverez-vous ?",
    langLabel: "Langue",
    inAppCornerHintLabel: "OUVRIR DANS LE NAVIGATEUR",
    inAppNotice: "Ouvrez dans votre navigateur externe pour une expérience complète (audio + vérification du code).<br>Instagram : appuyez sur ⋮ puis \"Ouvrir dans le navigateur\".",
    nextBtn: "SUIVANT",
    nextBtnAria: "Lire la piste suivante",
    muteBtnAria: "Activer ou couper l'audio",
    nowPlayingPrefix: "Lecture",
    bootText: "> CONNECTÉ À MEW3.ONLINE </br>\n> VOUS OBSERVEZ </br>\n> PLUSIEURS CLÉS SONT CACHÉES. QUELQUE PART. </br>\n> PREMIER ARRIVÉ, PREMIER SERVI. </br>\n> LES TROUVEREZ-VOUS ?",
    accessTitle: "ENTRER LE CODE",
    codeInputPlaceholder: "CLÉ D'ACCÈS",
    verifyBtn: "VÉRIFIER",
    ticketLabel: "BILLETS - CO2 - NANTES - 02/04/2026",
    subjectsLabel: "SUJETS IDENTIFIÉS",
    recentSubjectsTitle: "SUJETS RÉCENTS",
    popupTitle: "IDENTIFICATION DU SUJET REQUISE",
    usernamePlaceholder: "Nom d'utilisateur",
    firstNamePlaceholder: "Prénom",
    lastNamePlaceholder: "Nom",
    emailPlaceholder: "Email",
    privacyNote: "Seul votre nom d'utilisateur sera public. Votre prénom, nom et email restent confidentiels et servent uniquement à l'envoi des récompenses.",
    registerBtn: "OBSERVER",
    audioError: "ERREUR AUDIO",
    startAudio: "LANCER AUDIO",
    loadingAudio: "CHARGEMENT AUDIO...",
    audioOff: "AUDIO COUPÉ",
    tapToUnlock: "TOUCHEZ POUR ACTIVER",
    audioOn: "AUDIO ACTIVÉ",
    retryAudio: "RELANCER AUDIO",
    enterCode: "ENTREZ UN CODE",
    verifying: "VÉRIFICATION...",
    codeExhausted: "CE CODE EST DÉJÀ UTILISÉ, CONTINUEZ D'OBSERVER",
    networkBlocked: "RÉSEAU BLOQUÉ DANS LE NAVIGATEUR INTÉGRÉ. OUVREZ DANS LE NAVIGATEUR EXTERNE",
    accessDenied: "ACCÈS REFUSÉ",
    verifyCodeFirst: "VÉRIFIEZ D'ABORD LE CODE",
    requiredFields: "NOM D'UTILISATEUR, PRÉNOM, NOM ET EMAIL OBLIGATOIRES",
    eyeMessage: "VOUS AVEZ L'OEIL. VÉRIFIEZ VOTRE EMAIL.",
    alreadyClaimed: "DÉJÀ REVENDIQUÉ AVEC CET EMAIL",
    invalidEmail: "EMAIL INVALIDE",
    registrationFailed: "ÉCHEC DE L'INSCRIPTION"
  },
  en: {
    pageTitle: "YOU ARE WATCHING NOW",
    pageDescription: "YOU ARE WATCHING. Multiple keys are hidden. First come, first served.",
    ogTitle: "MEW3 - YOU ARE WATCHING NOW",
    ogDescription: "Multiple keys are hidden. First come, first served. Will you find them?",
    twitterTitle: "MEW3 - YOU ARE WATCHING NOW",
    twitterDescription: "Multiple keys are hidden. First come, first served. Will you find them?",
    langLabel: "Language",
    inAppCornerHintLabel: "OPEN IN BROWSER",
    inAppNotice: "Open in your external browser for full experience (audio + code verification).<br>Instagram: tap ⋮ then \"Open in browser\".",
    nextBtn: "NEXT",
    nextBtnAria: "Play next track",
    muteBtnAria: "Toggle audio",
    nowPlayingPrefix: "Playing",
    bootText: "> CONNECTED TO MEW3.ONLINE </br>\n> YOU ARE WATCHING </br>\n> MULTIPLE KEYS ARE HIDDEN. SOMEWHERE. </br>\n> FIRST COME, FIRST SERVED. </br>\n> WILL YOU FIND THEM ?",
    accessTitle: "ENTER CODE",
    codeInputPlaceholder: "ACCESS KEY",
    verifyBtn: "VERIFY",
    ticketLabel: "GET TICKETS - CO2 - NANTES - 02/04/2026",
    subjectsLabel: "SUBJECTS IDENTIFIED",
    recentSubjectsTitle: "RECENT SUBJECTS",
    popupTitle: "SUBJECT IDENTIFICATION REQUIRED",
    usernamePlaceholder: "Username",
    firstNamePlaceholder: "First name",
    lastNamePlaceholder: "Last name",
    emailPlaceholder: "Email",
    privacyNote: "Only your username will be public. Your first name, last name and email stay confidential and are used only to deliver rewards.",
    registerBtn: "WATCH",
    audioError: "AUDIO ERROR",
    startAudio: "START AUDIO",
    loadingAudio: "LOADING AUDIO...",
    audioOff: "AUDIO OFF",
    tapToUnlock: "TAP TO UNLOCK",
    audioOn: "AUDIO ON",
    retryAudio: "RETRY AUDIO",
    enterCode: "ENTER A CODE",
    verifying: "VERIFYING...",
    codeExhausted: "CODE IS ALREADY USED, KEEP WATCHING",
    networkBlocked: "NETWORK BLOCKED IN IN-APP BROWSER. OPEN IN EXTERNAL BROWSER",
    accessDenied: "ACCESS DENIED",
    verifyCodeFirst: "VERIFY CODE FIRST",
    requiredFields: "USERNAME, FIRST NAME, LAST NAME AND EMAIL REQUIRED",
    eyeMessage: "YOU HAVE THE EYE. CHECK YOUR EMAIL.",
    alreadyClaimed: "ALREADY CLAIMED WITH THIS EMAIL",
    invalidEmail: "INVALID EMAIL",
    registrationFailed: "REGISTRATION FAILED"
  }
};

function t(key){
  return (I18N[currentLanguage] && I18N[currentLanguage][key]) || I18N.fr[key] || key;
}

function detectLanguage(){
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if(saved && SUPPORTED_LANGUAGES.includes(saved)){
    return saved;
  }
  const browserLang = (navigator.language || "fr").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(browserLang) ? browserLang : "fr";
}

function setText(id, key){
  const el = document.getElementById(id);
  if(el){
    el.innerText = t(key);
  }
}

function setPlaceholder(id, key){
  const el = document.getElementById(id);
  if(el){
    el.placeholder = t(key);
  }
}

function setMeta(selector, value){
  const el = document.querySelector(selector);
  if(el){
    el.setAttribute("content", value);
  }
}

function applyLanguage(lang){
  currentLanguage = SUPPORTED_LANGUAGES.includes(lang) ? lang : "fr";
  localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  document.documentElement.lang = currentLanguage;

  document.title = t("pageTitle");
  setMeta('meta[name="description"]', t("pageDescription"));
  setMeta('meta[property="og:title"]', t("ogTitle"));
  setMeta('meta[property="og:description"]', t("ogDescription"));
  setMeta('meta[name="twitter:title"]', t("twitterTitle"));
  setMeta('meta[name="twitter:description"]', t("twitterDescription"));

  setText("langLabel", "langLabel");
  setText("inAppCornerHintLabel", "inAppCornerHintLabel");
  setText("accessTitle", "accessTitle");
  setText("verifyBtn", "verifyBtn");
  setText("ticketLabel", "ticketLabel");
  setText("subjectsLabel", "subjectsLabel");
  setText("recentSubjectsTitle", "recentSubjectsTitle");
  setText("popupTitle", "popupTitle");
  setText("privacyNote", "privacyNote");
  setText("registerBtn", "registerBtn");

  setPlaceholder("codeInput", "codeInputPlaceholder");
  setPlaceholder("username", "usernamePlaceholder");
  setPlaceholder("firstName", "firstNamePlaceholder");
  setPlaceholder("lastName", "lastNamePlaceholder");
  setPlaceholder("email", "emailPlaceholder");

  const inAppNotice = document.getElementById("inAppNotice");
  if(inAppNotice){
    inAppNotice.innerHTML = t("inAppNotice");
  }

  const bootText = document.getElementById("bootText");
  if(bootText){
    bootText.innerHTML = t("bootText");
  }

  const nextBtn = document.getElementById("nextBtn");
  if(nextBtn){
    nextBtn.innerText = t("nextBtn");
    nextBtn.setAttribute("aria-label", t("nextBtnAria"));
  }

  const muteBtn = document.getElementById("muteBtn");
  if(muteBtn){
    muteBtn.setAttribute("aria-label", t("muteBtnAria"));
  }

  const langSelect = document.getElementById("langSelect");
  if(langSelect){
    langSelect.value = currentLanguage;
  }

  updateNowPlaying();
  updateAudioButtonLabel();
}

function isInAppBrowser(){
  const ua = navigator.userAgent || "";
  return /Instagram|FBAN|FBAV|FB_IAB|Messenger|TikTok|musical_ly/i.test(ua);
}

function showInAppNotice(){
  const notice = document.getElementById("inAppNotice");
  const cornerHint = document.getElementById("inAppCornerHint");
  const inApp = isInAppBrowser();

  document.body.classList.toggle("in-app-mode", inApp);

  if(notice){
    notice.hidden = !inApp;
  }

  if(cornerHint){
    cornerHint.hidden = !inApp;
  }
}

async function apiFetch(path, options = {}) {
  const requestOptions = {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  };

  async function doFetch(baseUrl){
    const response = await fetch(`${baseUrl}${path}`, requestOptions);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data.error || "api_error");
      err.code = data.error || "api_error";
      throw err;
    }
    return data;
  }

  try{
    return await doFetch(API_BASE_URL);
  }catch(e){
    const isNetworkError = e && (e.name === "TypeError" || e.message === "Failed to fetch");
    if(isNetworkError && API_FALLBACK_URL && API_FALLBACK_URL !== API_BASE_URL){
      try{
        return await doFetch(API_FALLBACK_URL);
      }catch(_fallbackError){
        const err = new Error("network_error");
        err.code = "network_error";
        throw err;
      }
    }
    throw e;
  }
}

function updateSubjectsList(usernames) {
  const list = document.getElementById("playersList");
  list.innerHTML = "";

  if (!usernames.length) {
    const li = document.createElement("li");
    li.innerText = "...";
    list.appendChild(li);
    return;
  }

  usernames.forEach((name) => {
    const li = document.createElement("li");
    li.innerText = name;
    list.appendChild(li);
  });
}

async function refreshStats() {
  try {
    const stats = await apiFetch("/api/stats", { method: "GET", headers: {} });
    document.getElementById("subjectCount").innerText = String(stats.total || 0);
    updateSubjectsList((stats.recent || []).map((r) => r.username));
  } catch (_e) {
    // Keep existing UI placeholders when backend is unavailable.
  }
}

function pickRandomTrackIndex(){
  if(playlist.length <= 1){
    return 0;
  }

  let randomIndex = currentTrackIndex;
  while(randomIndex === currentTrackIndex){
    randomIndex = Math.floor(Math.random() * playlist.length);
  }
  return randomIndex;
}

function updateNowPlaying(){
  const link = document.querySelector(".now-playing");
  if(!link || !currentTrack){
    return;
  }

  link.href = currentTrack.url;
  link.innerText = `${t("nowPlayingPrefix")} - ${currentTrack.title}`;
}

function updateAudioButtonLabel(){
  const btn = document.getElementById("muteBtn");
  if(!btn){
    return;
  }

  if(audioError){
    btn.innerText = t("audioError");
    return;
  }

  if(!hasUserStartedAudio){
    btn.innerText = t("startAudio");
    return;
  }

  if(isAudioLoading){
    btn.innerText = t("loadingAudio");
    return;
  }

  if(isMuted){
    btn.innerText = t("audioOff");
  }else if(needsUserGestureRetry){
    btn.innerText = t("tapToUnlock");
  }else if(playbackConfirmed){
    btn.innerText = t("audioOn");
  }else{
    btn.innerText = t("retryAudio");
  }
}

function ensureWidgetReady(){
  if(scReady && scWidget){
    return Promise.resolve();
  }

  if(widgetReadyPromise){
    return widgetReadyPromise;
  }

  widgetReadyPromise = new Promise((resolve, reject) => {
    const iframe = document.getElementById("scPlayer");
    if(!iframe || !window.SC || !window.SC.Widget){
      widgetReadyPromise = null;
      reject(new Error("soundcloud_unavailable"));
      return;
    }

    scWidget = window.SC.Widget(iframe);
    let settled = false;

    const markReady = () => {
      if(settled){
        return;
      }
      settled = true;
      scReady = true;
      audioError = false;
      applyWidgetVolume();
      updateAudioButtonLabel();
      resolve();
    };

    const failReady = () => {
      audioError = true;
      isAudioLoading = false;
      updateAudioButtonLabel();
      if(!settled){
        settled = true;
        widgetReadyPromise = null;
        reject(new Error("soundcloud_widget_error"));
      }
    };

    scWidget.bind(window.SC.Widget.Events.READY, markReady);

    scWidget.bind(window.SC.Widget.Events.PLAY, () => {
      playbackConfirmed = true;
      isAudioLoading = false;
      audioError = false;
      needsUserGestureRetry = false;
      if(playTimeoutId){
        clearTimeout(playTimeoutId);
        playTimeoutId = null;
      }
      updateAudioButtonLabel();
    });

    scWidget.bind(window.SC.Widget.Events.PAUSE, () => {
      if(!isMuted){
        playbackConfirmed = false;
      }
    });

    scWidget.bind(window.SC.Widget.Events.FINISH, () => {
      if(hasUserStartedAudio && !isMuted){
        nextTrack();
      }
    });

    scWidget.bind(window.SC.Widget.Events.ERROR, failReady);

    setTimeout(() => {
      if(!settled){
        failReady();
      }
    }, 6000);
  });

  return widgetReadyPromise;
}

function clearPlayAttemptTimeout(){
  if(playTimeoutId){
    clearTimeout(playTimeoutId);
    playTimeoutId = null;
  }
}

function requestPlayWithRetries(){
  if(!scWidget || isMuted){
    return;
  }

  playAttemptId += 1;
  const thisAttempt = playAttemptId;

  isAudioLoading = true;
  audioError = false;
  needsUserGestureRetry = false;
  updateAudioButtonLabel();

  clearPlayAttemptTimeout();

  PLAY_RETRY_DELAYS.forEach((delay) => {
    setTimeout(() => {
      if(thisAttempt !== playAttemptId || !scWidget || isMuted || playbackConfirmed){
        return;
      }
      try{
        scWidget.play();
      }catch(_e){
        // Keep silent and continue retries.
      }
    }, delay);
  });

  playTimeoutId = setTimeout(() => {
    if(thisAttempt !== playAttemptId || !scWidget){
      return;
    }

    scWidget.isPaused((paused) => {
      if(thisAttempt !== playAttemptId){
        return;
      }

      if(paused === false){
        playbackConfirmed = true;
      }

      if(!playbackConfirmed){
        isAudioLoading = false;
        if(hasUserStartedAudio && !isMuted){
          needsUserGestureRetry = true;
        }
      }
      updateAudioButtonLabel();
    });

    if(!playbackConfirmed){
      isAudioLoading = false;
      if(hasUserStartedAudio && !isMuted){
        needsUserGestureRetry = true;
      }
      updateAudioButtonLabel();
    }
  }, PLAY_ATTEMPT_TIMEOUT);
}

function triggerPlayFromGesture(){
  if(!scWidget || isMuted){
    return;
  }

  try{
    scWidget.play();
  }catch(_e){
    // Retry flow below still handles browsers that reject direct play.
  }

  requestPlayWithRetries();
}

function applyWidgetVolume(){
  if(!scWidget){
    return;
  }
  scWidget.setVolume(isMuted ? 0 : SOUND_VOLUME);
}

function loadTrack(index, autoplay){
  currentTrackIndex = index;
  currentTrack = playlist[index];
  updateNowPlaying();

  if(!scWidget){
    return;
  }

  playbackConfirmed = false;
  audioError = false;
  isAudioLoading = Boolean(autoplay && !isMuted);
  needsUserGestureRetry = false;

  scWidget.load(currentTrack.url, {
    auto_play: Boolean(autoplay),
    buying: false,
    sharing: false,
    download: false,
    show_artwork: false,
    show_comments: false,
    show_playcount: false,
    show_user: false,
    show_reposts: false,
    hide_related: true,
    visual: false,
  });

  applyWidgetVolume();

  if(autoplay && !isMuted){
    requestPlayWithRetries();
  }

  updateAudioButtonLabel();
}

function startPlaying(){
  hasUserStartedAudio = true;
  isMuted = false;
  playbackConfirmed = false;
  isAudioLoading = true;
  audioError = false;
  needsUserGestureRetry = false;
  updateAudioButtonLabel();

  const startWhenReady = () => {
    if(currentTrackIndex < 0){
      currentTrackIndex = pickRandomTrackIndex();
    }

    // Keep widget load separate from play; explicit play is more reliable on mobile gesture rules.
    loadTrack(currentTrackIndex, false);
    triggerPlayFromGesture();
    updateAudioButtonLabel();
  };

  if(scWidget && scReady){
    startWhenReady();
    return;
  }

  ensureWidgetReady()
    .then(() => {
      if(hasUserStartedAudio && !isMuted){
        startWhenReady();
      }
    })
    .catch(() => {
      audioError = true;
      isAudioLoading = false;
      updateAudioButtonLabel();
    });
}

function loadRandomTrack(){
  const nextIndex = pickRandomTrackIndex();
  if(currentTrackIndex < 0){
    loadTrack(nextIndex, false);
    updateAudioButtonLabel();
    return;
  }

  loadTrack(nextIndex, hasUserStartedAudio);
}

async function nextTrack(){
  if(!playlist.length){
    return;
  }

  await ensureWidgetReady().catch(() => {});

  if(!scWidget){
    return;
  }

  const nextIndex = currentTrackIndex < 0
    ? 0
    : (currentTrackIndex + 1) % playlist.length;

  loadTrack(nextIndex, hasUserStartedAudio && !isMuted);
}

function toggleMute(){
  if(!hasUserStartedAudio){
    startPlaying();
    return;
  }

  if(audioError){
    startPlaying();
    return;
  }

  isMuted = !isMuted;
  applyWidgetVolume();

  if(isMuted){
    playbackConfirmed = false;
    isAudioLoading = false;
    needsUserGestureRetry = false;
    clearPlayAttemptTimeout();
    if(scWidget){
      scWidget.pause();
    }
  }else if(scWidget){
    requestPlayWithRetries();
  }

  updateAudioButtonLabel();
}

window.onload = function(){
  applyLanguage(detectLanguage());

  const langSelect = document.getElementById("langSelect");
  if(langSelect){
    langSelect.addEventListener("change", (event) => {
      applyLanguage(event.target.value);
    });
  }

  showInAppNotice();
  updateAudioButtonLabel();
  loadRandomTrack();
  refreshStats();

  // Prime the widget early but keep autoplay disabled until explicit user action.
  ensureWidgetReady()
    .then(() => {
      if(currentTrackIndex >= 0){
        loadTrack(currentTrackIndex, false);
      }
    })
    .catch(() => {
      audioError = true;
      isAudioLoading = false;
      updateAudioButtonLabel();
    });

  const unlockAudio = () => {
    if(scWidget && hasUserStartedAudio && !isMuted && !playbackConfirmed){
      requestPlayWithRetries();
    }
  };

  document.addEventListener("pointerdown", unlockAudio, { passive: true });
  document.addEventListener("touchstart", unlockAudio, { passive: true });
};

async function verifyCode(){

const code = document.getElementById("codeInput").value
const message = document.getElementById("message")

if(!code.trim()){
message.innerText = t("enterCode")
return
}

message.innerText = t("verifying")

try{
await apiFetch("/api/verify-code", {
method: "POST",
body: JSON.stringify({ code })
})

pendingCode = code
message.innerText = ""
document.getElementById("popup").style.display="flex"
}catch(e){
if(e.code === "exhausted"){
message.innerText = t("codeExhausted")
}else if(e.code === "network_error"){
message.innerText = t("networkBlocked")
}else{
message.innerText = t("accessDenied")
}
}

}

async function register(){

const username = document.getElementById("username").value
const firstName = document.getElementById("firstName").value
const lastName = document.getElementById("lastName").value
const email = document.getElementById("email").value
const message = document.getElementById("message")

if(!pendingCode){
message.innerText = t("verifyCodeFirst")
return
}

if(!username.trim() || !firstName.trim() || !lastName.trim() || !email.trim()){
message.innerText = t("requiredFields")
return
}

try{
await apiFetch("/api/register", {
method: "POST",
body: JSON.stringify({
username,
firstName,
lastName,
email,
code: pendingCode
})
})

document.getElementById("popup").style.display="none"

message.innerText =
t("eyeMessage")

pendingCode = null
refreshStats()
}catch(e){
if(e.code === "already_claimed"){
message.innerText = t("alreadyClaimed")
}else if(e.code === "invalid_email"){
message.innerText = t("invalidEmail")
}else if(e.code === "exhausted"){
message.innerText = t("codeExhausted")
}else if(e.code === "network_error"){
message.innerText = t("networkBlocked")
}else{
message.innerText = t("registrationFailed")
}
}

}
