// storage helpers
function getUsers(){return JSON.parse(localStorage.getItem("users")||"{}");}
function setUsers(u){localStorage.setItem("users",JSON.stringify(u));}
function getGames(){return JSON.parse(localStorage.getItem("games")||"{}");}
function setGames(g){localStorage.setItem("games",JSON.stringify(g));}
function getBets(){return JSON.parse(localStorage.getItem("bets")||"{}");}
function setBets(b){localStorage.setItem("bets",JSON.stringify(b));}

// login
let currentUser=null;
function login(){
  let name=document.getElementById("username").value;
  let users=getUsers();
  if(!users[name]) users[name]={balance:1000,bets:[]};
  currentUser=name;
  setUsers(users);
  document.getElementById("loginDiv").style.display="none";
  document.getElementById("dashboardDiv").style.display="block";
  updateDashboard();
}

// dashboard
let parlay=[];
function updateDashboard(){renderGames(); renderBets(); renderLeaderboard(); document.getElementById("userDisplay").innerText=currentUser; document.getElementById("balance").innerText=getUsers()[currentUser].balance;}
function renderGames(){let g=getGames(); let div=document.getElementById("games"); div.innerHTML=""; Object.values(g).filter(x=>x.status==="open").forEach(game=>{ let d=document.createElement("div"); d.innerHTML=`<strong>${game.homeTeam} vs ${game.awayTeam}</strong><br>Moneyline: ${game.homeOdds}/${game.awayOdds}<br>Spread: ${game.homeSpread}/${game.awaySpread}<br>Over/Under:${game.overUnder}<br><button onclick="addParlay('${game.id}','${game.homeTeam}','moneyline')">Bet ${game.homeTeam}</button> <button onclick="addParlay('${game.id}','${game.awayTeam}','moneyline')">Bet ${game.awayTeam}</button> <button onclick="addParlay('${game.id}','${game.homeTeam}','spread')">Spread ${game.homeTeam}</button> <button onclick="addParlay('${game.id}','${game.awayTeam}','spread')">Spread ${game.awayTeam}</button> <button onclick="addParlay('${game.id}','over','overunder')">Over</button> <button onclick="addParlay('${game.id}','under','overunder')">Under</button><hr>`; div.appendChild(d); });}
function addParlay(gameId,team,type){parlay.push({gameId,team,type}); renderParlay();}
function renderParlay(){let ul=document.getElementById("parlayList"); ul.innerHTML=""; parlay.forEach((p,i)=>{let li=document.createElement("li"); li.innerText=`${p.team} (${p.type})`; li.onclick=()=>{parlay.splice(i,1); renderParlay();}; ul.appendChild(li);});}
function placeParlay(){let amt=parseInt(document.getElementById("parlayAmount").value); if(!amt) return alert("Enter amount"); let users=getUsers(); if(amt>users[currentUser].balance) return alert("Not enough balance"); users[currentUser].balance-=amt; let bets=getBets(); parlay.forEach(p=>{let id=Date.now()+Math.random(); bets[id]={...p,username:currentUser,amount:amt,resolved:false,winnings:0};}); setBets(bets); setUsers(users); parlay=[]; renderParlay(); updateDashboard();}
function renderBets(){let bets=getBets(); let ul=document.getElementById("currentBets"); ul.innerHTML=""; Object.values(bets).filter(b=>b.username===currentUser).forEach(b=>{let li=document.createElement("li"); li.innerText=`${b.team} (${b.type}) - ${b.amount} BB - ${b.resolved?"Resolved":"Pending"} - Winnings:${b.winnings}`; ul.appendChild(li);});}
function renderLeaderboard(){let users=getUsers(); let ol=document.getElementById("leaderboard"); ol.innerHTML=""; Object.entries(users).sort((a,b)=>b[1].balance-a[1].balance).forEach(u=>{let li=document.createElement("li"); li.innerText=`${u[0]}: ${u[1].balance} BB`; ol.appendChild(li);});}

// admin
function adminLogin(){let user=document.getElementById("adminUser").value; let pass=document.getElementById("adminPass").value; let adm=JSON.parse(localStorage.getItem("admin")||'{"admin":"password"}'); if(adm[user]===pass){document.getElementById("adminPanel").style.display="block"; alert("Admin logged in"); renderAdminSelect();} else alert("Wrong password");}
function createGame(){let g=getGames(); let id=Date.now().toString(); g[id]={id,homeTeam:homeTeam.value,awayTeam:awayTeam.value,homeOdds:parseFloat(homeOdds.value),awayOdds:parseFloat(awayOdds.value),homeSpread:parseFloat(homeSpread.value),awaySpread:parseFloat(awaySpread.value),overUnder:parseFloat(overUnder.value),status:"open",winner:null}; setGames(g); alert("Game created"); renderAdminSelect();}
function renderAdminSelect(){let select=document.getElementById("resolveSelect"); let g=getGames(); select.innerHTML=""; Object.values(g).filter(x=>x.status==="open").forEach(x=>{let opt=document.createElement("option"); opt.value=x.id; opt.innerText=`${x.homeTeam} vs ${x.awayTeam}`; select.appendChild(opt);});}
function resolveGame(){let g=getGames(); let bets=getBets(); let users=getUsers(); let id=document.getElementById("resolveSelect").value; let h=parseInt(document.getElementById("homeScore").value); let a=parseInt(document.getElementById("awayScore").value); if(!id) return alert("Select game"); let game=g[id]; game.status="closed"; let total=h+a; let winner=h>a?game.homeTeam:a>h?game.awayTeam:null; game.winner=winner; Object.values(bets).filter(b=>b.gameId===id && !b.resolved).forEach(b=>{b.resolved=true; if(b.type==="moneyline") b.winnings=b.team===winner?(b.team===game.homeTeam?game.homeOdds:game.awayOdds)*b.amount:0; if(b.type==="spread"){let spread=b.team===game.homeTeam?h-a-game.homeSpread:a-h-game.awaySpread; b.winnings=spread>0?b.amount*(b.team===game.homeTeam?game.homeOdds:game.awayOdds):0;} if(b.type==="overunder") b.winnings=(b.team==="over" && total>game.overUnder || b.team==="under" && total<game.overUnder)?b.amount*2:0; users[b.username].balance+=b.winnings;}); setBets(bets); setUsers(users); setGames(g); alert("Game resolved"); updateDashboard();}
