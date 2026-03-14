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
let hasStarted = false;   // user has pressed play at least once
let isPlaying = false;    // audio is currently playing
let isLoading = false;    // widget is initialising
let audioError = false;
let scWidget = null;
let scReady = false;
let widgetReadyPromise = null;
const SOUND_VOLUME = 35;
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
  if(!link || !currentTrack) return;
  link.href = currentTrack.url;
  link.innerText = `${t("nowPlayingPrefix")} - ${currentTrack.title}`;
}

function updateAudioButtonLabel(){
  const btn = document.getElementById("muteBtn");
  if(!btn) return;

  if(audioError){
    btn.innerText = t("audioError");
  } else if(isLoading){
    btn.innerText = t("loadingAudio");
  } else if(isPlaying){
    btn.innerText = t("audioOn");
  } else if(hasStarted){
    btn.innerText = t("audioOff");
  } else {
    btn.innerText = t("startAudio");
  }
}

function ensureWidgetReady(){
  if(scReady && scWidget) return Promise.resolve();
  if(widgetReadyPromise) return widgetReadyPromise;

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
      if(settled) return;
      settled = true;
      scReady = true;
      audioError = false;
      scWidget.setVolume(SOUND_VOLUME);
      isLoading = false;
      updateAudioButtonLabel();
      resolve();
    };

    const failReady = () => {
      audioError = true;
      isLoading = false;
      updateAudioButtonLabel();
      if(!settled){
        settled = true;
        widgetReadyPromise = null;
        reject(new Error("soundcloud_widget_error"));
      }
    };

    scWidget.bind(window.SC.Widget.Events.READY, markReady);
    scWidget.bind(window.SC.Widget.Events.PLAY, () => {
      isPlaying = true;
      isLoading = false;
      audioError = false;
      updateAudioButtonLabel();
    });
    scWidget.bind(window.SC.Widget.Events.PAUSE, () => {
      isPlaying = false;
      updateAudioButtonLabel();
    });
    scWidget.bind(window.SC.Widget.Events.FINISH, () => {
      isPlaying = false;
      if(hasStarted) nextTrack();
    });
    scWidget.bind(window.SC.Widget.Events.ERROR, failReady);

    setTimeout(() => { if(!settled) failReady(); }, 8000);
  });

  return widgetReadyPromise;
}

// Loads a track URL into the iframe via src swap and starts playback.
// This is the only reliable way to start audio on iOS Safari because
// widget.play() goes through postMessage (async) and breaks the gesture chain.
function loadAndPlayViaIframe(url){
  const iframe = document.getElementById("scPlayer");
  if(!iframe) return;
  scWidget = null;
  scReady = false;
  widgetReadyPromise = null;
  isLoading = true;
  isPlaying = false;
  updateAudioButtonLabel();
  const encodedUrl = encodeURIComponent(url);
  iframe.src = "https://w.soundcloud.com/player/?url=" + encodedUrl
    + "&auto_play=true&hide_related=true&show_comments=false"
    + "&show_user=false&show_reposts=false&visual=false"
    + "&buying=false&sharing=false&download=false&show_playcount=false";
  ensureWidgetReady().catch(() => {
    audioError = true;
    isLoading = false;
    updateAudioButtonLabel();
  });
}

// Called by the AUDIO button (onclick="toggleMute()")
function toggleMute(){
  if(audioError){
    // Reset and retry from scratch
    audioError = false;
    hasStarted = false;
    isPlaying = false;
    isLoading = false;
    scWidget = null;
    scReady = false;
    widgetReadyPromise = null;
  }

  if(!hasStarted){
    // First press: pick a random track and start playing
    hasStarted = true;
    if(currentTrackIndex < 0){
      currentTrackIndex = pickRandomTrackIndex();
      currentTrack = playlist[currentTrackIndex];
      updateNowPlaying();
    }
    loadAndPlayViaIframe(currentTrack.url);
    return;
  }

  // Widget not ready yet (still loading) — ignore extra taps
  if(!scReady || !scWidget) return;

  if(isPlaying){
    scWidget.pause();
  } else {
    scWidget.play();
  }
}

function nextTrack(){
  if(!playlist.length) return;

  const nextIndex = currentTrackIndex < 0
    ? 0
    : (currentTrackIndex + 1) % playlist.length;

  currentTrackIndex = nextIndex;
  currentTrack = playlist[currentTrackIndex];
  updateNowPlaying();

  // If user hasn't started audio yet, just update the label
  if(!hasStarted) return;

  // Swap src so next track starts playing straight away
  loadAndPlayViaIframe(currentTrack.url);
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

  // Pick a random track for the "now playing" label — no widget init until button press.
  currentTrackIndex = pickRandomTrackIndex();
  currentTrack = playlist[currentTrackIndex];
  updateNowPlaying();
  updateAudioButtonLabel();
  refreshStats();
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
