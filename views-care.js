/* Admissions · Clinical Care · Diagnostics · Medications */
(function(){
const {views}=App, {$,$$,esc,attr,ic,st,sicon,N,walk,hm,mins,tiles,card,box,hbars,mini,table,avatar,legend}=App.h;

/* =================== ADMISSIONS =================== */
const STAGES=[['pending','Pending Admission','Decision made, not yet approved'],['bed','Awaiting Bed','Approved · needs a bed'],['transfer','Transfer Requested','Moving between units'],['admitted','Admitted Today','In a bed'],['discharge','Ready for Discharge','Checklist in progress']];
const CHECKS=['Medication reconciliation done','Discharge instructions explained','Follow-up appointment booked','Transport home arranged'];
views.admissions=()=>{
  const A=D.ADMISSIONS.filter(a=>a.stage!=='gone'), freeN=Object.values(D.FREE_BEDS).reduce((a,b)=>a+b.length,0);
  const wait=A.filter(a=>a.stage==='bed').sort((a,b)=>b.since-a.since);
  const cardHtml=a=>{ const d=D.doc(a.doc), late=a.stage==='bed'&&a.since>=2.5, done=(a.checks||[]).filter(Boolean).length;
    const act={pending:`<button class="btn btn-secondary btn-sm" data-adm="${a.id}" data-x="approve">Approve</button>`,bed:`<button class="btn btn-weak btn-sm" data-adm="${a.id}" data-x="bed">${ic('bed')}Assign Bed</button>`,transfer:`<button class="btn btn-weak btn-sm" data-adm="${a.id}" data-x="bed">${ic('bed')}Assign Bed</button>`,discharge:`<button class="btn btn-secondary btn-sm" data-adm="${a.id}" data-x="dc">Checklist ${done}/4</button>`,admitted:''}[a.stage];
    return `<div class="kc${late?' late':''}"><div class="kc-h"><b>${esc(a.name)}</b><span class="muted">${a.age} · ${a.sex}</span></div><div class="kc-d">${esc(a.dx)}</div>
      <div class="kc-m"><span>${ic(a.stage==='discharge'?'home':a.stage==='transfer'?'swap':'bld')}${esc(a.stage==='discharge'||a.stage==='admitted'||a.stage==='transfer'?(a.bed||a.from):a.from)}${a.stage==='admitted'||a.stage==='discharge'?'':' → '+esc(a.unit)}</span><span>${ic('user')}${esc(d.name)}</span>${a.since?`<span class="${late?'bad':''}">${ic('clock')}${a.stage==='discharge'?'ready ':'waiting '}${mins(a.since*60)}</span>`:''}</div>
      ${a.stage==='discharge'?`<div class="kc-p"><span style="width:${done/4*100}%"></span></div>`:''}
      ${act?`<div class="kc-a">${a.pri&&a.stage!=='discharge'?`<span class="tag${a.pri==='Urgent'?' hot':''}">${a.pri}</span>`:''}<span style="flex:1"></span>${act}</div>`:''}</div>`; };
  return {
    title:'Admissions', meta:[['bld',App.fac().name],['bed',`${freeN} beds free now`],['clock','10:40 AM']],
    actions:`<button class="btn btn-secondary" data-stub>${ic('swap')}Request Transfer</button><button class="btn btn-primary" data-stub>${ic('plus')}New Admission</button>`,
    html: tiles([
      {l:'Waiting for a Bed',v:String(wait.length),s:wait.length?`longest ${mins(wait[0].since*60)}`:'none waiting',cls:wait.length&&wait[0].since>=2.5?'bad':''},
      {l:'Pending Approval',v:String(A.filter(a=>a.stage==='pending').length),s:'from Emergency'},
      {l:'Admitted Today',v:String(A.filter(a=>a.stage==='admitted').length),s:'since midnight'},
      {l:'Discharges Planned',v:String(A.filter(a=>a.stage==='discharge').length),s:'target: home before noon'}
    ])+
    `<div class="kanban">${STAGES.map(([k,l,s])=>{ const items=A.filter(a=>a.stage===k); return `<section class="kcol"><div class="kcol-h"><b>${l}</b><span class="n">${items.length}</span><div class="sub">${s}</div></div>${items.map(cardHtml).join('')||'<div class="empty" style="padding:20px 8px">Empty</div>'}</section>`; }).join('')}</div>`,
    bind(root){ root.addEventListener('click',e=>{ const b=e.target.closest('[data-adm]'); if(!b) return; const a=D.ADMISSIONS.find(x=>x.id===b.dataset.adm);
      if(b.dataset.x==='approve'){ a.stage='bed'; App.render(); UI.toast(`${a.name} approved · now waiting for a bed`); }
      if(b.dataset.x==='bed') bedDrawer(a);
      if(b.dataset.x==='dc') dcDrawer(a); }); }
  };
};
function bedDrawer(a){
  const units=Object.keys(D.FREE_BEDS).sort((x,y)=>(y===a.unit)-(x===a.unit));
  App.drawer({eyebrow:`${esc(a.dx)} · requested ${esc(a.unit)}`,title:`Assign Bed · ${a.name}`,body:units.map(u=>`<div class="d-sec"><div class="lbl">${esc(u)}${u===a.unit?' · requested unit':''}</div>${D.FREE_BEDS[u].length?`<div class="beds-pick">${D.FREE_BEDS[u].map(b=>`<button class="bp" data-bed="${attr(u+' · '+b)}" aria-pressed="false">${ic('bed')}${esc(b)}<small>${u===a.unit?'Clean · ready':'Clean · off-unit'}</small></button>`).join('')}</div>`:`<div class="help" style="color:var(--ink-3);font-size:12.5px">No free beds</div>`}</div>`).join(''),
    foot:`<button class="btn btn-secondary" data-close>Cancel</button><span style="flex:1"></span><button class="btn btn-primary" id="bdOk" disabled data-tip="Select a bed first">Assign Bed</button>`});
  let pick=null; const ok=$('#bdOk');
  $('#dBody').onclick=e=>{ const b=e.target.closest('[data-bed]'); if(!b) return; $$('#dBody [data-bed]').forEach(x=>x.setAttribute('aria-pressed',x===b)); pick=b.dataset.bed; ok.disabled=false; ok.removeAttribute('data-tip'); };
  ok.onclick=()=>{ const [u,bd]=pick.split(' · '); D.FREE_BEDS[u]=D.FREE_BEDS[u].filter(x=>x!==bd); a.bed=pick; a.stage='admitted'; a.since=0; App.closeDrawer(); App.render(); UI.toast(`${a.name} assigned to ${pick} · housekeeping and unit notified`); };
}
function dcDrawer(a){
  a.checks=a.checks||[0,0,0,0];
  const body=()=>`<div class="d-sec"><div class="lbl">Before the patient leaves</div>${CHECKS.map((c,i)=>`<div class="lrow"><button class="cb" role="checkbox" aria-checked="${!!a.checks[i]}" data-ck="${i}"><i><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></i></button><span class="t">${c}</span><span class="m">${a.checks[i]?'Done':'Open'}</span></div>`).join('')}</div>
    <div class="d-sec"><dl class="dl"><dt>Bed</dt><dd>${esc(a.bed)}</dd><dt>Attending</dt><dd>${esc(D.doc(a.doc).name)}</dd><dt>Going to</dt><dd>Home</dd></dl></div>`;
  const left=()=>4-a.checks.filter(Boolean).length;
  App.drawer({eyebrow:esc(a.dx),title:`Discharge · ${a.name}`,body:body(),foot:`<button class="btn btn-secondary" data-close>Close</button><span style="flex:1"></span><button class="btn btn-primary" id="dcOk">Discharge Patient</button>`});
  const ok=$('#dcOk'), sync=()=>{ ok.disabled=left()>0; left()?ok.setAttribute('data-tip',`${left()} checklist item${left()>1?'s':''} still open`):ok.removeAttribute('data-tip'); };
  sync();
  $('#dBody').addEventListener('toggle',e=>{ const i=+e.target.dataset.ck; a.checks[i]=e.detail?1:0; e.target.parentElement.querySelector('.m').textContent=e.detail?'Done':'Open'; sync(); App.render(); });
  ok.onclick=()=>{ a.stage='gone'; const u=a.bed.split(' · '); if(D.FREE_BEDS[u[0]]) D.FREE_BEDS[u[0]].push(u[1]); App.closeDrawer(); App.render(); UI.toast(`${a.name} discharged · bed ${a.bed} sent for cleaning`); };
}

/* =================== CLINICAL CARE =================== */
const PLANS={
  p1:['Daily weight before breakfast','Fluid restriction 1.5 L per day','Repeat metabolic panel tomorrow 6 AM','Cardiology consult for device therapy','Heart failure education before discharge'],
  p3:['Nebulized bronchodilator every 4 hours','Wean oxygen to SpO₂ 88–92%','Prednisone 40 mg daily for 5 days','Pulmonary rehab referral'],
  p4:['Physical therapy twice daily','Pain score every 4 hours','Delirium screening every shift','Fall precautions · bed alarm on'],
  p6:['Hold nephrotoxic drugs','Strict intake and output','Repeat creatinine at 4 PM','Renal ultrasound'],
  p2:['Sepsis bundle within 1 hour','Broad-spectrum antibiotics','Fluid resuscitation 30 mL/kg','Reassess lactate at 12 PM']
};
const NOTES={
  p1:`S: Breathing easier than yesterday. Slept with two pillows.\nO: HR 88, BP 118/72, SpO₂ 95% on room air. Weight 71.2 kg (−1.1 kg). Bibasal crackles reduced.\nA: Acute on chronic heart failure, improving with diuresis. Potassium 5.3, creatinine 1.9.\nP: Continue IV furosemide. Hold lisinopril today. Repeat BMP tomorrow. Plan discharge in 48 hours if weight stable.`
};
views.clinical=(arg,root)=>{
  const r=App.role();
  const mine=D.PATIENTS.filter(p=>p.status==='Inpatient'&&(r.id==='nurse'?p.loc.startsWith('4 West'):true));
  const p=D.pat(arg)&&mine.includes(D.pat(arg))?D.pat(arg):mine[0];
  const plan=(PLANS[p.id]||['Vital signs every 4 hours','Reassess pain each shift','Review medications','Discharge planning']).map((t,i)=>({t,done:i===0}));
  root.plan=root.plan||{}; root.plan[p.id]=root.plan[p.id]||plan;
  root.signed=root.signed||{}; const signed=root.signed[p.id];
  const note=NOTES[p.id]||`S: Patient reports feeling better today.\nO: Vitals stable. See observations.\nA: ${p.dx[0][1]}.\nP: Continue current treatment plan.`;
  const vit=root.vit||'hr';
  return {
    title:'Clinical Care', meta:[['user',r.id==='nurse'?'4 West · your patients':`${D.doc('marsh').name} · all inpatients`],['cal','Tue 29 Sep']],
    actions:signed?`<span class="st ok">${ic('ok')}Note signed ${signed}</span>`:`<button class="btn btn-secondary" data-stub>Save Draft</button><button class="btn btn-primary" id="signNote">Sign ${r.id==='nurse'?'Nursing':'Progress'} Note</button>`,
    html:`<div class="cc">
      <aside class="cc-list">${card('Patients',`${mine.length} inpatients`,`<div class="plist">${mine.map(x=>`<a class="pl${x.id===p.id?' on':''}" href="#/clinical/${x.id}">${avatar(x.name)}<span class="cell"><b>${esc(x.name)}</b>${esc(x.loc)}</span><span class="news ${x.news>=7?'bad':x.news>=5?'warn':''}" data-tip="Early warning score (NEWS2)">${x.news}</span></a>`).join('')}</div>`,{cls:'flush'})}</aside>
      <div class="cc-main">
        ${card('','',`<div class="ph"><div>${avatar(p.name,'lg')}</div><div style="flex:1;min-width:0"><div class="ph-n"><a href="#/patient/${p.id}">${esc(p.name)}</a> <span class="muted">${p.age} · ${p.sex} · ${p.mrn}</span></div><div class="ph-m">${esc(p.loc)} · day ${p.los+1} · ${esc(p.dx[0][1])}</div></div>${p.allergies.length?`<span class="st bad">${ic('alert')}${p.allergies.map(esc).join(', ')}</span>`:'<span class="st muted">No known allergies</span>'}</div>`)}
        <div class="lay g-1-1">
          ${card('Treatment Plan',`${root.plan[p.id].filter(x=>x.done).length} of ${root.plan[p.id].length} done`,`<div id="planL">${root.plan[p.id].map((x,i)=>`<div class="lrow"><button class="cb" role="checkbox" aria-checked="${x.done}" data-pl="${i}"><i><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></i></button><span class="t">${esc(x.t)}</span><span class="m">${i%2?'Nursing':'Medical'} · ${['today','every shift','tomorrow','this admission','before discharge'][i%5]}</span></div>`).join('')}</div>`)}
          ${card('Diagnoses & Procedures','This admission',`<div class="dxl">${p.dx.map((x,i)=>`<div><span class="mono">${x[0]}</span><span>${esc(x[1])}</span>${i===0?'<span class="tag">Primary</span>':''}</div>`).join('')}</div><div class="lbl2">Procedures</div><div class="dxl">${[['Peripheral IV insertion','26 Sep · RN'],['Chest X-ray','26 Sep · Radiology'],['12-lead ECG','26 Sep · Cardiology']].map(([a,b])=>`<div><span>${a}</span><span class="muted">${b}</span></div>`).join('')}</div>`)}
        </div>
        ${card('Observations','Last 24 hours · hover for exact values',box('ccVit',200),{right:`<div class="seg" role="tablist" id="vitSeg">${[['hr','Heart Rate'],['bp','Blood Pressure'],['spo2','SpO₂'],['temp','Temperature']].map(([k,l])=>`<button role="tab" aria-selected="${k===vit}" data-v="${k}">${l}</button>`).join('')}</div>`})}
        ${card(r.id==='nurse'?'Nursing Note':'Progress Note',signed?`Signed by ${r.user} at ${signed}`:'Draft · SOAP format',`<textarea class="textarea snote" id="ccNote" ${signed?'readonly':''}>${esc(note)}</textarea>`)}
      </div></div>`,
    draw(root){
      const s=+p.mrn.slice(-4), lab=Array.from({length:12},(_,i)=>hm(D.NOW-22+i*2).replace(':40','').replace(':00',''));
      const cfg={hr:[{name:'Heart rate',values:walk(s,12,p.news>5?96:84,p.news>5?1.8:-.4,6),color:'var(--s1)'}],bp:[{name:'Systolic',values:walk(s+1,12,132,-1,6),color:'var(--s1)'},{name:'Diastolic',values:walk(s+2,12,78,-.5,4),color:'var(--s3)'}],spo2:[{name:'SpO₂',values:walk(s+3,12,93,.2,1),color:'var(--s1)'}],temp:[{name:'Temperature',values:walk(s+4,12,37.6,-.05,.3),color:'var(--s2)'}]}[root.vit||'hr'];
      const unit={hr:' bpm',bp:' mmHg',spo2:'%',temp:' °C'}[root.vit||'hr'];
      V.line($('#ccVit'),{labels:lab,series:cfg,fmt:v=>(root.vit==='temp'?(+v).toFixed(1):Math.round(v))+unit,every:2,height:200,left:64,min:{hr:50,bp:50,spo2:85,temp:35.5}[root.vit||'hr'],max:{hr:120,bp:160,spo2:100,temp:39}[root.vit||'hr']});
    },
    bind(root){
      root.addEventListener('toggle',e=>{ const i=e.target.dataset.pl; if(i==null) return; root.plan[p.id][i].done=e.detail; UI.toast(e.detail?'Task marked done':'Task reopened'); App.render(); });
      root.addEventListener('click',e=>{ const v=e.target.closest('#vitSeg [data-v]'); if(v){ root.vit=v.dataset.v; App.render(); return; }
        if(e.target.closest('#signNote')){ root.signed[p.id]='10:41 AM'; App.render(); UI.toast('Note signed and added to the patient record'); } });
    }
  };
};

/* =================== DIAGNOSTICS =================== */
const OST={ordered:['muted','Ordered'],collected:['muted','Collected'],progress:['confirm','In Progress'],scheduled:['muted','Scheduled'],resulted:['ok','Resulted']};
views.diagnostics=(arg,root)=>{
  const tab=root.tab||'lab', f=root.f||'all';
  const O=D.ORDERS.filter(o=>o.kind===tab&&(App.S.role!=='physician'||o.by==='marsh'));
  const stf=root.stf||'all', match=o=>stf==='all'||o.st===stf;
  const order=['ordered','collected','scheduled','progress','resulted'].filter(k=>O.some(o=>o.st===k));
  const stTabs=`<div class="seg st-tabs" role="tablist" id="dxSt"><button role="tab" aria-selected="${stf==='all'}" data-stf="all">All <span class="n">${O.length}</span></button>${order.map(k=>`<button role="tab" aria-selected="${stf===k}" data-stf="${k}">${OST[k][1]} <span class="n">${O.filter(o=>o.st===k).length}</span></button>`).join('')}</div>`;
  const flagCell=o=>o.st!=='resulted'?`<span class="muted" style="font-size:12.5px">${o.slot?esc(o.slot):'Pending'}</span>`:o.ack?st('muted','Acknowledged'):o.flag==='crit'?st('bad','Critical'):o.flag==='abn'?st('warn','Abnormal'):st('ok','Normal');
  const rows=O.filter(match).sort((a,b)=>(b.flag==='crit'&&!b.ack)-(a.flag==='crit'&&!a.ack)||(b.pri==='STAT')-(a.pri==='STAT')||b.ordered-a.ordered).map(o=>{ const p=D.pat(o.p), [k,l]=OST[o.st];
    return `<div class="t-row click" data-ord="${o.id}"><span class="cell"><b>${esc(o.test)}</b><span class="mono">${o.id}</span></span><span class="pcell">${avatar(p.name)}<span class="cell"><b>${esc(p.name)}</b>${esc(p.loc)}</span></span><span class="pri ${o.pri==='STAT'?'stat':''}">${o.pri}</span>${st(k,l)}<span class="num muted">${hm(o.ordered)}</span><span class="num">${o.tat?mins(o.tat):o.st==='resulted'?'—':`<span class="muted">${mins((D.NOW-o.ordered)*60)} so far</span>`}</span>${flagCell(o)}</div>`; });
  const all=D.ORDERS.filter(o=>App.S.role!=='physician'||o.by==='marsh'), critN=all.filter(o=>(o.flag==='crit'||o.flag==='abn')&&!o.ack&&o.kind===tab).length;
  return {
    title:'Diagnostics', meta:App.S.role==='physician'?[]:[['bld',App.fac().name],['clock','Results update live'],['info','Critical results must be acknowledged within 30 min']],
    actions:`<button class="btn btn-primary" data-stub>${ic('plus')}New Order</button>`,
    html:
    `<div class="toolbar">${stTabs}<div class="tb-right"><div class="seg" role="tablist" id="dxTab"><button role="tab" aria-selected="${tab==='lab'}" data-k="lab">${ic('flask')}Laboratory <span class="n">${all.filter(o=>o.kind==='lab').length}</span></button><button role="tab" aria-selected="${tab==='img'}" data-k="img">${ic('img')}Imaging <span class="n">${all.filter(o=>o.kind==='img').length}</span></button></div></div></div><section class="card flush">${table('minmax(0,1.4fr) minmax(0,1.2fr) 70px 120px 80px 110px 130px',['Order','Patient','Priority','Status','Ordered','Turnaround','Result'],rows,{empty:'No orders with this status.'})}</section>`,
    bind(root){
      root.addEventListener('click',e=>{ const t=e.target.closest('#dxTab [data-k]'); if(t){ root.tab=t.dataset.k; root.stf='all'; App.render(); return; }
        const sf=e.target.closest('#dxSt [data-stf]'); if(sf){ root.stf=sf.dataset.stf; App.render(); return; }
        const tl=e.target.closest('.tile[data-f]'); if(tl){ root.f=tl.dataset.f; App.render(); return; }
        const r=e.target.closest('[data-ord]'); if(r) orderDrawer(r.dataset.ord); });
    }
  };
};
App.orderDrawer=id=>orderDrawer(id);
document.addEventListener('click',e=>{ const r=e.target.closest('[data-ordp]'); if(r) orderDrawer(r.dataset.ordp); });
function orderDrawer(id){
  const o=D.ORDERS.find(x=>x.id===id), p=D.pat(o.p), [k,l]=OST[o.st], flagged=(o.flag==='crit'||o.flag==='abn')&&!o.ack;
  const fl={H:['warn','High'],L:['warn','Low'],C:['bad','Critical'],'':['ok','Normal']};
  const res=o.res?`<div class="d-sec"><div class="lbl">Results</div>${table('minmax(0,1.2fr) 80px 110px 100px',['Test','Value','Reference','Flag'],o.res.map(([n,v,u,r,f])=>`<div class="t-row"><span class="t">${esc(n)}</span><span class="num" style="${f==='C'?'color:var(--bad);font-weight:500':''}">${v} <span class="muted">${u}</span></span><span class="num muted">${r}</span>${st(fl[f][0],fl[f][1])}</div>`))}</div>`:o.report?`<div class="d-sec"><div class="lbl">Radiology Report</div><p class="report">${esc(o.report)}</p><div class="help">Reported by Dr. Kwame Asante · ${hm(o.ordered+o.tat/60)}</div></div>`:`<div class="d-sec"><div class="lbl">Progress</div><div class="steps">${['ordered','collected','progress','resulted'].map((s,i)=>{ const idx=['ordered','collected','progress','resulted'].indexOf(o.st==='scheduled'?'ordered':o.st); return `<span class="${i<=idx?'on':''}">${['Ordered','Collected','In Lab','Resulted'][i]}</span>`; }).join('')}</div></div>`;
  App.drawer({eyebrow:`${o.id} · ${o.pri} · ordered ${hm(o.ordered)} by ${esc(D.doc(o.by).name)}`,title:o.test,wide:true,
    body:`<div class="d-sec"><div class="pcell">${App.h.avatar(p.name)}<span class="cell"><b>${esc(p.name)}</b>${p.mrn} · ${esc(p.loc)}</span><span style="flex:1"></span>${st(k,l)}</div></div>${res}`,
    foot:flagged?`<a class="btn btn-secondary" href="#/patient/${p.id}">Open Patient</a><span style="flex:1"></span><button class="btn btn-primary" id="ackBtn">Acknowledge Result</button>`:`<a class="btn btn-secondary" href="#/patient/${p.id}">Open Patient</a>`});
  $$('#dFoot a').forEach(a=>a.addEventListener('click',()=>App.closeDrawer()));
  const b=$('#ackBtn'); if(b) b.onclick=()=>{ o.ack=true; App.closeDrawer(); App.render(); UI.toast(`Result acknowledged by ${App.role().user} · logged at 10:41 AM`); };
}

/* =================== MEDICATIONS =================== */
const BUCKETS=[6,8,10,12,14,16,18,20,22];
function doseState(m,t){
  if(m.given&&m.given[t]) return ['given',`${m.given[t][0]} · ${m.given[t][1]}`];
  if(m.held&&m.held[t]) return ['held','Held'];
  if(t<D.NOW-1) return ['late',`Overdue ${hm(t).replace(':00','')}`];
  if(t<=D.NOW+1) return ['due',`Due ${hm(t).replace(':00','')}`];
  return ['sched',hm(t).replace(':00','')];
}
App.dueCount=()=>Object.values(D.MAR).flat().reduce((n,m)=>n+(m.times||[]).filter(t=>['due','late'].includes(doseState(m,t)[0])).length,0);
views.medications=(arg,root)=>{
  const tab=root.tab||'mar', pid=root.pid||'p1', p=D.pat(pid), meds=D.MAR[pid];
  const mar=`<div class="toolbar"><div class="chips">${Object.keys(D.MAR).map(id=>{ const x=D.pat(id), n=D.MAR[id].reduce((a,m)=>a+(m.times||[]).filter(t=>['due','late'].includes(doseState(m,t)[0])).length,0); return `<button class="chip" data-pid="${id}" aria-pressed="${id===pid}">${esc(x.name)} <span class="n">${esc(x.loc.split(' · ')[1])}</span>${n?`<span class="cnt">${n} due</span>`:''}</button>`; }).join('')}</div></div>
    ${card(`Medication Administration Record · ${p.name}`,`${p.mrn} · ${p.loc} · allergies: ${p.allergies.join(', ')||'none known'}`,`<div class="mar" style="--n:${BUCKETS.length}">
      <div class="mar-h"><span>Medication</span>${BUCKETS.map(b=>`<span class="${D.NOW>=b&&D.NOW<b+2?'now':''}">${hm(b).replace(':00','')}</span>`).join('')}</div>
      ${meds.map(m=>`<div class="mar-r"><span class="mar-d"><b>${esc(m.drug)}</b>${esc(m.dose)} · ${m.route} · ${esc(m.freq)}</span>${m.prn?`<span class="mar-prn" style="grid-column:span ${BUCKETS.length}">Last given ${m.last} AM · <button class="btn btn-secondary btn-sm" data-dose="${m.id}|prn">Give As Needed Dose</button></span>`:BUCKETS.map(b=>{ const ts=(m.times||[]).filter(t=>t>=b&&t<b+2); return `<span class="mar-c">${ts.map(t=>{ const [s,l]=doseState(m,t); return `<button class="dose ${s}" data-dose="${m.id}|${t}" ${s==='held'?`data-tip="${attr(m.held[t])}"`:''}>${s==='given'?ic('ok'):s==='held'?ic('pause'):s==='late'?ic('alert'):''}${esc(l)}</button>`; }).join('')}</span>`; }).join('')}</div>`).join('')}
    </div><div class="legend"><span><i class="lg-dose given"></i>Given</span><span><i class="lg-dose due"></i>Due now</span><span><i class="lg-dose late"></i>Overdue</span><span><i class="lg-dose held"></i>Held</span><span><i class="lg-dose sched"></i>Scheduled</span></div>`,{})}`;
  const RX=D.RX;
  root.rx=root.rx||{};
  const rx=card('Prescriptions','Active and pending orders · pharmacist verifies before the first dose',table('minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr) 150px minmax(0,1.3fr) 110px',['Patient','Order','Prescriber','Status','Safety Check',''],RX.map(({pid,order:o,doc:d,status:s,warn:w},i)=>{ const x=D.pat(pid), s2=root.rx[i]||s; const k={Active:'ok','On Hold':'warn','Pending Verification':'confirm',Discontinued:'muted',Verified:'ok','Sent to Pharmacy':'ok'}[s2];
    return `<div class="t-row"><span class="cell"><b>${esc(x.name)}</b>${esc(x.loc)}</span><span class="t">${esc(o)}</span><span class="cell"><b>${esc(D.doc(d).name)}</b></span>${st(k,s2)}<span class="cell">${w?`<b style="color:var(--${s==='Pending Verification'||s==='On Hold'?'warn':'ink-3'})">${esc(w)}</b>`:'<span class="muted">No interactions found</span>'}</span><span class="act">${s2==='Pending Verification'?`<button class="btn btn-secondary btn-sm" data-rx="${i}">Verify</button>`:''}</span></div>`; })),{cls:'flush'});
  return {
    title:'Medications', meta:[['bld','4 West · Medicine'],['clock','10:40 AM'],['user',App.role().user]],
    actions:`<div class="seg" role="tablist" id="medTab"><button role="tab" aria-selected="${tab==='mar'}" data-k="mar">Administration Record</button><button role="tab" aria-selected="${tab==='rx'}" data-k="rx">Prescriptions</button></div>`,
    html: tab==='mar'?mar:rx,
    bind(root){
      root.addEventListener('click',e=>{ const t=e.target.closest('#medTab [data-k]'); if(t){ root.tab=t.dataset.k; App.render(); return; }
        const c=e.target.closest('[data-pid]'); if(c){ root.pid=c.dataset.pid; App.render(); return; }
        if(e.target.closest('#newRx')){ App.prescribe(null,{onDone:()=>{ root.tab='rx'; App.render(); }}); return; }
        const r=e.target.closest('[data-rx]'); if(r){ root.rx[r.dataset.rx]='Verified'; App.render(); UI.toast('Order verified by pharmacy · released to the ward'); return; }
        const d=e.target.closest('[data-dose]'); if(d){ const [mid,t]=d.dataset.dose.split('|'); doseDrawer(pid,mid,t); } });
    }
  };
};
function doseDrawer(pid,mid,t){
  const p=D.pat(pid), m=D.MAR[pid].find(x=>x.id===mid), prn=t==='prn', tt=+t;
  const [s]=prn?['due']:doseState(m,tt);
  if(s==='given'){ UI.toast(`Given at ${m.given[tt][0]} by ${m.given[tt][1]}`); return; }
  if(s==='held'){ App.drawer({eyebrow:`${m.dose} · ${m.route} · scheduled ${hm(tt)}`,title:`${m.drug} · held`,body:`<div class="d-sec"><div class="callout" style="margin:0">${App.h.sicon('warn','Held')}<span>${esc(m.held[tt])}</span></div></div>`,foot:`<button class="btn btn-secondary" data-close>Close</button><span style="flex:1"></span><button class="btn btn-primary" id="notify">Notify Prescriber</button>`}); $('#notify').onclick=()=>{ App.closeDrawer(); UI.toast(`${D.doc(p.att).name} paged about held ${m.drug}`); }; return; }
  if(s==='sched'){ UI.toast(`Scheduled for ${hm(tt)} · not due yet`); return; }
  const chk={wb:false,med:false};
  App.drawer({eyebrow:`${esc(p.name)} · ${p.mrn} · ${esc(p.loc)}`,title:`Give ${m.drug} ${m.dose}`,body:`
    ${p.allergies.length?`<div class="allergy" style="margin:0">${ic('alert')}<b>Allergies:</b> ${p.allergies.map(esc).join(' · ')}</div>`:''}
    <div class="d-sec"><div class="lbl">Confirm before giving</div>
      <button class="scan" data-sc="wb">${ic('scan')}<span><b>Scan patient wristband</b><small>Confirms right patient</small></span></button>
      <button class="scan" data-sc="med">${ic('scan')}<span><b>Scan medication barcode</b><small>Confirms right drug, dose and route</small></span></button></div>
    <div class="d-sec"><dl class="dl"><dt>Dose</dt><dd>${esc(m.dose)}</dd><dt>Route</dt><dd>${m.route}</dd><dt>Scheduled</dt><dd>${prn?'As needed':hm(tt)}${s==='late'?' · <span style="color:var(--bad)">overdue</span>':''}</dd><dt>Frequency</dt><dd>${esc(m.freq)}</dd></dl></div>`,
    foot:`<button class="btn btn-secondary" data-close>Cancel</button><span style="flex:1"></span><button class="btn btn-primary" id="giveBtn" disabled data-tip="Scan the wristband and the medication first">Record as Given</button>`});
  const g=$('#giveBtn');
  $('#dBody').onclick=e=>{ const b=e.target.closest('[data-sc]'); if(!b||chk[b.dataset.sc]) return; chk[b.dataset.sc]=true; b.classList.add('ok'); b.querySelector('small').textContent=b.dataset.sc==='wb'?`Matched · ${p.name}, ${p.mrn}`:`Matched · ${m.drug} ${m.dose}`; if(chk.wb&&chk.med){ g.disabled=false; g.removeAttribute('data-tip'); } };
  g.onclick=()=>{ const ini=App.role().user.replace(/^Dr\.\s*/,'').split(/[\s,]+/).slice(0,2).map(w=>w[0]).join('');
    if(prn) m.last='10:41'; else { m.given=m.given||{}; m.given[tt]=['10:41',ini]; }
    App.closeDrawer(); App.render(); UI.toast(`${m.drug} ${m.dose} recorded as given at 10:41 AM`); };
}
})();
