/* Dashboard · Patients · Patient record · Appointments */
(function(){
const {views}=App, {$,$$,esc,attr,ic,st,sicon,N,walk,hm,mins,tile,tiles,card,box,hbars,mini,table,avatar,legend}=App.h;
const statusKind={Inpatient:'confirm',Emergency:'bad',Outpatient:'muted',Discharged:'muted'};
const riskKind={Critical:'bad',High:'warn',Moderate:'muted',Low:'muted'};

/* =================== DASHBOARD =================== */
views.dashboard=()=>{
  const r=App.role(), f=App.fac();
  const occ=D.DEPTS.reduce((a,d)=>a+d.occ,0), beds=D.DEPTS.reduce((a,d)=>a+d.beds,0);
  const crit=D.ORDERS.filter(o=>o.flag==='crit'&&!o.ack).length+D.PATIENTS.filter(p=>p.news>=7).length;
  const appts=D.APPTS.filter(a=>!a.w&&a.day===1&&a.st!=='cancel'), waiting=D.APPTS.filter(a=>!a.w&&a.day===1&&(a.st==='waiting'||a.st==='checkedin'));
  const onDuty=D.STAFF.filter(s=>s.st==='on').length;
  const work={
    physician:[['warn','2 patients waiting for you in clinic','Sarah Cohen 10:45 AM · Samir Nair 11:00 AM','#/appointments'],['bad','Critical result: lactate 4.1','Daniel Okoye · ICU 07 · resulted 9:58 AM','#/diagnostics'],['bad','Critical result: troponin rising','Samuel Adeyemi · ED Bay 6 · 0.08 → 0.31 ng/mL','#/diagnostics'],['warn','Lisinopril held for Margaret Hollis','Potassium 5.3 · nurse is waiting for your decision','#/medications'],['muted','3 discharges planned today','Hollis, Tran and Fernández · checklists incomplete','#/admissions'],['muted','2 progress notes to sign','Becker, Carter · drafted this morning','#/clinical/p3']],
    nurse:[['warn','Medications due now','Enoxaparin for Hollis and Park, Pantoprazole for Carter','#/medications'],['bad','Lisinopril held — prescriber not yet notified','Margaret Hollis · 412A','#/medications'],['muted','Blood gas collected for Thomas Becker','Awaiting result · ordered 10:18 AM','#/diagnostics'],['muted','Admission arriving: Carlos Vega','Diabetic foot infection · bed not yet assigned','#/admissions'],['muted','Nurse-to-patient ratio 1:6 for Mia Alvarez','One above the 4 West limit of 1:5','#/staff']],
    reception:[[waiting.length?'warn':'muted',`${waiting.length} patients in the waiting room`,'Longest wait 32 min · Cardiology','#/appointments'],['muted','Next arrivals','Jack Wilson 11:15 AM · Amelia Stone 11:30 AM','#/appointments'],['muted','2 new registrations incomplete','Missing insurance details','#/patients'],['bad','1 no-show this morning','Grace Liu · Cardiology 9:00 AM · offer a new slot','#/appointments']],
    admin:[['bad','3 patients waiting for a bed','Longest 3h 48m · Beatrice Lang for 5 East','#/admissions'],['warn','2 staff on unplanned leave','Critical Care and Pediatrics · cover arranged for one','#/staff'],['warn','Access review due','14 accounts inactive for 90+ days','#/admin'],['muted','Monthly occupancy report ready','Scheduled report · 1 Oct','#/analytics']],
    mgmt:[['warn','Occupancy 89% — above the 85% target','5 East and Step-Down at 94–97%','#/facilities'],['muted','Average length of stay 4.7 days','Target 4.5 · Internal Medicine is the driver','#/analytics'],['muted','Overtime up 12% this month','Mostly ICU and Emergency nights','#/staff'],['muted','Quarterly board pack','Draft due 10 Oct','#/analytics']]
  }[r.id];
  const censusLbl=Array.from({length:12},(_,i)=>hm(i*1+0).replace(':00',''));
  const inpt=[243,242,241,240,240,241,243,245,248,250,251];
  const ed=[14,11,9,8,7,8,11,15,19,21,18].concat([null]);
  const hours=Array.from({length:11},(_,i)=>hm(i).replace(':00 ',' '));
  return {
    title:`Good morning, ${(n=>n.startsWith('Dr.')?'Dr. '+n.split(' ').pop():n.split(' ')[0])(r.user.replace(/,.*$/,''))}`,
    meta:[['bld',f.name],['cal','Tuesday, 29 September 2026'],['clock','10:40 AM · live']],
    actions:`<button class="btn btn-secondary" data-stub>${ic('dl')}Export</button>`,
    html: tiles([
      {l:'Inpatients',v:N(occ),s:`${Math.round(occ/beds*100)}% of ${beds} staffed beds`,href:'#/facilities',cls:occ/beds>.85?'warn':''},
      {l:'Waiting in Emergency',v:'18',s:'longest 2h 05m'},
      {l:'Appointments Today',v:String(appts.length),s:`${waiting.length} waiting now`,href:App.can('appointments')?'#/appointments':null},
      {l:'Critical Alerts',v:String(crit),s:'results + deteriorating patients',cls:'bad',href:App.can('diagnostics')?'#/diagnostics':null},
      {l:'Staff on Duty',v:String(onDuty),s:'day shift · 3 open shifts'}
    ].map(t=>{ if(!t.href) delete t.href; return t; }),'tiles-5')+
    `<div class="lay c5">`+
      card('Patient Census Today','Inpatients and Emergency department patients, by hour',box('dbCensus',230)+legend([{name:'Inpatients',color:'var(--s1)'},{name:'Waiting in Emergency',color:'var(--s2)'}]),{cls:'s3'})+
      card('Your Work Today',`For ${r.label.toLowerCase()} · most urgent first`,`<div class="att">${work.map(([k,t,d,h])=>{ const ok=App.can(h.split('/')[1]); return `<a href="${ok?h:'#'}">${sicon(k==='muted'?'muted':k,k==='bad'?'Urgent':k==='warn'?'Needs attention':'To do')}<span class="t">${esc(t)}</span><span class="go">${ic('go')}</span><span class="d">${esc(d)}</span></a>`; }).join('')}</div>`,{cls:'s2'})+
    `</div>`+
    `<div class="lay c5">`+
      card('Occupancy by Department','Beds in use · marker = 85% target',hbars(D.DEPTS.map(d=>({l:d.name,v:Math.round(d.occ/d.beds*100),t:85,c:d.occ/d.beds>=.95?'var(--s2)':'var(--s1)',vs:`${d.beds-d.occ} free`,tip:`<div class="tr"><span>Occupied</span><em>${d.occ} of ${d.beds}</em></div>`})),{max:100,fmt:v=>v+'%',lw:150,bg:true,vw:64}),{cls:'s3'})+
      card('Nurse Workload','Patients per nurse on shift vs unit limit',hbars(D.STAFF.filter(s=>s.role==='Nurse'&&s.st==='on').map(s=>({l:s.name.replace(', RN',''),sub:s.dept,v:s.load,t:s.cap,c:s.load>s.cap?'var(--s2)':'var(--s1)',vs:`limit ${s.cap}`,tip:`<div class="tr"><span>Patients</span><em>${s.load}</em></div><div class="tr"><span>Unit limit</span><em>${s.cap}</em></div>`})),{max:7,lw:150,bg:true,vw:56}),{cls:'s2'})+
    `</div>`,
    draw(){ V.line($('#dbCensus'),{labels:hours,series:[{name:'Inpatients',values:inpt,color:'var(--s1)'}],min:230,max:260,fmt:v=>Math.round(v),every:2,height:110,left:40});
      /* two measures on different scales → two small charts, not a dual axis */
      const el=$('#dbCensus'); const a=document.createElement('div'); a.id='dbEd'; el.appendChild(a);
      V.line(a,{labels:hours,series:[{name:'Waiting in Emergency',values:ed.slice(0,11),color:'var(--s2)'}],min:0,max:25,fmt:v=>Math.round(v),every:2,height:110,left:40}); }
  };
};

/* =================== PATIENTS =================== */
views.patients=(arg,root)=>{
  const q=root.q||'', f=root.f||'all';
  const TODAY=()=>D.PATIENTS.filter(p=>p.today!==false);
  const counts=s=>TODAY().filter(p=>s==='all'||p.status===s).length;
  /* read filter and search live from the view, not from the values at first render */
  const list=()=>{ const f=root.f||'all', q=(root.q||'').toLowerCase(); return TODAY().filter(p=>(f==='all'||p.status===f)&&(!q||(p.name+' '+p.mrn+' '+p.dx[0][1]).toLowerCase().includes(q))); };
  const TABS=[['all','All Today'],['Inpatient','In Hospital'],['Emergency','Emergency'],['Outpatient','Clinic Visits'],['Discharged','Discharged']];
  const rows=()=>list().map(p=>`<a class="t-row click" href="#/patient/${p.id}"><span class="pcell">${avatar(p.name)}<span class="cell"><b>${esc(p.name)}</b><span class="mono">${p.mrn}</span></span></span><span class="num">${p.age} · ${p.sex}</span>${st(statusKind[p.status],p.status)}<span class="cell"><b>${esc(p.loc)}</b></span><span class="cell"><b>${esc(D.doc(p.att).name)}</b>${esc(D.doc(p.att).spec)}</span><span class="cell"><b>${esc(p.dx[0][1])}</b><span class="mono">${p.dx[0][0]}</span></span><span>${p.allergies.length?`<span class="st bad" data-tip="${attr(p.allergies.join(', '))}">${ic('alert')}${p.allergies.length}</span>`:'<span class="muted" style="font-size:12.5px">None known</span>'}</span></a>`);
  const cols='minmax(0,1.5fr) 70px 110px minmax(0,1fr) minmax(0,1.1fr) minmax(0,1.5fr) 96px', head=['Patient','Age · Sex','Status','Location','Attending','Primary Diagnosis','Allergies'];
  return {
    title:'Patients', meta:[['user',`${TODAY().length} patients with activity today · ${App.fac().name}`],['doc','48,210 patients in the registry'],['lock','Access is logged for every record you open']],
    actions:`<button class="btn btn-secondary" data-stub>${ic('dl')}Export</button><button class="btn btn-primary" id="regBtn">${ic('plus')}Register Patient</button>`,
    html:`<div class="toolbar"><div class="seg st-tabs">${TABS.map(([s,l])=>`<button class="chip" data-filter="${s}" aria-pressed="${s===f}">${l} <span class="n">${counts(s)}</span></button>`).join('')}</div><div class="tb-right"><input class="input tb-search" id="pSearch" placeholder="Search by name, MRN or diagnosis…" value="${attr(q)}"></div></div><section class="card flush"><div id="pTable">${table(cols,head,rows(),{empty:'No patients match this search.'})}</div></section>`,
    bind(root){
      const upd=()=>{ $('#pTable',root).innerHTML=table(cols,head,rows(),{empty:'No patients match this search.'}); };
      root.addEventListener('input',e=>{ if(e.target.id!=='pSearch') return; root.q=e.target.value; views.patients.__q=root.q; upd(); });
      root.addEventListener('filter',e=>{ root.f=e.detail; upd(); });
      root.addEventListener('click',e=>{ if(e.target.closest('#regBtn')) registerDrawer(); });
    }
  };
};
function registerDrawer(){
  App.drawer({eyebrow:'New patient',title:'Register Patient',body:`<div class="form">
    <div class="field"><label>Full Name</label><input class="input" id="rgName" placeholder="First and last name"></div>
    <div class="f2"><div class="field"><label>Date of Birth</label><input class="input" id="rgDob" placeholder="DD MMM YYYY"></div><div class="field"><label>Sex</label><select class="input" id="rgSex"><option>F</option><option>M</option><option>X</option></select></div></div>
    <div class="field"><label>Known Allergies</label><input class="input" id="rgAll" placeholder="Comma separated, or leave empty"><span class="help">Allergies show on every screen for this patient.</span></div>
    <div class="field"><label>Primary Physician</label><select class="input" id="rgDoc">${D.DOCTORS.map(d=>`<option value="${d.id}">${esc(d.name)} · ${esc(d.spec)}</option>`).join('')}</select></div>
    <div class="demo-note">${ic('info')}Demo only — nothing is stored beyond this browser tab.</div></div>`,
    foot:`<button class="btn btn-secondary" data-close>Cancel</button><span style="flex:1"></span><button class="btn btn-primary" id="rgSave" disabled data-tip="Enter the patient's name and date of birth">Register</button>`});
  const b=$('#rgSave'), chk=()=>{ const ok=$('#rgName').value.trim().length>2&&$('#rgDob').value.trim().length>5; b.disabled=!ok; ok?b.removeAttribute('data-tip'):b.setAttribute('data-tip',"Enter the patient's name and date of birth"); };
  $('#dBody').addEventListener('input',chk);
  b.onclick=()=>{ const id='p'+(D.PATIENTS.length+1)+'n', dob=$('#rgDob').value.trim(), y=+(dob.match(/\d{4}/)||[1990])[0];
    D.PATIENTS.unshift({id,name:$('#rgName').value.trim(),mrn:'CG-'+(111000+D.PATIENTS.length),age:2026-y,sex:$('#rgSex').value,dob,status:'Outpatient',loc:'Registered today',att:$('#rgDoc').value,dx:[['Z00.00','New patient · no diagnosis yet']],allergies:$('#rgAll').value.split(',').map(s=>s.trim()).filter(Boolean),risk:'Low',code:'—'});
    App.closeDrawer(); App.render(); UI.toast('Patient registered · MRN assigned'); };
}

/* =================== PATIENT RECORD =================== */
/* Shared: the Overview / Timeline / Documents tabs of a patient. Used by the record page and the appointment preview. */
function patientTabs(p,pre=''){
  const d=D.doc(p.att), inpt=p.status==='Inpatient'||p.status==='Emergency';
  const orders=D.ORDERS.filter(o=>o.p===p.id), meds=D.MAR[p.id]||[], appt=D.APPTS.find(a=>a.pid===p.id);
  const s=+p.mrn.slice(-4), vit=[['Heart rate',walk(s,12,84,p.news>5?2.2:.2,5),'bpm'],['Blood pressure',walk(s+1,12,128,p.news>5?-2.5:0,6),'mmHg sys.'],['SpO₂',walk(s+2,12,96,p.news>5?-.35:0,1),'%'],['Temperature',walk(s+3,12,37,p.news>5?.1:0,.25),'°C'],['Resp. rate',walk(s+4,12,17,p.news>5?.6:0,1.5),'/min']];
  const kid=p.age<16;
  const timeline=inpt?[
    ['Today 9:58 AM','Result','Lactate 4.1 mmol/L flagged critical','bad'],['Today 8:12 AM','Medication','Metoprolol 25 mg given by J. Okafor','ok'],
    ['Today 7:30 AM','Round',`Morning round by ${d.name}`,'muted'],[p.admitted,'Admission',`Admitted from Emergency · ${p.dx[0][1]}`,'muted'],
    ['14 Jun 2026','Visit','Annual review · Internal Medicine','muted'],['03 Feb 2026','Diagnostics','Echocardiogram · ejection fraction 35%','muted'],['18 Nov 2025','Admission','Pneumonia · 4 days · discharged home','muted']
  ]:[
    ...(appt?[[`Today ${hm(appt.s)}`,'Appointment',`${appt.reason} · ${d.name}`,appt.st==='noshow'?'bad':appt.st==='done'?'ok':'muted']]:[]),
    ['02 Sep 2026','Result',kid?'Allergy panel · no new sensitivities':'Blood panel · within normal range','muted'],
    ['18 Aug 2026','Visit',`${kid?'Check-up':'Follow-up'} with ${d.name}`,'muted'],
    ['12 Mar 2026','Referral',`Referred by primary care · ${p.dx[0][1]}`,'muted'],
    ['04 Nov 2025','Visit',kid?'Vaccination · influenza':'Annual physical · primary care','muted']
  ];
  const docs=inpt?[['Admission History & Physical',d.name,'26 Sep 2026','Note'],['Consent for Treatment','Patient','26 Sep 2026','Consent'],['ECG · 12-lead','Cardiology','26 Sep 2026','Tracing'],['Echocardiogram Report','Dr. Anika Lindqvist','03 Feb 2026','Report'],['Discharge Summary','Dr. Elena Marsh','22 Nov 2025','Summary']]
    :[['Visit Note',d.name,'18 Aug 2026','Note'],['Lab Results',  'Laboratory','02 Sep 2026','Report'],['Referral Letter','Primary care','12 Mar 2026','Letter'],[kid?'Immunization Record':'Consent for Treatment',kid?'Pediatrics':'Patient','12 Mar 2026',kid?'Record':'Consent']];
  const homeMeds=kid?[{drug:'Salbutamol inhaler',dose:'100 mcg',route:'Inhaled',freq:'As needed',prn:true}]:[{drug:'Amlodipine',dose:'5 mg',route:'PO',freq:'Daily'},{drug:'Atorvastatin',dose:'20 mg',route:'PO',freq:'Nightly'}];
  const resRow=o=>`<div class="t-row click" data-ordp="${o.id}"><span class="cell"><b>${esc(o.test)}</b><span class="mono">${o.id}</span></span>${o.flag==='crit'?st('bad','Critical'):o.flag==='abn'?st('warn','Abnormal'):o.st==='resulted'?st('ok','Normal'):st('muted',{ordered:'Ordered',collected:'Collected',progress:'In Progress',scheduled:'Scheduled'}[o.st])}<span class="num muted">${hm(o.ordered)}</span></div>`;
  const tabs=`<div class="seg rec-tabs" role="tablist"><button role="tab" aria-selected="true" data-tab="${pre}ov">Overview</button>${!inpt&&App.visitsOf?`<button role="tab" aria-selected="false" data-tab="${pre}vs">Visits <span class="n">${App.visitsOf(p).length}</span></button>`:''}<button role="tab" aria-selected="false" data-tab="${pre}tl">Timeline <span class="n">${timeline.length}</span></button><button role="tab" aria-selected="false" data-tab="${pre}dc">Documents <span class="n">${docs.length}</span></button></div>`;
  const panels=`<div role="tabpanel" class="tp" id="panel-${pre}ov">
      ${card('Diagnoses','Problem list · ICD-10',table('90px minmax(0,1fr) 100px',['Code','Diagnosis','Status'],p.dx.map((x,i)=>`<div class="t-row"><span class="mono">${x[0]}</span><span class="t">${esc(x[1])}</span>${st(i===0?'confirm':'muted',i===0?'Primary':'Active')}</div>`)),{cls:'flush'})}
      ${!inpt&&App.histCard?App.histCard(p):''}
      ${inpt?card('Vitals','Last 12 hours',`<div class="vitals">${vit.map(([n,v,u],i)=>`<span>${n}</span>${V.spark(v,{w:140,h:26,color:i===0?'var(--s1)':'var(--ink-3)'})}<span class="v">${v[11].toFixed(n==='Temperature'?1:0)} ${u}</span>`).join('')}</div>`+`<div class="legend"><span style="color:var(--ink-3)">Early warning score (NEWS2): <b style="color:var(--${p.news>=7?'bad':p.news>=5?'warn':'ink'});font-weight:500">${p.news}</b></span></div>`):''}
      ${card('Active Medications',meds.length?'From the medication administration record':'Home medications',table('minmax(0,1.3fr) minmax(0,.8fr) 70px minmax(0,1.2fr) 110px',['Medication','Dose','Route','Frequency','Status'],[...(p.newRx||[]),...(meds.length?meds:homeMeds)].map(m=>`<div class="t-row"><span class="t">${esc(m.drug)}</span><span class="cell"><b>${esc(m.dose)}</b></span><span class="cell"><b>${esc(m.route)}</b></span><span class="cell"><b>${esc(m.freq)}</b></span>${m.fresh?st('confirm','New · Sent'):m.held?st('warn','Held'):m.prn?st('muted','As Needed'):st('ok','Active')}</div>`)),{cls:'flush'})}
      ${card('Diagnostics','Orders for this patient',table('minmax(0,1fr) 120px 80px',['Test','Result','Ordered'],orders.map(resRow),{empty:'No open orders.'}),{cls:'flush'})}
    </div>
    ${!inpt&&App.visitsPanel?`<div role="tabpanel" class="tp" id="panel-${pre}vs" hidden>${App.visitsPanel(p)}</div>`:''}
    <div role="tabpanel" class="tp" id="panel-${pre}tl" hidden>${card('','',`<div class="tline">${timeline.map(([t,k,x,s])=>`<div class="ti"><span class="tdot ${s}"></span><div><div class="tm">${t} · ${k}</div><div class="tx">${esc(x)}</div></div></div>`).join('')}</div>`)}</div>
    <div role="tabpanel" class="tp" id="panel-${pre}dc" hidden>${card('','',table('minmax(0,1.4fr) minmax(0,1fr) 110px 90px',['Document','Author','Date','Type'],docs.map(([n,a,dt,t])=>`<div class="t-row click" data-stub><span class="pcell"><span class="fic">${ic('doc')}</span><span class="t">${n}</span></span><span class="cell"><b>${a}</b></span><span class="num muted">${dt}</span><span class="cell">${t}</span></div>`)),{cls:'flush'})}</div>`;
  return {tabs,panels,inpt,d};
}
views.patient=(id)=>{
  const p=D.pat(id)||D.PATIENTS[0], {tabs,panels,inpt,d}=patientTabs(p);
  return {
    back:App.patBack||'#/patients', title:p.name,
    meta:[['doc',p.mrn],['user',`${p.age} · ${p.sex} · born ${p.dob}`],['bed',p.loc],['user',d.name],['shield',p.code,p.code==='DNR'?'warn':''],p.allergies.length?['alert','Allergies: '+p.allergies.join(', '),'bad']:['ok','No known allergies']],
    actions:`<div class="menu-wrap"><button class="icon-btn" data-menu="#pMore" aria-label="More Actions" aria-expanded="false"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg></button><div class="pop right" id="pMore" role="menu"><button class="it" data-stub>Print Face Sheet</button><button class="it" data-stub>Merge Duplicate Record</button><div class="sep"></div><button class="it" data-stub>Request Record Access Log</button></div></div>`+
      (App.S.role==='physician'&&!inpt?`<button class="btn btn-primary" id="recRx">${ic('pill')}Prescribe</button>`:App.can('clinical')&&inpt?`<a class="btn btn-primary" href="#/clinical/${p.id}">Open Care Plan</a>`:''),
    bind(root){ root.addEventListener('click',e=>{ if(e.target.closest('#recRx')) App.prescribe(p,{onDone:()=>App.render()}); }); },
    bodyCls:'split-body',
    html:`${tabs}
    <div class="rec">
      <div class="rec-main">
        ${panels}
      </div>
      <aside class="rec-side">
        ${card('Care Team','',`<div class="team">${[[d.name,'Attending · '+d.spec],...(inpt?[['Jordan Okafor, RN','Primary nurse'],['Emily Watson','Clinical pharmacist']]:[['Maya Chen','Front desk']])].map(([n,r])=>`<div class="tm-r">${avatar(n)}<span class="cell"><b>${esc(n)}</b>${esc(r)}</span><button class="icon-btn" aria-label="Message ${attr(n)}" data-stub>${ic('phone')}</button></div>`).join('')}</div>`)}
        ${card('Encounter','',`<dl class="dl"><dt>Status</dt><dd>${st(statusKind[p.status],p.status)}</dd><dt>Location</dt><dd>${esc(p.loc)}</dd>${inpt?`<dt>Admitted</dt><dd>${p.admitted} · day ${p.los+1}</dd>`:''}<dt>Risk</dt><dd>${st(riskKind[p.risk],p.risk)}</dd><dt>Code status</dt><dd>${esc(p.code)}</dd><dt>Insurance</dt><dd>Medicare Part A</dd></dl>`)}
        <div class="demo-note">${ic('lock')}Opening this record was logged for audit.</div>
      </aside>
    </div>`
  };
};

/* =================== APPOINTMENTS =================== */
const COLS=['lindqvist','menon','haddad','adler','marsh'], H0=8, H1=17;
const APST={done:['muted','Completed'],noshow:['bad','No-Show'],progress:['confirm','In Progress'],waiting:['warn','Waiting'],checkedin:['ok','Checked In'],sched:['muted','Scheduled'],cancel:['muted','Cancelled']};
views.appointments=(arg,root)=>{
  if(App.S.role==='physician') return myWeek('marsh',root);
  const dAbs=root.dabs??1, dw=Math.floor(dAbs/7), dd=((dAbs%7)+7)%7, isT=dAbs===1; root.range='day'; root.pmode='day';
  D.ensureDay(dw,dd);
  const A=D.APPTS.filter(a=>(a.w||0)===dw&&a.day===dd), live=A.filter(a=>a.st!=='cancel');
  const queue=A.filter(a=>a.st==='waiting'||a.st==='checkedin').sort((a,b)=>a.arrived-b.arrived);
  const slot=v=>((v-H0)/(H1-H0)*100).toFixed(3)+'%';
  const grid=`<div class="cal" style="--cols:${COLS.length}">
    <div class="cal-h"><span></span>${COLS.map(c=>{ const d=D.doc(c), n=A.filter(a=>a.doc===c&&a.st!=='cancel').length; return `<span class="cal-doc">${avatar(d.name)}<span class="cell"><b>Dr. ${esc(d.name.split(' ').pop())}</b>${esc(d.spec)} · ${n} today</span></span>`; }).join('')}</div>
    <div class="cal-b">
      <div class="cal-t">${Array.from({length:H1-H0},(_,i)=>`<span style="top:${slot(H0+i)}">${hm(H0+i).replace(':00','')}</span>`).join('')}</div>
      ${COLS.map(c=>`<div class="cal-col">${A.filter(a=>a.doc===c).map(a=>{ const [k,l]=APST[a.st]; return `<button class="appt ${a.st}${a.e-a.s<.4?' short':''}" data-ap="${a.id}" style="top:${slot(a.s)};height:calc(${((a.e-a.s)/(H1-H0)*100).toFixed(3)}% - 3px)" data-t="${attr(`<b>${esc(a.name)}</b><div class="tr"><span>${hm(a.s)} – ${hm(a.e)}</span></div><div class="tr"><span>${esc(a.reason)}</span></div><div class="tr"><span>${l}</span></div>`)}"><b>${esc(a.name)}</b><span>${hm(a.s).replace(' AM','').replace(' PM','')} · ${esc(a.reason)}</span></button>`; }).join('')}</div>`).join('')}
      ${isT?`<div class="cal-now" style="top:${slot(D.NOW)}"><span>${hm(D.NOW)}</span></div>`:''}
    </div></div>
    <div class="legend">${['progress','checkedin','waiting','sched','done','noshow'].map(s=>`<span><i class="lg-ap ${s}"></i>${APST[s][1]}</span>`).join('')}</div>`;
  return {
    title:'Appointments', meta:[['cal',isT?'Today, Tue 29 Sep':D.dayLabel(dw,dd,true)],['bld','Outpatient clinics · '+App.fac().name],['clock','10:40 AM']],
    actions:`<div class="menu-wrap"><button class="head-sel" data-menu="#spPop" aria-expanded="false">${ic('cal')}${esc(isT?'Today · Tue 29 Sep':D.dayLabel(dw,dd))}${ic('chev')}</button><div class="pop right dp cal-pick day-only" id="spPop">${pickerBody(root)}</div></div><button class="btn btn-primary" id="newAp">${ic('plus')}New Appointment</button>`,
    html: tiles([
      {l:isT?'Scheduled Today':'Scheduled',v:String(live.length),s:`${A.filter(a=>a.st==='cancel').length} cancelled`},
      {l:'Completed',v:String(A.filter(a=>a.st==='done').length),s:isT?'on time: 82%':''},
      {l:'In the Waiting Room',v:String(queue.length),s:queue.length?`longest ${mins((D.NOW-queue[0].arrived)*60)}`:'no one waiting',cls:queue.length>3?'warn':''},
      {l:'No-Shows',v:String(A.filter(a=>a.st==='noshow').length),s:isT?'this morning':''}
    ])+
    `<div class="lay c4">`+
      card('Clinic Schedule','5 clinicians · select an appointment to check in, call in or cancel',grid,{cls:'s3'})+
      card('Waiting Room','In order of arrival',queue.length?`<div class="feed">${queue.map(a=>{ const w=(D.NOW-a.arrived)*60; return `<div class="fi"><div class="meta">${avatar(a.name,"sm")}<b style="color:var(--ink);font-weight:500;font-size:13.5px">${esc(a.name)}</b></div><span style="font-size:12.5px;color:var(--ink-2)">${esc(D.doc(a.doc).name)} · ${hm(a.s)}<br><span style="color:var(--${w>25?'warn':'ink-3'})">waiting ${mins(w)}</span></span><span class="act"><button class="btn btn-weak btn-sm" data-call="${a.id}">Call In</button></span></div>`; }).join('')}</div>`:`<div class="empty">No one is waiting.</div>`,{cls:'s1'})+
    `</div>`,
    bind(root){
      root.addEventListener('click',e=>{
        const pmn=e.target.closest('#spPop [data-pm]'); if(pmn){ e.stopPropagation(); root.pm=+pmn.dataset.pm; document.getElementById('spPop').innerHTML=pickerBody(root); return; }
        const pd=e.target.closest('#spPop [data-day]'); if(pd){ root.dabs=+pd.dataset.day; root.pm=null; App.render(); return; }
        const c=e.target.closest('[data-call]'); if(c){ callIn(c.dataset.call); return; }
        const a=e.target.closest('[data-ap]'); if(a){ apptDrawer(a.dataset.ap); return; }
        if(e.target.closest('#newAp')) newAppt();
      });
    }
  };
};

/* Prescribing form — used from the visit drawer and from Medications → New Prescription */
App.prescribe=function(p0,{onBack,onDone}={}){
  const F=D.FORMULARY, outp=App.S.role==='physician'?D.PATIENTS.filter(x=>x.att==='marsh'&&x.status!=='Inpatient'):D.PATIENTS.filter(x=>x.today!==false&&x.status!=='Discharged');
  let p=p0||null, f=null, hi=0;
  const check=()=>{ if(!p||!f) return null; const al=(p.allergies||[]).find(a=>(D.CROSS[a]||[a]).some(c=>c===f.cls||c===f.drug)); const cur=[...(p.newRx||[]),...(D.MAR[p.id]||[])];
    const dup=cur.find(m=>m.drug===f.drug), ace=f.cls==='NSAID'&&cur.some(m=>/lisinopril/i.test(m.drug));
    return al?['bad',`Allergy: ${al}. ${f.drug} (${f.cls}) can cause a reaction. Choose another medication.`]:dup?['warn',`${f.drug} is already on the medication list.`]:ace?['warn','NSAID with an ACE inhibitor can reduce kidney function. Check creatinine.']:['ok','No allergies or interactions found.']; };
  const eyebrow=()=>p?`${esc(p.name)} · ${p.mrn} · ${p.age} · ${p.sex}${p.allergies.length?' · allergies: '+esc(p.allergies.join(', ')):''}`:'Choose a patient and a medication';
  App.drawer({eyebrow:eyebrow(),title:'New Prescription',wide:true,body:`<div class="form">
      ${p0?'':`<div class="field"><label>Patient</label><select class="input req" id="rxP"><option value="" disabled selected>Select a patient</option>${outp.map(x=>`<option value="${x.id}">${esc(x.name)} · ${x.mrn}</option>`).join('')}</select></div>`}
      <div class="field combo"><label>Medication</label><div class="combo-in"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input class="input" id="rxSearch" placeholder="Search by name or group, e.g. statin" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="rxList"></div><div class="combo-list" id="rxList" role="listbox" hidden></div></div>
      <div class="f3"><div class="field"><label>Dose</label><input class="input" id="rxDose" placeholder="e.g. 400 mg"></div><div class="field"><label>Route</label><input class="input" id="rxRoute" placeholder="e.g. PO"></div><div class="field"><label>Duration</label><input class="input" id="rxDays" placeholder="e.g. 7 days"></div></div>
      <div class="field"><label>Frequency</label><input class="input" id="rxFreq" placeholder="e.g. Every 8h as needed"></div>
      <div class="f2 even"><div class="field"><label>Refills</label><select class="input req" id="rxRef"><option value="" disabled selected>Select</option><option>0</option><option>1</option><option>2</option><option>3</option></select></div><div class="field"><label>Pharmacy</label><select class="input req" id="rxPh"><option value="" disabled selected>Select a pharmacy</option><option>Westside Pharmacy · 0.8 mi</option><option>Corvina General Outpatient Pharmacy</option></select></div></div>
      <div class="field"><label>Instructions for the Patient</label><textarea class="textarea" id="rxNote" placeholder="Optional"></textarea></div>
      <div id="rxInfo"></div>
    </div>`,
    foot:`<button class="btn btn-secondary" id="rxBack">${onBack?'Back to Visit':'Cancel'}</button><span style="flex:1"></span><button class="btn btn-secondary" id="rxPrint" disabled><svg viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/></svg>Print</button><button class="btn btn-primary" id="rxSend" disabled>Send to Pharmacy</button>`});
  const $s=q=>document.querySelector(q), send=$s('#rxSend'), list=$s('#rxList'), search=$s('#rxSearch');
  const info=()=>{ const c=check(); if(!c){ $s('#rxInfo').innerHTML=`<div class="rx-hint">${ic('info')}Price and safety check appear once a patient and a medication are chosen.</div>`; return; }
    const pr=D.priceOf(f,p); $s('#rxInfo').innerHTML=`<div class="rx-price"><div><span class="muted">List price</span><s>$${pr.list.toFixed(2)}</s></div>${pr.steps.map(([l,v])=>`<div><span class="muted">${esc(l)}</span><span class="ok">−$${v.toFixed(2)}</span></div>`).join('')}<div class="tot"><span>Patient pays</span><b>$${pr.pays.toFixed(2)}</b></div></div><div class="rx-check ${c[0]}" style="margin-top:12px">${ic(c[0]==='ok'?'ok':'alert')}<span>${esc(c[1])}</span></div>`; };
  const sync=()=>{ const c=check(), miss=[!p&&'patient',!f&&'medication',!$s('#rxDose').value.trim()&&'dose',!$s('#rxFreq').value.trim()&&'frequency',!$s('#rxDays').value.trim()&&'duration',!$s('#rxRef').value&&'refills',!$s('#rxPh').value&&'pharmacy'].filter(Boolean);
    const blocked=c&&c[0]==='bad'; send.disabled=!!miss.length||blocked;
    const pb=$s('#rxPrint'); pb.disabled=send.disabled; send.hasAttribute('data-tip')?pb.setAttribute('data-tip',send.getAttribute('data-tip')):pb.removeAttribute('data-tip');
    blocked?send.setAttribute('data-tip','Allergy conflict · choose another medication'):miss.length?send.setAttribute('data-tip','Missing: '+miss.join(', ')):send.removeAttribute('data-tip');
    $s('#dEyebrow').innerHTML=eyebrow(); };
  const GRP={Statin:'cholesterol',Biguanide:'diabetes',SSRI:'depression anxiety mental health',NSAID:'pain inflammation',Analgesic:'pain fever','Muscle relaxant':'pain back spasm',Bronchodilator:'asthma copd respiratory inhaler',Penicillin:'antibiotic infection','ACE inhibitor':'blood pressure hypertension'};
  const matches=()=>{ const q=search.value.trim().toLowerCase(); return F.filter(x=>!q||(x.drug+' '+x.cls+' '+(GRP[x.cls]||'')).toLowerCase().includes(q)); };
  const draw=()=>{ const M=matches(); hi=Math.min(hi,Math.max(0,M.length-1));
    list.innerHTML=M.length?M.map((x,i)=>`<button type="button" class="combo-it${i===hi?' hi':''}" role="option" data-i="${F.indexOf(x)}"><b>${esc(x.drug)}</b><span>${esc(x.cls)} · ${esc(x.dose)} · ${esc(x.freq)}</span></button>`).join(''):`<div class="combo-empty">No medication matches “${esc(search.value)}”</div>`;
    list.hidden=false; search.setAttribute('aria-expanded','true'); };
  const pick=i=>{ f=F[i]; search.value=`${f.drug} · ${f.cls}`; list.hidden=true; search.setAttribute('aria-expanded','false');
    $s('#rxDose').value=f.dose; $s('#rxRoute').value=f.route; $s('#rxFreq').value=f.freq; $s('#rxDays').value=f.days+' days'; if(!$s('#rxNote').value) $s('#rxNote').value=f.note||'';
    /* long-term meds get 2 refills (3 months in total), short courses none; pharmacy = the one the patient used last */
    $s('#rxRef').value=f.days>=30?'2':'0';
    if(!$s('#rxPh').value){ const last=p&&D.ORX.find(r=>r.pid===p.id&&r.pharmacy); const ph=$s('#rxPh'), o=[...ph.options].find(o=>o.value&&o.value.startsWith(last?last.pharmacy.split(' · ')[0]:'Westside')); if(o) ph.value=o.value; }
    info(); sync(); };
  search.addEventListener('focus',()=>{ if(f) search.select(); draw(); });
  search.addEventListener('input',()=>{ f=null; hi=0; draw(); info(); sync(); });
  search.addEventListener('keydown',e=>{ const M=matches(); if(e.key==='ArrowDown'){ e.preventDefault(); hi=Math.min(hi+1,M.length-1); draw(); } else if(e.key==='ArrowUp'){ e.preventDefault(); hi=Math.max(hi-1,0); draw(); } else if(e.key==='Enter'&&M[hi]){ e.preventDefault(); pick(F.indexOf(M[hi])); } else if(e.key==='Escape'){ list.hidden=true; } });
  list.addEventListener('mousedown',e=>{ const it=e.target.closest('[data-i]'); if(it){ e.preventDefault(); pick(+it.dataset.i); } });
  search.addEventListener('blur',()=>setTimeout(()=>{ list.hidden=true; search.setAttribute('aria-expanded','false'); },120));
  const ps=$s('#rxP'); if(ps) ps.addEventListener('change',()=>{ p=D.pat(ps.value); info(); sync(); });
  $s('#dBody').addEventListener('input',e=>{ if(e.target.id!=='rxSearch') sync(); });
  $s('#dBody').addEventListener('change',sync);
  $s('#rxBack').onclick=()=>onBack?onBack():App.closeDrawer();
  $s('#rxPrint').onclick=()=>App.printRx({patient:p,doctor:App.role().id==='physician'?'Dr. Elena Marsh':App.role().user,date:'29 Sep 2026',drug:f.drug,dose:$s('#rxDose').value,route:$s('#rxRoute').value,freq:$s('#rxFreq').value,days:$s('#rxDays').value,refills:$s('#rxRef').value,pharmacy:$s('#rxPh').value,note:$s('#rxNote').value});
  send.onclick=()=>{ const m={drug:f.drug,dose:$s('#rxDose').value,route:$s('#rxRoute').value,freq:$s('#rxFreq').value,fresh:true};
    p.newRx=[m,...(p.newRx||[])];
    D.RX.unshift({pid:p.id,order:`${m.drug} ${m.dose} ${m.route} · ${m.freq} · ${$s('#rxDays').value}`,doc:'marsh',status:'Sent to Pharmacy',warn:check()[0]==='warn'?check()[1]:''});
    D.ORX.unshift({id:'RX-'+(52500+D.ORX.length),date:'29 Sep',pid:p.id,f,qty:30,status:'Sent',price:D.priceOf(f,p),refills:+$s('#rxRef').value,pharmacy:$s('#rxPh').value,fresh:true});
    UI.toast(`${m.drug} ${m.dose} sent to ${$s('#rxPh').value.split(' · ')[0]} · ${p.name} gets an SMS when it's ready`);
    onDone?onDone():App.closeDrawer(); App.render(); };
  info(); sync(); if(p0) setTimeout(()=>search.focus(),60);
};

/* Physician view: one clinician, the working week by shifts */
const DAYS=['Mon 28','Tue 29','Wed 30','Thu 1','Fri 2'];
/* working days covered by the demo: Mon 21 Sep (−7) … Fri 9 Oct (11), today = 1 */
const okDay=d=>d>=-56&&d<=67&&((d%7)+7)%7<5;
function stepFrom(from,dir){ let d=from+dir; while(d>=-56&&d<=67&&!okDay(d)) d+=dir; return okDay(d)?d:null; }


/* Physician view uses three states: Scheduled (booked, arrived, in the room), Completed, Absent (no-show or cancelled) */
const S3=st=>st==='done'?'done':(st==='noshow'||st==='cancel')?'absent':'sched';
const S3L={sched:['muted','Scheduled'],done:['ok','Completed'],absent:['bad','Absent']};
/* One floating menu for row actions in the doctor's list — same actions as the visit window */
function rowMenu(btn){
  let m=document.getElementById('rowMenu');
  if(!m){ m=document.createElement('div'); m.className='pop row-menu'; m.id='rowMenu'; m.setAttribute('role','menu'); document.body.appendChild(m);
    m.addEventListener('click',e=>{ const it=e.target.closest('[data-do]'); if(!it) return; m.classList.remove('on'); const [kind,id]=m.dataset.for.split(':');
      const pid=kind==='h'?D.HOMEVISITS.find(v=>v.id===id).pid:D.APPTS.find(a=>a.id===id).pid, p=D.pat(pid);
      if(it.dataset.do==='rx') App.prescribe(p,{onDone:()=>App.render()});
      if(it.dataset.do==='open') location.hash='#/patient/'+pid;
      if(it.dataset.do==='visit') kind==='h'?App.hvDrawer(id):apptDrawer(id);
      if(it.dataset.do==='absent'){ const ap=D.APPTS.find(a=>a.id===id); ap.st='noshow'; App.render(); UI.toast(`${ap.name} marked absent · a rebooking SMS was sent`); } });
    window.addEventListener('scroll',()=>m.classList.remove('on'),true); }
  const [kind,id]=btn.dataset.more.split(':'), a=kind==='c'?D.APPTS.find(x=>x.id===id):null, canAbsent=a&&a.st==='sched'&&!a.w&&a.day===1;
  if(m.classList.contains('on')&&m.dataset.for===btn.dataset.more){ m.classList.remove('on'); return; }
  m.dataset.for=btn.dataset.more;
  m.innerHTML=`<button class="it" data-stub>${ic('flask')}Order Lab Test</button><button class="it" data-stub>${ic('img')}Order Imaging</button><button class="it" data-stub>${ic('doc')}Refer to Specialist</button><button class="it" data-stub>${ic('edit')}Sick Note</button><div class="sep"></div><button class="it" data-do="visit">${ic(kind==='h'?'home':'cal')}Open ${kind==='h'?'Home Visit':'Visit'}</button><button class="it" data-do="open">${ic('user')}Open Patient Record</button>`;
  m.classList.add('on'); const r=btn.getBoundingClientRect(); const w=m.offsetWidth, h=m.offsetHeight;
  let left=r.right-w, top=r.bottom+6; if(top+h>innerHeight-8) top=r.top-6-h; m.style.left=Math.max(8,left)+'px'; m.style.top=top+'px';
}

/* Month calendar picker: Day or Week mode, month arrows, quick presets */
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const BASE=new Date(2026,8,28);
const absOf=dt=>Math.round((dt-BASE)/864e5);
function pickerBody(root){
  const range=root.range||'day', mode=root.pmode||range, dAbs=root.dabs??1, W=root.wk||0;
  const selDate=new Date(2026,8,28+(range==='day'?dAbs:W*7));
  const pm=root.pm??(selDate.getFullYear()*12+selDate.getMonth()), y=Math.floor(pm/12), m=pm%12;
  const first=new Date(y,m,1), start=new Date(y,m,1-((first.getDay()+6)%7));
  const minM=2026*12+7, maxM=2026*12+10;
  let rows='';
  for(let r=0;r<6;r++){ const wkAbs=absOf(new Date(start.getFullYear(),start.getMonth(),start.getDate()+r*7)), wk=Math.floor(wkAbs/7);
    if(new Date(start.getFullYear(),start.getMonth(),start.getDate()+r*7).getMonth()!==m&&r>3) break;
    const wkOn=range==='week'&&wk===W, wkOk=wk>=-8&&wk<=9;
    rows+=`<div class="cp-row${mode==='week'?' wkmode':''}${wkOn?' on':''}" ${mode==='week'&&wkOk?`data-wk="${wk}"`:''}>`;
    for(let i=0;i<7;i++){ const dt=new Date(start.getFullYear(),start.getMonth(),start.getDate()+r*7+i), a=absOf(dt), inM=dt.getMonth()===m, ok=okDay(a);
      const on=range==='day'&&a===dAbs, today=a===1;
      rows+=mode==='day'?`<button class="cp-d${inM?'':' out'}${on?' on':''}${today?' today':''}" ${ok?`data-day="${a}"`:'disabled'}>${dt.getDate()}</button>`
        :`<span class="cp-d${inM?'':' out'}${today?' today':''}${i>4?' we':''}">${dt.getDate()}</span>`; }
    rows+='</div>'; }
  return `<div class="cp-top"><div class="seg" role="tablist"><button role="tab" aria-selected="${mode==='day'}" data-pmode="day">Day</button><button role="tab" aria-selected="${mode==='week'}" data-pmode="week">Week</button></div></div>
    <div class="cp-h"><button class="icon-btn" data-pm="${pm-1}" aria-label="Previous Month" ${pm<=minM?'disabled':''}>${ic('back')}</button><b>${MON[m]} ${y}</b><button class="icon-btn" data-pm="${pm+1}" aria-label="Next Month" ${pm>=maxM?'disabled':''}>${ic('go')}</button></div>
    <div class="cp-dow">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<span>${x}</span>`).join('')}</div>
    <div class="cp-g">${rows}</div>
    <div class="cp-hint">${mode==='week'?'Select a week':'Select a day · weekends have no clinic'}</div>
    <div class="dp-f"><button class="btn btn-ghost btn-sm" data-day="1">Today</button><button class="btn btn-ghost btn-sm" data-wk="0">This Week</button><button class="btn btn-ghost btn-sm" data-wk="-1">Last Week</button></div>`;
}
function myWeek(docId,root){
  const range=root.range||'day', mode=root.mode||'list', W=root.wk||0, dAbs=root.dabs??1;
  D.ensureWeek(range==='day'?Math.floor(dAbs/7):W);
  const tab=root.tab||'sched', inTab=x=>S3(x.st)===tab;
  const doc=D.doc(docId), ALL=D.APPTS.filter(a=>a.doc===docId);
  const dW=Math.floor(dAbs/7), dD=((dAbs%7)+7)%7;
  const cols=range==='day'?[[dW,dD]]:[0,1,2,3,4].map(i=>[W,i]);
  const apOf=(w,i)=>ALL.filter(a=>(a.w||0)===w&&a.day===i).sort((a,b)=>a.s-b.s), hvOf=(w,i)=>D.HOMEVISITS.filter(v=>(v.w||0)===w&&v.day===i).sort((a,b)=>a.s-b.s);
  const T0=ALL.filter(a=>!a.w), today=T0.filter(a=>a.day===1&&a.st!=='cancel');
  const queue=T0.filter(a=>a.day===1&&(a.st==='waiting'||a.st==='checkedin')).sort((a,b)=>a.s-b.s);
  const slot=v=>((v-H0)/(H1-H0)*100).toFixed(3)+'%', isToday=(w,i)=>!w&&i===1;
  const shift=(w,i)=>doc.clinicDays.includes(i)?['clinic','Clinic · 8 AM – 4 PM']:['home','Home visits · '+hvOf(w,i).length+' patients'];
  const hvBtn=v=>{ const hp=D.pat(v.pid); return `<button class="appt home${v.st==='done'?' done':''}" data-hv="${v.id}" style="top:${slot(v.s)};height:calc(${((v.e-v.s)/(H1-H0)*100).toFixed(3)}% - 3px)" data-t="${attr(`<b>${esc(hp.name)}</b><div class="tr"><span>${hm(v.s)} – ${hm(v.e)} · home</span></div><div class="tr"><span>${esc(hp.addr)}</span></div><div class="tr"><span>${esc(v.reason)}</span></div>`)}"><b>${esc(hp.name)}</b><span>${ic('home')}${esc(hp.addr)}${range==='day'?' · '+esc(v.reason):''}</span></button>`; };
  const apBtn=a=>{ const k3=S3(a.st), l=S3L[k3][1]; return `<button class="appt ${k3==='absent'?'noshow':k3}${a.e-a.s<.4?' short':''}" data-ap="${a.id}" style="top:${slot(a.s)};height:calc(${((a.e-a.s)/(H1-H0)*100).toFixed(3)}% - 3px)" data-t="${attr(`<b>${esc(a.name)}</b><div class="tr"><span>${hm(a.s)} – ${hm(a.e)}</span></div><div class="tr"><span>${esc(a.reason)}</span></div><div class="tr"><span>${l}</span></div>`)}"><b>${esc(a.name)}</b><span>${hm(a.s).replace(' AM','').replace(' PM','')} · ${esc(a.reason)}</span></button>`; };
  const anyToday=cols.some(([w,i])=>isToday(w,i));
  const cal=`<div class="cal week${range==='day'?' one':''}" style="--cols:${cols.length}">
    <div class="cal-h"><span></span>${cols.map(([w,i])=>{ const [k,l]=shift(w,i), n=apOf(w,i).filter(a=>a.st!=='cancel').length; return `<span class="cal-doc day${isToday(w,i)?' today':''}"><span class="cell"><b>${D.dayLabel(w,i,false).replace('Today','Tue 29 Sep')}${isToday(w,i)?' · Today':''}</b>${k==='clinic'?`${l.split(' · ')[1]} · ${n} patients`:l}</span></span>`; }).join('')}</div>
    <div class="cal-b">
      <div class="cal-t">${Array.from({length:H1-H0},(_,i)=>`<span style="top:${slot(H0+i)}">${hm(H0+i).replace(':00','')}</span>`).join('')}${anyToday?`<span class="now-t" style="top:${slot(D.NOW)}">${hm(D.NOW)}</span>`:''}</div>
      ${cols.map(([w,i])=>{ const [k]=shift(w,i); return `<div class="cal-col${isToday(w,i)?' today':''}">${k==='home'?hvOf(w,i).filter(inTab).map(hvBtn).join(''):`<div class="lunch" style="top:${slot(12)};height:${(1/(H1-H0)*100).toFixed(3)}%">Lunch</div>`+apOf(w,i).filter(inTab).map(apBtn).join('')}${isToday(w,i)?`<div class="cal-now in" style="top:${slot(D.NOW)}"></div>`:''}</div>`; }).join('')}
    </div></div>
    <div class="legend"><span><i class="lg-ap sched"></i>Scheduled</span><span><i class="lg-ap done" style="opacity:.5"></i>Completed</span><span><i class="lg-ap noshow"></i>Absent</span><span><i class="lg-ap home"></i>Home visit</span></div>`;
  const itemsOf=(w,i)=>[...apOf(w,i).map(a=>({t:'c',w,day:i,s:a.s,e:a.e,id:a.id,name:a.name,pid:a.pid,reason:a.reason,st:a.st})),...hvOf(w,i).map(v=>({t:'h',w,day:i,s:v.s,e:v.e,id:v.id,name:D.pat(v.pid).name,pid:v.pid,reason:v.reason,st:v.st==='done'?'done':'sched',addr:D.pat(v.pid).addr}))].sort((a,b)=>a.s-b.s);
  const count=cols.reduce((t,[w,i])=>t+itemsOf(w,i).length,0);
  const nTab=k=>cols.reduce((t,[w,i])=>t+itemsOf(w,i).filter(x=>S3(x.st)===k).length,0);
  const more=x=>`<button class="icon-btn row-more" data-more="${x.t}:${x.id}" aria-label="More Actions"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg></button>`;
  const act0=x=>{ const k3=S3(x.st), now=!x.w&&x.day===1;
    if(x.t==='h') return '';
    if(k3==='sched'&&now) return `<button class="btn btn-secondary btn-sm" data-start="${x.id}">${D.NOTES&&D.NOTES[x.id]&&D.NOTES[x.id].saved?'Resume Visit':'Start Visit'}</button>`;
    return ''; };
  const rxBtn=x=>`<button class="icon-btn row-more" data-rxrow="${x.pid}" aria-label="Prescribe"><svg viewBox="0 0 24 24"><path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6M9 13h6M9 17h4"/></svg></button>`;
  const act=x=>rxBtn(x)+act0(x)+more(x);
  const list=`<div class="wl">${cols.map(([w,i])=>{ const L=itemsOf(w,i).filter(inTab); const [k]=shift(w,i); return `<div class="wl-day">${range==='day'?'':`<div class="wl-dh"><b>${D.dayLabel(w,i,true)}</b>${isToday(w,i)?'<span class="tag hot" style="background:var(--accent-soft);color:var(--accent)">Today</span>':''}<span class="muted">${k==='clinic'?'Clinic':'Home visits'} · ${L.length}</span></div>`}
      ${L.length?table('90px minmax(0,1.2fr) minmax(0,1.4fr) 110px 220px',['Time','Patient','Reason','Type',''],L.map(x=>{ const p=D.pat(x.pid)||{}; const why=x.st==='noshow'?'No-show':x.st==='cancel'?'Cancelled by the patient':''; return `<div class="t-row click${x.st==='done'?' done':''}" ${x.t==='h'?`data-hv="${x.id}"`:`data-ap="${x.id}"`}><span class="num">${hm(x.s)}</span><span class="pcell">${avatar(x.name)}<span class="cell"><b>${esc(x.name)}</b>${p.age?`${p.age} · ${p.sex}`:''}</span></span><span class="cell"><b>${esc(x.reason)}</b>${why?`<span style="color:var(--bad)">${why}</span>`:x.addr?esc(x.addr):''}</span><span class="cell">${x.t==='h'?`${ic('home')} Home`:'Clinic'}</span><span class="act">${act(x)}</span></div>`; })):`<div class="empty" style="padding:14px 0;text-align:left">${{sched:'Nothing scheduled.',done:'Nothing completed yet.',absent:'No absences.'}[tab]}</div>`}</div>`; }).join('')}</div>`;
  const tabs=`<div class="seg st-tabs" role="tablist" id="stTabs">${[['sched','Scheduled'],['done','Completed'],['absent','Absent']].map(([k,l])=>`<button role="tab" aria-selected="${tab===k}" data-st="${k}">${l} <span class="n">${nTab(k)}</span></button>`).join('')}</div>`;
  /* stepping: weeks limited to ±1, days to working days 21 Sep – 9 Oct */
  const stepDay=dir=>stepFrom(dAbs,dir);
  const prevOk=range==='day'?stepDay(-1)!=null:W>-1, nextOk=range==='day'?stepDay(1)!=null:W<1, atToday=range==='day'?dAbs===1:W===0;
  const label=range==='day'?D.dayLabel(dW,dD,true):D.weekRange(W);
  const title=range==='day'?(dAbs===1?'Today':D.dayLabel(dW,dD,true)):(W===0?'This Week':W===-1?'Last Week':W===1?'Next Week':'Week of '+D.weekRange(W).replace(' 2026',''));
  const fieldLabel=range==='day'?(dAbs===1?'Today · Tue 29 Sep':D.dayLabel(dW,dD)):(W===0?'This week · '+D.weekRange(W).replace(' 2026',''):D.weekRange(W).replace(' 2026',''));
  const field=`<div class="menu-wrap"><button class="head-sel" data-menu="#spPop" aria-expanded="false">${ic('cal')}${esc(fieldLabel)}${ic('chev')}</button><div class="pop right dp cal-pick" id="spPop">${pickerBody(root)}</div></div>`;
  const ctrls=`<div class="seg" role="tablist" id="vSeg"><button role="tab" aria-selected="${mode==='list'}" data-m="list"><svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>List</button><button role="tab" aria-selected="${mode==='cal'}" data-m="cal">${ic('cal')}Calendar</button></div>`;
  const next=T0.filter(a=>a.day===1&&['checkedin','waiting','sched'].includes(a.st)).sort((a,b)=>a.s-b.s)[0];
  return {
    title:'Appointments', meta:[],
    actions:field+`<button class="btn btn-primary" id="newAp">${ic('plus')}New Appointment</button>`,
    html:
      `<div class="toolbar">${tabs}<div class="tb-right">${ctrls}</div></div><section class="card nohead">${mode==='cal'?cal:list}</section>`,
    bind(root){ root.addEventListener('click',e=>{
      const repick=()=>{ const p=document.getElementById('spPop'); p.innerHTML=pickerBody(root); };
      const pmo=e.target.closest('#spPop [data-pmode]'); if(pmo){ e.stopPropagation(); root.pmode=pmo.dataset.pmode; repick(); return; }
      const pmn=e.target.closest('#spPop [data-pm]'); if(pmn){ e.stopPropagation(); root.pm=+pmn.dataset.pm; repick(); return; }
      const pd=e.target.closest('#spPop [data-day]'); if(pd){ root.range='day'; root.pmode='day'; root.dabs=+pd.dataset.day; root.pm=null; App.render(); return; }
      const pw=e.target.closest('#spPop [data-wk]'); if(pw){ root.range='week'; root.pmode='week'; root.wk=+pw.dataset.wk; root.pm=null; App.render(); return; }
      const rr=e.target.closest('[data-rxrow]'); if(rr){ e.stopPropagation(); App.prescribe(D.pat(rr.dataset.rxrow),{onDone:()=>App.render()}); return; }
      const mo=e.target.closest('[data-more]'); if(mo){ e.stopPropagation(); rowMenu(mo); return; }
      const tb=e.target.closest('#stTabs [data-st]'); if(tb){ root.tab=tb.dataset.st; App.render(); return; }
      const ab=e.target.closest('[data-absent]'); if(ab){ e.stopPropagation(); const ap=D.APPTS.find(x=>x.id===ab.dataset.absent); ap.st='noshow'; App.render(); UI.toast(`${ap.name} marked absent · a rebooking SMS was sent`); return; }
      const sv=e.target.closest('[data-start]'); if(sv){ e.stopPropagation(); App.visitBack=location.hash; location.hash='#/visit/'+sv.dataset.start; return; }
      const rb=e.target.closest('[data-rebook]'); if(rb){ e.stopPropagation(); UI.toast('Rebooking link sent to the patient by SMS'); return; }
      const ns=e.target.closest('[data-noshow]'); if(ns){ e.stopPropagation(); const ap=D.APPTS.find(x=>x.id===ns.dataset.noshow); ap.st='noshow'; App.render(); UI.toast(`${ap.name} marked as no-show · a rebooking SMS was sent`); return; }
      const fo=e.target.closest('[data-fold]'); if(fo){ root.exp=root.exp||{}; root.exp[fo.dataset.fold]=!root.exp[fo.dataset.fold]; App.render(); return; }
      const m=e.target.closest('#vSeg [data-m]'); if(m){ root.mode=m.dataset.m; App.render(); return; }
      const c=e.target.closest('[data-call]'); if(c){ e.stopPropagation(); callIn(c.dataset.call); return; }
      const hv=e.target.closest('[data-hv]'); if(hv){ App.hvDrawer(hv.dataset.hv); return; }
      const a=e.target.closest('[data-ap]'); if(a){ apptDrawer(a.dataset.ap); return; }
      if(e.target.closest('#newAp')) newAppt(); }); }
  };
}
App.apptDrawer=id=>apptDrawer(id); App.pickerBody=r=>pickerBody(r); App.rowMenu=b=>rowMenu(b); App.patientTabs=(p,pre)=>patientTabs(p,pre);
function callIn(id){ const a=D.APPTS.find(x=>x.id===id); D.APPTS.filter(x=>x.doc===a.doc&&x.day===a.day&&(x.w||0)===(a.w||0)&&x.st==='progress').forEach(x=>x.st='done'); a.st='progress'; App.closeDrawer(); App.render(); UI.toast(`${a.name} called in to ${D.doc(a.doc).name}`); }
function apptDrawer(id){
  const a=D.APPTS.find(x=>x.id===id), doc3=App.S.role==='physician', [k,l]=doc3?S3L[S3(a.st)]:APST[a.st], d=D.doc(a.doc);
  const acts=doc3?(S3(a.st)==='sched'&&!a.w&&a.day===1?`<span style="flex:1"></span><button class="btn btn-primary" data-go="#/visit/${a.id}">${D.NOTES&&D.NOTES[a.id]&&D.NOTES[a.id].saved?'Resume Visit':'Start Visit'}</button>`:a.st==='done'?`<span style="flex:1"></span><button class="btn btn-secondary" data-go="#/visit/${a.id}">${ic('doc')}Open Visit Note</button>`:''):{sched:App.S.role==='physician'?(!a.w&&a.day===1?`<span style="flex:1"></span><button class="btn btn-secondary btn-danger" data-x="noshow">Mark No-Show</button>`:''):`<button class="btn btn-secondary btn-danger" data-x="cancel">Cancel Appointment</button><span style="flex:1"></span><button class="btn btn-secondary" data-x="noshow">Mark No-Show</button><button class="btn btn-primary" data-x="checkedin">Check In</button>`,
    checkedin:`<span style="flex:1"></span><button class="btn btn-primary" data-x="call">Call In</button>`, waiting:`<span style="flex:1"></span><button class="btn btn-primary" data-x="call">Call In</button>`,
    progress:`<span style="flex:1"></span><button class="btn btn-primary" data-x="done">Complete Visit</button>`}[a.st]||'';
  const p=D.pat(a.pid), pt=patientTabs(p,'d-');
  App.drawer({eyebrow:`${p.mrn} · ${p.age} · ${p.sex} · born ${esc(p.dob)}`,title:a.name,wide:true,body:`
    <div class="pv-facts">${p.allergies.length?`<span class="st bad">${ic('alert')}Allergies: ${p.allergies.map(esc).join(', ')}</span>`:`<span class="st muted">No known allergies</span>`}</div>
    ${card('This Visit',`${D.dayLabel(a.w,a.day)} · ${hm(a.s)} – ${hm(a.e)} · Clinic ${3+COLS.indexOf(a.doc)}`,`<dl class="dl"><dt>Status</dt><dd>${st(k,l)}</dd><dt>Reason</dt><dd>${esc(a.reason)}</dd><dt>Clinician</dt><dd>${esc(d.name)} · ${esc(d.spec)}</dd>${a.arrived?`<dt>Arrived</dt><dd>${hm(a.arrived)}</dd>`:''}</dl>`)}
    ${pt.tabs}${pt.panels}
    <div class="demo-note">${ic('lock')}Opening this record was logged for audit · demo data, names are fictional.</div>`,
    foot:(App.S.role==='physician'?`<button class="btn btn-secondary" id="rxBtn">${ic('pill')}Prescribe</button><div class="menu-wrap"><button class="icon-btn bordered" data-menu="#ordPop" aria-label="More Orders" aria-expanded="false"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg></button><div class="pop up" id="ordPop" role="menu"><button class="it" data-stub>${ic('flask')}Order Lab Test</button><button class="it" data-stub>${ic('img')}Order Imaging</button><button class="it" data-stub>${ic('doc')}Refer to Specialist</button><button class="it" data-stub>${ic('edit')}Sick Note</button></div></div>`:'')+acts.replace('<span style="flex:1"></span>','').replace(/^/,'<span style="flex:1"></span>')});
  const rb=$('#rxBtn'); if(rb) rb.onclick=()=>App.prescribe(p,{onBack:()=>apptDrawer(id),onDone:()=>apptDrawer(id)});
  $('#dFoot').onclick=e=>{ const g=e.target.closest('[data-go]'); if(g){ App.closeDrawer(); App.visitBack=location.hash; location.hash=g.dataset.go; return; } const b=e.target.closest('[data-x]'); if(!b) return; const x=b.dataset.x;
    if(x==='call') return callIn(a.id);
    if(x==='done'&&!b.dataset.ok) return App.confirm({title:'Complete this visit?',text:`${esc(a.name)} · ${hm(a.s)} · ${esc(a.reason)}`,ok:'Complete Visit',onOk:()=>{ b.dataset.ok=1; b.click(); }});
    if(x==='checkedin'){ a.st='checkedin'; a.arrived=D.NOW; }
    else a.st=x;
    App.closeDrawer(); App.render(); UI.toast({checkedin:`${a.name} checked in`,cancel:'Appointment cancelled · slot is free again',noshow:'Marked as no-show · patient will get a rebooking SMS',done:'Visit completed'}[x]); };
}
function newAppt(){
  const doc=App.S.role==='physician', docs=doc?D.DOCTORS.filter(d=>d.spec==='Family Medicine'):COLS.map(c=>D.doc(c));
  const pats=(doc?D.PATIENTS.filter(p=>p.att==='marsh'):D.PATIENTS.filter(p=>p.today!==false)).filter(p=>p.status!=='Inpatient').sort((a,b)=>a.name.localeCompare(b.name));
  const days=[1,3,7,8,10].map(d=>[Math.floor(d/7),d%7]).filter(([w,d])=>d<5);
  let t=null;
  const free=(id,w,day)=>{ if(id==='marsh') D.ensureWeek(w); else D.ensureDay(w,day);
    const taken=D.APPTS.filter(a=>a.doc===id&&(a.w||0)===w&&a.day===day&&a.st!=='cancel'); const out=[]; const from=!w&&day===1?11:8;
    for(let x=from;x<16.5;x+=.5){ if(x>=12&&x<13) continue; if(!taken.some(a=>x<a.e&&x+.5>a.s)) out.push(x); } return out; };
  App.drawer({eyebrow:'Clinic appointment',title:'New Appointment',body:`<div class="form">
    <div class="field"><label>Patient</label><select class="input req" id="naP"><option value="" disabled selected>Select a patient</option>${pats.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.mrn}</option>`).join('')}</select></div>
    <div class="field"><label>Clinician</label><select class="input req" id="naD"><option value="" disabled selected>Select a clinician</option>${docs.map(d=>`<option value="${d.id}">${esc(d.name)} · ${esc(d.spec)}${d.id==='marsh'&&doc?' (you)':''}</option>`).join('')}</select></div>
    <div class="field"><label>Day</label><select class="input req" id="naDay"><option value="" disabled selected>Select a day</option>${days.map(([w,d])=>`<option value="${w}_${d}">${w||d!==1?D.dayLabel(w,d,true):'Today, Tuesday 29 September'}</option>`).join('')}</select></div>
    <div class="field"><label>Free Slots · 30 min</label><div class="slots" id="naS"><span class="help">Choose a clinician and a day to see free slots.</span></div></div>
    <div class="field"><label>Reason for Visit</label><input class="input" id="naR" placeholder="e.g. Follow-up"></div></div>`,
    foot:`<button class="btn btn-secondary" data-close>Cancel</button><span style="flex:1"></span><button class="btn btn-primary" id="naBook" disabled>Book Appointment</button>`});
  const b=$('#naBook');
  const sync=()=>{ const miss=[!$('#naP').value&&'patient',!$('#naD').value&&'clinician',!$('#naDay').value&&'day',t==null&&'time'].filter(Boolean); b.disabled=!!miss.length; miss.length?b.setAttribute('data-tip','Missing: '+miss.join(', ')):b.removeAttribute('data-tip'); };
  const slots=()=>{ t=null; const id=$('#naD').value, dv=$('#naDay').value; if(!id||!dv){ $('#naS').innerHTML='<span class="help">Choose a clinician and a day to see free slots.</span>'; sync(); return; }
    const [w,d]=dv.split('_').map(Number), F=free(id,w,d); $('#naS').innerHTML=F.length?F.map(x=>`<button class="chip slot" data-filter="${x}" aria-pressed="false">${hm(x)}</button>`).join(''):'<span class="help">No free slots this day.</span>'; sync(); };
  $('#naD').onchange=slots; $('#naDay').onchange=slots; $('#naP').onchange=sync;
  $('#naS').addEventListener('filter',e=>{ t=+e.detail; sync(); });
  sync();
  b.onclick=()=>{ const id=$('#naD').value, [w,d]=$('#naDay').value.split('_').map(Number), p=D.pat($('#naP').value);
    D.APPTS.push({id:'a'+D.APPTS.length,doc:id,w,day:d,s:t,e:t+.5,name:p.name,pid:p.id,reason:$('#naR').value.trim()||'Follow-up',st:'sched'});
    App.closeDrawer(); App.render(); UI.toast(`Booked ${D.dayLabel(w,d)} ${hm(t)} with ${D.doc(id).name} · confirmation SMS sent`); };
}
})();
