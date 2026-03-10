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
