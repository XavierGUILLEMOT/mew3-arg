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
btn.innerText = "🔊"
}else{
audio.muted = true
btn.innerText = "🔇"
}
}

window.onload = function(){
document.getElementById("bgAudio").volume = 0.3
loadRandomTrack()
}

function verifyCode(){

const code = document.getElementById("codeInput").value

if(code === "panopticon"){
document.getElementById("popup").style.display="flex"
}else{
document.getElementById("message").innerText="ACCESS DENIED"
}

}

function register(){

const username = document.getElementById("username").value

document.getElementById("popup").style.display="none"

document.getElementById("message").innerText =
"YOU HAVE THE EYE. CHECK YOUR EMAIL."

}
