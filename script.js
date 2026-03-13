// Playlist with BPM info
const playlist = [
  { file: "EDGE_LIVE_XTRACT_49.mp3", title: "EDGE [LIVE XTRACT] #49 | Adelphe", bpm: 165, url: "https://soundcloud.com/czer46/edge-live-xtract" },
  // Add more tracks here (max 5):
  // { file: "track2.mp3", title: "Track Title", bpm: 140, url: "https://soundcloud.com/..." },
  // { file: "track3.mp3", title: "Track Title", bpm: 120, url: "https://soundcloud.com/..." },
  // { file: "track4.mp3", title: "Track Title", bpm: 128, url: "https://soundcloud.com/..." },
  // { file: "track5.mp3", title: "Track Title", bpm: 100, url: "https://soundcloud.com/..." },
];

let currentTrack = null;
let pendingCode = null;
const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL)
  ? window.APP_CONFIG.API_BASE_URL.replace(/\/$/, "")
  : "https://api.mew3.online";

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || "api_error");
    err.code = data.error || "api_error";
    throw err;
  }
  return data;
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

function calculateAnimationDuration(bpm){
  return (60 / bpm) * 2; // Duration in seconds
}

function loadRandomTrack(){
  const randomIndex = Math.floor(Math.random() * playlist.length);
  currentTrack = playlist[randomIndex];
  
  const audio = document.getElementById("bgAudio");
  const source = audio.querySelector("source");
  source.src = currentTrack.file;
  audio.load();
  audio.play().catch(e => console.log("Autoplay failed, might need user interaction"));
  
  updateNowPlaying();
  updatePulseAnimation();
}

function updateNowPlaying(){
  const link = document.querySelector(".now-playing");
  link.href = currentTrack.url;
  link.innerText = `Playing - ${currentTrack.title}`;
}

function updatePulseAnimation(){
  const duration = calculateAnimationDuration(currentTrack.bpm);
  const style = document.documentElement.style;
  style.setProperty("--pulse-duration", duration + "s");
  
  const beforeElement = document.querySelector("body::before");
  if(beforeElement){
    beforeElement.style.animationDuration = duration + "s";
  }
}

// Apply CSS variable for animation
document.addEventListener("DOMContentLoaded", function(){
  const root = document.documentElement;
  root.style.setProperty("--pulse-duration", "0.36s");
});

function toggleMute(){
const audio = document.getElementById("bgAudio")
const btn = document.getElementById("muteBtn")

if(audio.muted){
audio.muted = false
btn.innerText = "AUDIO ON"
}else{
audio.muted = true
btn.innerText = "AUDIO OFF"
}
}

window.onload = function(){
const audio = document.getElementById("bgAudio")
const btn = document.getElementById("muteBtn")

audio.volume = 0.3
btn.innerText = audio.muted ? "AUDIO OFF" : "AUDIO ON"
loadRandomTrack()
refreshStats()
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
}else{
message.innerText = "REGISTRATION FAILED"
}
}

}
