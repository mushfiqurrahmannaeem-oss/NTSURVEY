// public/js/user.js
function coinsToCurrency(coins, country){
  if(country === 'BD'){
    // 2 coin = 1 BDT => 1 coin = 0.5 BDT
    return { value: (coins * 0.5).toFixed(2), currency: 'BDT' };
  } else {
    // 2 coin = 0.1 USD => 1 coin = 0.05 USD
    return { value: (coins * 0.05).toFixed(2), currency: 'USD' };
  }
}

auth.onAuthStateChanged(async user=>{
  if(!user) return location='login.html';
  document.getElementById('emailView').innerText = user.email;
  const profileSnap = await db.ref('userProfiles/'+user.uid).once('value');
  const profile = profileSnap.val() || { country:'BD', totalCoins:0 };
  db.ref('userProfiles/'+user.uid).on('value', s=>{
    const p = s.val();
    if(p) document.getElementById('coins').innerText = p.totalCoins || 0;
  });
  loadSurveys();
  loadMySubmissions();
});

async function loadSurveys(){
  const snap = await db.ref('surveys').once('value');
  const val = snap.val() || {};
  const list = document.getElementById('surveyList'); list.innerHTML='';
  Object.keys(val).forEach(k=>{
    const s = val[k];
    if(!s.isActive) return;
    const div = document.createElement('div');
    div.className='task-card';
    div.innerHTML = `<div>
      <strong>${s.title}</strong><div class="small">${s.description||''}</div>
      <div class="small">Reward: ${s.reward} coins</div>
      </div>
      <div>
        <a class="btn" href="#" onclick="startSurvey('${k}', ${s.reward}, ${s.auto?1:0}, '${s.link||''}')">Start</a>
      </div>`;
    list.appendChild(div);
  });
}

function startSurvey(sid, reward, auto, link){
  if(!confirm('Survey শুরু করতে চান?')) return;
  if(link && link.length>5){
    window.open(link, '_blank');
  }
  // simple timer for user to complete (30s)
  let t=30;
  const modal = document.createElement('div'); modal.className='card';
  modal.innerHTML = `Completing... <span id="count">${t}</span>s <button onclick="cancelTimer(this)">Cancel</button>`;
  document.body.appendChild(modal);
  window.cancelTimer = (btn)=>{ clearInterval(window.surveyInterval); btn.closest('.card').remove(); alert('Canceled'); };
  window.surveyInterval = setInterval(()=>{ t--; document.getElementById('count').innerText=t; if(t<=0){ clearInterval(window.surveyInterval); modal.remove(); finishSurvey(sid,reward,auto); } },1000);
}

async function finishSurvey(sid,reward,auto){
  const user = auth.currentUser;
  const submission = { userId:user.uid, surveyId:sid, reward, status: auto? 'Approved' : 'Pending', date:Date.now() };
  const ref = await db.ref('surveySubmissions').push(submission);
  if(auto){
    const profileRef = db.ref('userProfiles/'+user.uid);
    const snap = await profileRef.once('value'); const prev = (snap.val() && snap.val().totalCoins)? Number(snap.val().totalCoins):0;
    await profileRef.update({ totalCoins: prev + Number(reward) });
    alert('Survey completed — coins added.');
  } else {
    alert('Survey submitted — pending admin approval.');
  }
  loadMySubmissions();
}

function loadMySubmissions(){
  const user = auth.currentUser;
  db.ref('surveySubmissions').orderByChild('userId').equalTo(user.uid).on('value', snap=>{
    const val = snap.val()||{}; const dom=document.getElementById('submissionList'); dom.innerHTML='';
    Object.keys(val).forEach(k=>{ const s=val[k]; const el=document.createElement('div'); el.className='card'; el.innerHTML = `<div><strong>Survey:</strong> ${s.surveyId} <div class="small">Status: ${s.status}</div> <div class="small">Reward: ${s.reward} coins</div></div>`; dom.appendChild(el); });
  });
}

async function makeWithdraw(){
  const amt = Number(document.getElementById('wd_amount').value);
  const method = document.getElementById('wd_method').value;
  const number = document.getElementById('wd_number').value.trim();
  if(!amt || !number) return alert('সবগুলো পূরণ করো');
  if(amt < 500) return alert('Minimum withdraw is 500 coins');
  const user = auth.currentUser;
  const profSnap = await db.ref('userProfiles/'+user.uid).once('value'); const prof = profSnap.val();
  const bal = prof && prof.totalCoins ? Number(prof.totalCoins) : 0;
  if(bal < amt) return alert('Insufficient coins');
  await db.ref('withdrawals').push({ userId:user.uid, amount:amt, method, accountNumber:number, status:'Pending', requestDate:Date.now() });
  alert('Withdraw requested. Admin will process.');
}

function logout(){ auth.signOut().then(()=>location='index.html'); }