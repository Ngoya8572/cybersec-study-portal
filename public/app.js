const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={user:null,view:'dashboard',authMode:'login',authMsg:'',units:[],unit:null,slug:null,quizResult:null,results:null,leaderboard:null,admin:null,passMark:70};

async function api(url,opts={}) {
  const options={credentials:'same-origin',headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts};
  if(opts.body && typeof opts.body!=='string') options.body=JSON.stringify(opts.body);
  const res=await fetch(url,options);
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||`Request failed (${res.status})`);
  return data;
}
function toast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.append(el);setTimeout(()=>el.remove(),3500)}
async function loadUnits(){const d=await api('/api/units');state.units=d.units;state.passMark=d.passMark}
async function loadResults(){state.results=await api('/api/results')}
async function loadLeaderboard(){state.leaderboard=await api('/api/leaderboard')}
async function loadAdmin(){state.admin=await api('/api/admin/students')}
async function loadUnit(slug){state.unit=await api('/api/units/'+encodeURIComponent(slug));state.slug=slug}
async function boot(){try{const d=await api('/api/me');state.user=d.user;await loadUnits()}catch{}render()}
function render(){
 if(!state.user)return renderAuth();
 renderShell();
 const main=$('#main');
 if(state.view==='unit')main.innerHTML=viewUnit();
 else if(state.view==='quiz')main.innerHTML=viewQuiz();
 else if(state.view==='results')main.innerHTML=viewResults();
 else if(state.view==='leaderboard')main.innerHTML=viewLeaderboard();
 else if(state.view==='admin')main.innerHTML=viewAdmin();
 else if(state.view==='profile')main.innerHTML=viewProfile();
 else main.innerHTML=viewDashboard();
 attach();
}
function renderAuth(){
 const register=state.authMode==='register';
 $('#app').innerHTML=`<div class="auth-wrap"><div class="auth-card">
 <div class="brand"><div class="logo">🛡️</div><div><h1>CyberSec Study Portal</h1><p>Study, practise and track your progress</p></div></div>
 <div class="tabs"><button data-mode="login" class="${!register?'on':''}">Sign in</button><button data-mode="register" class="${register?'on':''}">Create account</button></div>
 <form id="authForm">${register?'<label>Full name</label><input id="name" required minlength="2" autocomplete="name">':''}
 <label>Email address</label><input id="email" type="email" required autocomplete="username">
 <label>Password</label><input id="password" type="password" required minlength="6" autocomplete="${register?'new-password':'current-password'}">
 ${register?'<label>Confirm password</label><input id="confirm" type="password" required minlength="6">':''}
 <button class="btn full">${register?'Create account':'Sign in'}</button></form>
 <div class="message">${esc(state.authMsg)}</div>
 <p class="hint">${register?'The first registered account automatically becomes the instructor/admin.':'Create an account to access course units and assessments.'}</p>
 </div></div>`;
 $$('[data-mode]').forEach(b=>b.onclick=()=>{state.authMode=b.dataset.mode;state.authMsg='';renderAuth()});
 $('#authForm').onsubmit=async e=>{e.preventDefault();try{
 const password=$('#password').value;
 if(register && password!==$('#confirm').value)throw Error('Passwords do not match');
 const data=await api(register?'/api/register':'/api/login',{method:'POST',body:register?{name:$('#name').value,email:$('#email').value,password}:{email:$('#email').value,password}});
 state.user=data.user;await loadUnits();state.view='dashboard';render();
 }catch(err){state.authMsg=err.message;renderAuth()}};
}
function renderShell(){
 const nav=[['dashboard','🏠','Dashboard'],['units','📚','Course units'],['results','📈','My results'],['leaderboard','🏆','Leaderboard']];
 if(state.user.role==='admin')nav.push(['admin','⚙️','Instructor panel']);
 $('#app').innerHTML=`<div class="layout"><aside class="sidebar">
 <div class="brand"><div class="logo">🛡️</div><div><h1>CyberSec Portal</h1><p>Study & assessment</p></div></div>
 ${nav.map(([id,icon,label])=>`<div class="nav-item ${(state.view===id||(['unit','quiz'].includes(state.view)&&id==='units'))?'on':''}" data-nav="${id}">${icon} &nbsp;${label}</div>`).join('')}
 <div class="spacer"></div><div class="user-chip"><b>${esc(state.user.name)}</b><small>${state.user.role==='admin'?'Instructor / Admin':'Student'}</small></div>
 <div class="side-actions"><button class="btn ghost small" data-nav="profile">Profile</button><button class="btn ghost small" id="logout">Sign out</button></div>
 </aside><main class="main" id="main"></main></div>`;
}
function header(title,sub,extra=''){return `<div class="page-head"><div><h2>${title}</h2><p>${sub}</p></div>${extra}</div>`}
function stat(label,value,sub){return `<div class="card stat"><div class="k">${label}</div><div class="v">${value}</div><div class="s">${sub||''}</div></div>`}
function unitCards(){return `<div class="grid g3">${state.units.map(u=>`<div class="card unit-card" data-unit="${esc(u.slug)}">
 <div class="unit-top"><div class="unit-icon">${esc(u.icon)}</div><div><h3>${esc(u.title)}</h3><span class="badge ${u.status}">${u.status==='new'?'Not started':u.status==='pass'?'Passed':'Keep practising'}</span></div></div>
 <p class="desc">${esc(u.summary)}</p><div class="bar"><i style="width:${u.best||0}%"></i></div>
 <div class="bar-row"><span>${u.lessonCount} lessons · ${u.questionCount} questions</span><b>${u.best||0}% best</b></div></div>`).join('')}</div>`}
function viewDashboard(){
 const passed=state.units.filter(u=>u.status==='pass').length;
 const attempts=state.units.reduce((s,u)=>s+u.attempts,0);
 const avg=state.units.length?Math.round(state.units.reduce((s,u)=>s+(u.best||0),0)/state.units.length):0;
 return header(`Welcome, ${esc(state.user.name.split(' ')[0])} 👋`,'Continue learning and monitor your cyber security progress.')+
 `<div class="grid g4" style="margin-bottom:22px">${stat('Course units',state.units.length,'Available learning units')}${stat('Units passed',passed,`Pass mark: ${state.passMark}%`)}${stat('Quiz attempts',attempts,'All submitted attempts')}${stat('Average best score',avg+'%','Across all units')}</div><h3>Learning path</h3>${unitCards()}`;
}
function viewUnit(){
 if(!state.unit)return '<p>Loading unit…</p>';
 const u=state.unit.unit;
 return header(`${esc(u.icon)} ${esc(u.title)}`,esc(u.summary),'<button class="btn" id="startQuiz">Start assessment →</button>')+
 `<div class="card" style="margin-bottom:18px"><b>Your best score: ${u.best||0}%</b> &nbsp; <span class="badge ${u.status}">${u.status}</span><p class="muted">Pass mark is ${state.passMark}%. You can retake the quiz to improve your score.</p></div><h3>Lessons</h3>`+
 state.unit.lessons.map((l,i)=>`<details class="lesson" ${i===0?'open':''}><summary>${i+1}. ${esc(l.title)}</summary><div class="body">${esc(l.content).replace(/\n/g,'<br>')}</div></details>`).join('')+
 `<button class="btn" id="startQuiz">Take unit quiz →</button>`;
}
function viewQuiz(){
 if(state.quizResult){const r=state.quizResult;return header('Assessment results','Review your score and explanations.')+
 `<div class="card"><div class="score">${r.percentage}%</div><h3>${r.passed?'🎉 Congratulations — you passed!':'Keep practising — you can retake this quiz.'}</h3><p>You scored <b>${r.score} out of ${r.total}</b>. Pass mark: ${r.passMark}%.</p><button class="btn" id="retake">Retake quiz</button> <button class="btn ghost" id="backUnit">Back to lessons</button></div>`+
 r.details.map((d,i)=>`<div class="q"><div class="qt">${i+1}. ${esc(state.unit.questions[i].question)}</div><p>${d.isCorrect?'✅ Correct':'❌ Incorrect'}${d.chosen===null?' — Not answered':''}</p><div class="expl">${esc(d.explanation)}<br>Correct answer: ${esc(d.options[d.correct])}</div></div>`).join('');
 }
 if(!state.unit)return '<p>Open a course unit first.</p>';
 return header('Unit assessment',`Answer all ${state.unit.questions.length} questions. Your result is saved automatically when submitted.`)+
 `<form id="quizForm">${state.unit.questions.map((q,i)=>`<div class="q"><div class="qt">${i+1}. ${esc(q.question)}</div>${q.options.map((o,j)=>`<label class="opt"><input type="radio" name="q${i}" value="${j}"> ${esc(o)}</label>`).join('')}</div>`).join('')}<button class="btn">Submit assessment</button></form>`;
}
async function viewResults(){
 if(!state.results)return '<p>Loading results…</p>';
 const s=state.results.summary;
 return header('My results','Your personal assessment performance.')+
 `<div class="grid g4" style="margin-bottom:20px">${stat('Units passed',s.passed,`Out of ${s.total}`)}${stat('Average best score',s.average+'%','Across all course units')}${stat('Total attempts',s.attempts,'Quiz submissions')}${stat('Pass mark',state.results.passMark+'%','Required score')}</div>`+
 `<div class="tablewrap"><table><thead><tr><th>Unit</th><th>Best score</th><th>Latest</th><th>Attempts</th><th>Status</th></tr></thead><tbody>${state.results.results.map(r=>`<tr><td>${esc(r.icon)} ${esc(r.title)}</td><td>${r.best===null?'—':r.best+'%'}</td><td>${r.last===null?'—':r.last+'%'}</td><td>${r.attempts}</td><td><span class="badge ${r.passed?'pass':r.attempts?'fail':'new'}">${r.passed?'Passed':r.attempts?'Not passed':'Not started'}</span></td></tr>`).join('')}</tbody></table></div>`;
}
async function viewLeaderboard(){
 if(!state.leaderboard)return '<p>Loading leaderboard…</p>';
 return header('Leaderboard','Best overall scores across the course.')+
 `<div class="tablewrap"><table><thead><tr><th>Rank</th><th>Name</th><th>Average</th><th>Units passed</th><th>Attempts</th></tr></thead><tbody>${state.leaderboard.leaderboard.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)} ${r.isAdmin?'<span class="muted">(Instructor)</span>':''}</td><td>${r.average}%</td><td>${r.passed}/${r.total}</td><td>${r.attempts}</td></tr>`).join('')}</tbody></table></div>`;
}
async function viewAdmin(){
 if(!state.admin)return '<p>Loading instructor report…</p>';
 return header('Instructor panel','Monitor registered accounts and individual student performance.','<button class="btn" id="exportCsv">Export CSV report</button>')+
 `<p class="muted">This page is visible to the instructor/admin account only.</p><div class="tablewrap"><table><thead><tr><th>Student</th><th>Email</th>${state.admin.units.map(u=>`<th>${esc(u.title)}</th>`).join('')}<th>Average</th><th>Passed</th><th>Attempts</th></tr></thead><tbody>${state.admin.students.map(s=>`<tr><td>${esc(s.name)}<br><small class="muted">${esc(s.role)}</small></td><td>${esc(s.email)}</td>${state.admin.units.map(u=>`<td>${s.perUnit[u.id].best===null?'—':s.perUnit[u.id].best+'%'}</td>`).join('')}<td>${s.average}%</td><td>${s.passed}/${s.total}</td><td>${s.attempts}</td></tr>`).join('')}</tbody></table></div>`;
}
function viewProfile(){return header('My profile','Account details and password security.')+
 `<div class="card" style="max-width:550px"><p><b>Name:</b> ${esc(state.user.name)}</p><p><b>Email:</b> ${esc(state.user.email)}</p><p><b>Role:</b> ${esc(state.user.role)}</p><hr style="border-color:var(--line)"><h3>Change password</h3><form id="pwForm"><label>Current password</label><input id="oldPw" type="password" required><label>New password</label><input id="newPw" type="password" minlength="6" required><button class="btn" style="margin-top:16px">Update password</button><p id="pwMsg" class="muted"></p></form></div>`}
function attach(){
 $$('[data-nav]').forEach(el=>el.onclick=()=>navigate(el.dataset.nav));
 $$('[data-unit]').forEach(el=>el.onclick=()=>openUnit(el.dataset.unit));
 const logout=$('#logout');if(logout)logout.onclick=async()=>{try{await api('/api/logout',{method:'POST'})}catch{}state.user=null;state.units=[];state.view='dashboard';render()};
 const start=$('#startQuiz');if(start)start.onclick=()=>{state.quizResult=null;state.view='quiz';render()};
 const form=$('#quizForm');if(form)form.onsubmit=async e=>{e.preventDefault();const answers=state.unit.questions.map((q,i)=>{const x=$(`input[name="q${i}"]:checked`);return x?Number(x.value):null});const missing=answers.filter(a=>a===null).length;if(missing&&!confirm(`${missing} question(s) unanswered. Submit anyway?`))return;try{state.quizResult=await api(`/api/units/${encodeURIComponent(state.slug)}/submit`,{method:'POST',body:{answers}});await loadUnits();render()}catch(err){toast(err.message)}};
 const retake=$('#retake');if(retake)retake.onclick=()=>{state.quizResult=null;render()};
 const back=$('#backUnit');if(back)back.onclick=()=>{state.view='unit';render()};
 const exp=$('#exportCsv');if(exp)exp.onclick=()=>{window.location.href='/api/admin/export.csv'};
 const pw=$('#pwForm');if(pw)pw.onsubmit=async e=>{e.preventDefault();const msg=$('#pwMsg');try{await api('/api/change-password',{method:'POST',body:{current:$('#oldPw').value,next:$('#newPw').value}});msg.textContent='Password updated successfully.';pw.reset()}catch(err){msg.textContent=err.message}};
}
async function openUnit(slug){try{await loadUnit(slug);state.view='unit';state.quizResult=null;render();window.scrollTo(0,0)}catch(e){toast(e.message)}}
async function navigate(view){
 try{
  if(view==='dashboard'||view==='units'){await loadUnits();state.view=view==='units'?'units':'dashboard'}
  else if(view==='results'){await loadResults();state.view=view}
  else if(view==='leaderboard'){await loadLeaderboard();state.view=view}
  else if(view==='admin'){await loadAdmin();state.view=view}
  else state.view=view;
  render();window.scrollTo(0,0);
 }catch(e){toast(e.message)}
}
boot();
