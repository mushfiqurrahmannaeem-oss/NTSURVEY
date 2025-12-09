// public/js/admin.js
async function adminLogin(){
  const e=document.getElementById('ad_email').value.trim();
  const p=document.getElementById('ad_pass').value.trim();
  if(!e||!p) return alert('Credentials missing');
  try{
    await auth.signInWithEmailAndPassword(e,p);
    const uid = auth.currentUser.uid;
    const adm = await db.ref('admins/'+uid).once('value');
    if(!adm.exists()) { alert('Not an admin'); await auth.signOut(); return; }
    document.getElementById('adminArea').style.display='block';
    loadPendingSubs(); loadPendingWds();
  }catch(err){ alert(err.message); }
}

async function createSurvey(){
  const title=document.getElementById('s_title').value.trim();
  const reward=Number(document.getElementById('s_reward').value);
  const auto=document.getElementById('s_auto').value==='true';
  const link=document.getElementById('s_link').value.trim();
  if(!title||!reward) return alert('Fill title & reward');
  await db.ref('surveys').push({ title, reward, link, auto, isActive:true, createdAt:Date.now(), description:'' });
  alert('Survey created');
}

function loadPendingSubs(){
  db.ref('surveySubmissions').orderByChild('status').equalTo('Pending').on('value', snap=>{
    const val=snap.val()||{}; const dom=document.getElementById('pendingSubs'); dom.innerHTML='';
    Object.keys(val).forEach(k=>{ const s=val[k]; const div=document.createElement('div'); div.className='card'; div.innerHTML=`<div><strong>Survey:</strong> ${s.surveyId}<div class="small">User: ${s.userId}</div><div style="margin-top:8px"><button class="btn" onclick="approveSub('${k}','${s.userId}',${s.reward})">Approve</button><button class="btn btn-ghost" onclick="rejectSub('${k}')">Reject</button></div></div>`; dom.appendChild(div); });
  });
}

async function approveSub(k,uid,reward){
  const profileRef = db.ref('userProfiles/'+uid);
  const snap = await profileRef.once('value'); const prev = (snap.val() && snap.val().totalCoins)? Number(snap.val().totalCoins):0;
  await profileRef.update({ totalCoins: prev + Number(reward) });
  await db.ref('surveySubmissions/'+k).update({ status:'Approved', approvedAt:Date.now() });
  alert('Approved & balance updated');
}

async function rejectSub(k){ await db.ref('surveySubmissions/'+k).update({ status:'Rejected' }); alert('Rejected'); }

function loadPendingWds(){
  db.ref('withdrawals').orderByChild('status').equalTo('Pending').on('value', snap=>{
    const val=snap.val()||{}; const dom=document.getElementById('pendingWds'); dom.innerHTML='';
    Object.keys(val).forEach(k=>{ const w=val[k]; const el=document.createElement('div'); el.className='card'; el.innerHTML=`<div><strong>User:</strong> ${w.userId} <div class="small">Amount: ${w.amount} coins — ${w.method} ${w.accountNumber}</div><div style="margin-top:8px"><button class="btn" onclick="approveWithdraw('${k}','${w.userId}',${w.amount})">Approve</button><button class="btn btn-ghost" onclick="rejectWithdraw('${k}')">Reject</button></div></div>`; dom.appendChild(el); });
  });
}

async function approveWithdraw(wid, userId, amount){
  const up = db.ref('userProfiles/'+userId);
  const snap = await up.once('value'); const bal = snap.val() && snap.val().totalCoins ? Number(snap.val().totalCoins) : 0;
  if(bal < amount) return alert('Insufficient');
  await up.update({ totalCoins: bal - amount });
  await db.ref('withdrawals/'+wid).update({ status:'Approved', processedAt:Date.now() });
  alert('Withdraw approved (mark paid externally).');
}

async function rejectWithdraw(wid){ await db.ref('withdrawals/'+wid).update({ status:'Rejected' }); alert('Rejected'); }