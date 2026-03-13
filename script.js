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
const SOUND_VOLUME = 35;
let pendingCode = null;
const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL)
  ? window.APP_CONFIG.API_BASE_URL.replace(/\/$/, "")
  : "https://api.mew3.online";
const API_FALLBACK_URL = (window.APP_CONFIG && window.APP_CONFIG.API_FALLBACK_URL)
  ? window.APP_CONFIG.API_FALLBACK_URL.replace(/\/$/, "")
  : "https://mew3-api.mail-xavierguillemot.workers.dev";

function isInAppBrowser(){
  const ua = navigator.userAgent || "";
  const patterns = [
    /Instagram/i,
    /FBAN|FBAV|FB_IAB/i,
    /TikTok|musical_ly/i,
  ];
  return patterns.some((re) => re.test(ua));
}

function showInAppNotice(){
  const notice = document.getElementById("inAppNotice");
  const cornerHint = document.getElementById("inAppCornerHint");
  const inApp = isInAppBrowser();

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
  link.innerText = `Playing - ${currentTrack.title}`;
}

function updateAudioButtonLabel(){
  const btn = document.getElementById("muteBtn");
  if(!btn){
    return;
  }

  if(!hasUserStartedAudio){
    btn.innerText = "START PLAYING";
    return;
  }

  if(isAudioLoading){
    btn.innerText = "LOADING AUDIO...";
    return;
  }

  if(isMuted){
    btn.innerText = "AUDIO OFF";
  }else{
    btn.innerText = "AUDIO ON";
  }
}

function ensureWidgetReady(){
  if(scReady && scWidget){
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const iframe = document.getElementById("scPlayer");
    if(!iframe || !window.SC || !window.SC.Widget){
      reject(new Error("soundcloud_unavailable"));
      return;
    }

    scWidget = window.SC.Widget(iframe);

    scWidget.bind(window.SC.Widget.Events.READY, () => {
      scReady = true;
      resolve();
    });

    scWidget.bind(window.SC.Widget.Events.PLAY, () => {
      playbackConfirmed = true;
      isAudioLoading = false;
      updateAudioButtonLabel();
    });

    scWidget.bind(window.SC.Widget.Events.PAUSE, () => {
      playbackConfirmed = false;
    });

    scWidget.bind(window.SC.Widget.Events.ERROR, () => {
      reject(new Error("soundcloud_widget_error"));
    });
  });
}

function requestPlayWithRetries(){
  if(!scWidget || isMuted){
    return;
  }

  isAudioLoading = true;
  updateAudioButtonLabel();

  const retryDelays = [0, 300, 900, 1800];
  retryDelays.forEach((delay) => {
    setTimeout(() => {
      if(!scWidget || isMuted || playbackConfirmed){
        return;
      }
      try{
        scWidget.play();
      }catch(_e){
        // Keep silent and continue retries.
      }
    }, delay);
  });

  setTimeout(() => {
    if(!playbackConfirmed){
      isAudioLoading = false;
      updateAudioButtonLabel();
    }
  }, 2200);
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
  updateAudioButtonLabel();
}

async function startPlaying(){
  hasUserStartedAudio = true;
  isMuted = false;
  playbackConfirmed = false;
  isAudioLoading = true;
  updateAudioButtonLabel();

  await ensureWidgetReady();
  if(currentTrackIndex < 0){
    currentTrackIndex = pickRandomTrackIndex();
  }

  loadTrack(currentTrackIndex, true);

  requestPlayWithRetries();
  updateAudioButtonLabel();
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

  const nextIndex = currentTrackIndex < 0
    ? 0
    : (currentTrackIndex + 1) % playlist.length;

  loadTrack(nextIndex, hasUserStartedAudio);

  if(hasUserStartedAudio && scWidget && !isMuted){
    requestPlayWithRetries();
  }
}

function toggleMute(){
if(!hasUserStartedAudio){
startPlaying();
return;
}

if(!playbackConfirmed && !isMuted){
  requestPlayWithRetries();
  return;
}

isMuted = !isMuted;
applyWidgetVolume();
if(!isMuted && scWidget){
  requestPlayWithRetries();
}
updateAudioButtonLabel();
}

window.onload = function(){
showInAppNotice();
updateAudioButtonLabel();
loadRandomTrack();
refreshStats();

ensureWidgetReady()
  .then(() => {
    if(currentTrackIndex >= 0){
      loadTrack(currentTrackIndex, false);
    }
  })
  .catch(() => {
    const btn = document.getElementById("muteBtn");
    if(btn){
      btn.innerText = "AUDIO ERROR";
    }
  });
}

async function verifyCode(){

const code = document.getElementById("codeInput").value
const message = document.getElementById("message")

if(!code.trim()){
message.innerText = "ENTER A CODE"
return
}

message.innerText = "VERIFYING..."

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
message.innerText = "CODE IS ALREADY USED, KEEP WATCHING"
}else if(e.code === "network_error"){
message.innerText = "NETWORK BLOCKED IN IN-APP BROWSER. OPEN IN EXTERNAL BROWSER"
}else{
message.innerText = "ACCESS DENIED"
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
message.innerText = "VERIFY CODE FIRST"
return
}

if(!username.trim() || !firstName.trim() || !lastName.trim() || !email.trim()){
message.innerText = "USERNAME, FIRST NAME, LAST NAME AND EMAIL REQUIRED"
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
"YOU HAVE THE EYE. CHECK YOUR EMAIL."

pendingCode = null
refreshStats()
}catch(e){
if(e.code === "already_claimed"){
message.innerText = "ALREADY CLAIMED WITH THIS EMAIL"
}else if(e.code === "invalid_email"){
message.innerText = "INVALID EMAIL"
}else if(e.code === "exhausted"){
message.innerText = "CODE IS ALREADY USED, KEEP WATCHING"
}else if(e.code === "network_error"){
message.innerText = "NETWORK BLOCKED IN IN-APP BROWSER. OPEN IN EXTERNAL BROWSER"
}else{
message.innerText = "REGISTRATION FAILED"
}
}

}
