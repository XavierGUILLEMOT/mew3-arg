async function checkKey(){

const answer = document.getElementById("answer").value

const res = await fetch("/api/check",{
 method:"POST",
 headers:{ "Content-Type":"application/json" },
 body:JSON.stringify({answer})
})

const data = await res.json()

if(data.success){

 document.getElementById("popup").style.display = "flex"

}else{

 document.getElementById("result").innerText = "ACCESS DENIED"

}

}

async function register(){

const username = document.getElementById("username").value
const email = document.getElementById("email").value

const res = await fetch("/api/register",{
 method:"POST",
 headers:{ "Content-Type":"application/json" },
 body:JSON.stringify({username,email})
})

const data = await res.json()

if(data.success){

 document.getElementById("popup").style.display = "none"

 document.getElementById("result").innerText =
 "SUBJECT REGISTERED — ID #" + data.position

}else{

 document.getElementById("result").innerText =
 data.message

}

}