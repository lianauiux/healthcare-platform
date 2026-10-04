/* Visit workspace (physician): SOAP visit note with templates by reason, patient summary and medical history.
   Route #/visit/<appointment id>. Signing the note completes the visit. */
(function(){
const {views}=App, {$,esc,attr,ic,st,hm,card,avatar}=App.h;
const NOTES=D.NOTES=D.NOTES||{};
const ME='Dr. Elena Marsh';

/* ---------- reference lists ---------- */
const ONSET=['Today','1–3 days','4–7 days','1–4 weeks','Over a month'];
const LOC_BACK=['Lower back','Upper back','Neck','Buttock','Left leg','Right leg'], LOC_KNEE=['Right knee','Left knee','Both knees'];
const CHR=['Aching','Sharp','Dull','Burning','Stabbing'];
const RED=['Bladder or bowel changes','Saddle numbness','Fever','Unexplained weight loss','Recent trauma','Pain at night'];
const ADH=['Takes as prescribed','Misses doses','Stopped taking'];
const SE=['None','Muscle pain','Dizziness','Nausea','Fatigue'];
const ROS=['Constitutional','Cardiovascular','Respiratory','Gastrointestinal','Genitourinary','Musculoskeletal','Neurological','Psychiatric','Skin'];
const FU=['No follow-up','1 week','2 weeks','1 month','3 months','6 months','1 year'];
const SUGG=[
  [/back/i,[['M54.50','Low back pain, unspecified'],['M54.16','Radiculopathy, lumbar region'],['M62.830','Muscle spasm of back']]],
  [/knee/i,[['M25.561','Pain in right knee'],['M25.562','Pain in left knee'],['M17.11','Primary osteoarthritis, right knee']]],
  [/cholesterol/i,[['E78.5','Hyperlipidemia, unspecified']]],
  [/blood pressure/i,[['I10','Essential hypertension']]],
  [/anxiety/i,[['F41.1','Generalized anxiety disorder']]],
  [/vaccin/i,[['Z23','Encounter for immunization']]],
  [/well-woman/i,[['Z01.419','Encounter for gynecological exam']]],
  [/new patient/i,[['Z00.00','General adult medical exam']]],
  [/lab results/i,[['Z09','Follow-up exam after completed treatment']]]
];
const ORD={
  lab:['Complete blood count','Basic metabolic panel','Lipid panel','HbA1c','Urinalysis'],
  img:['X-Ray, Lumbar Spine','X-Ray, Knee','Chest X-Ray','Ultrasound, Abdomen'],
  ref:['Physical therapy','Orthopedics','Cardiology','Psychotherapy']
};
const ORDL={lab:'Lab test',img:'Imaging',ref:'Referral'};

const tplOf=r=>/pain/i.test(r)?'pain':/follow-up|review|results/i.test(r)?'followup':'general';
const TPLN={pain:'Pain',followup:'Chronic condition follow-up',general:'General visit'};
const suggOf=(p,r)=>{ const s=(SUGG.find(([re])=>re.test(r))||[0,[]])[1], all=[...p.dx,...s], seen={}; return all.filter(([c])=>!seen[c]&&(seen[c]=1)); };
const medsOf=p=>[...(p.newRx||[]),...(D.MAR[p.id]||(p.age<16?[{drug:'Salbutamol inhaler',dose:'100 mcg',freq:'As needed'}]:[{drug:'Amlodipine',dose:'5 mg',freq:'Daily'},{drug:'Atorvastatin',dose:'20 mg',freq:'Nightly'}]))];

/* ---------- life history (anamnesis vitae), kept on the patient ---------- */
function histOf(p){
  if(p.hist) return p.hist;
  const s=+p.mrn.slice(-3), pick=a=>a[s%a.length];
  p.hist={
    past:p.dx.slice(1).map(d=>d[1]).concat(pick([['Pneumonia · 2019'],['Kidney stones · 2017'],[],['Gastritis · 2015']])).join('\n')||'None reported',
    surg:pick(['Appendectomy · 1998','None','Knee arthroscopy · 2015','Cholecystectomy · 2011']),
    fam:pick(['Father: type 2 diabetes, heart attack at 62','Mother: hypertension, stroke at 70','Mother: breast cancer at 58','No significant family history']),
    life:pick(['Never smoked · alcohol occasionally · walks daily','Former smoker, quit 2012 · no alcohol · desk job','Smokes 5 a day · alcohol 2–3 drinks a week','Never smoked · no alcohol · gym twice a week']),
    vacc:'Influenza · Oct 2025\nCOVID-19 booster · Nov 2025\nTdap · 2019',
    rev:'18 Aug 2026'
  };
  return p.hist;
}
const HROWS=[['past','Past illnesses'],['surg','Surgeries'],['fam','Family history'],['life','Lifestyle'],['vacc','Vaccinations']];
function histCard(p,{edit=true}={}){
  const h=histOf(p);
  return card('Medical History','',`<dl class="dl hist">${HROWS.map(([k,l])=>`<dt>${l}</dt><dd>${esc(h[k]).replace(/\n/g,'<br>')}</dd>`).join('')}</dl>
    <div class="hist-f"><span class="muted">Reviewed ${esc(h.rev)}</span>${edit?`<span style="flex:1"></span><button class="btn btn-ghost btn-sm" data-hist-rev="${p.id}">Mark as Reviewed</button>`:''}</div>`,
    {right:edit?`<button class="icon-btn" data-hist-edit="${p.id}" aria-label="Edit Medical History">${ic('edit')}</button>`:''});
}
function histEdit(p,onSave){
  const h=histOf(p);
  App.drawer({eyebrow:`${esc(p.name)} · ${p.mrn}`,title:'Edit Medical History',body:`<div class="form">${HROWS.map(([k,l])=>`<div class="field"><label for="h-${k}">${l}</label><textarea class="textarea" id="h-${k}">${esc(h[k])}</textarea></div>`).join('')}</div>`,
    foot:`<button class="btn btn-secondary" id="hCancel">Cancel</button><span style="flex:1"></span><button class="btn btn-primary" id="hSave">Save</button>`});
  $('#hCancel').onclick=()=>App.closeDrawer();
  $('#hSave').onclick=()=>{ HROWS.forEach(([k])=>h[k]=$('#h-'+k).value.trim()||'None reported'); h.rev='today'; App.closeDrawer(); onSave&&onSave(); UI.toast('Medical history updated'); };
}
document.addEventListener('click',e=>{
  const ed=e.target.closest('[data-hist-edit]'); if(ed){ e.stopPropagation(); histEdit(D.pat(ed.dataset.histEdit),()=>App.render()); return; }
  const rv=e.target.closest('[data-hist-rev]'); if(rv){ e.stopPropagation(); histOf(D.pat(rv.dataset.histRev)).rev='today'; App.render(); UI.toast('Medical history marked as reviewed'); }
});
App.histCard=histCard;

/* ---------- note drafts ---------- */
function blank(a){ return {tpl:tplOf(a.reason),cc:'',hpi:'',onset:'',loc:[],sev:null,chr:[],aggr:'',red:[],adh:'',se:[],home:'',ros:[],bp:'',hr:'',temp:'',spo2:'',wt:'',exam:'',dx:[],prim:'',orders:[],fu:'',instr:'',saved:null,signed:null,ai:false}; }
function aiDraft(n,a,p){
  const knee=/knee/i.test(a.reason), sg=suggOf(p,a.reason);
  const common={bp:'128/82',hr:'74',temp:'36.7',spo2:'98',wt:'82',ai:true};
  if(n.tpl==='pain') Object.assign(n,common,{cc:knee?'Right knee pain for 5 days':'Lower back pain for 5 days',onset:'4–7 days',loc:knee?['Right knee']:['Lower back','Left leg'],sev:6,chr:['Aching','Sharp'],
    aggr:knee?'Stairs and squatting. Eases with rest.':'Bending forward and sitting longer than 30 minutes. Eases when lying down.',red:[],
    hpi:knee?'Twisted the knee while hiking on Saturday. Mild swelling the next day, no locking or giving way. Ibuprofen helps for a few hours.':'Started after lifting boxes at home on Thursday. Pain spreads to the left buttock, no numbness or weakness. Ibuprofen helps for a few hours.',
    ros:['Musculoskeletal'],exam:knee?'Mild effusion of the right knee. Tender along the medial joint line. Ligaments stable. Full extension, flexion limited to 110°.':'Tender over the left paraspinal muscles at L4–L5. Straight leg raise negative on both sides. Strength 5/5, reflexes symmetric. Normal gait.',
    dx:[sg.find(d=>/M54|M25/.test(d[0]))||sg[0]],fu:'2 weeks',instr:knee?'Rest, ice 15 minutes 3 times a day, elevate the leg. Come back sooner if the knee locks or swelling grows.':'Stay active and avoid heavy lifting for 2 weeks. Heat 15–20 minutes 3 times a day. Come back sooner if you notice numbness, weakness or bladder changes.'});
  else if(n.tpl==='followup') Object.assign(n,common,{cc:a.reason,adh:'Takes as prescribed',se:['None'],home:/blood/i.test(a.reason)?'Average 132/84 over the last 2 weeks':'',
    hpi:'Feels well. No chest pain or shortness of breath. Walks 30 minutes most days, cut down on fried food.',ros:[],exam:'Heart rhythm regular, no murmurs. Lungs clear. No ankle swelling.',
    dx:[sg.find(d=>SUGG.some(([re,l])=>re.test(a.reason)&&l.some(x=>x[0]===d[0])))||sg[0]],fu:'3 months',instr:'Keep taking your medication as prescribed. Repeat blood tests one week before the next visit.'});
  else Object.assign(n,common,{cc:a.reason,hpi:`No current complaints. Here for ${a.reason.toLowerCase()}.`,ros:[],exam:'Well appearing. Heart and lungs normal. No abnormal findings.',dx:[sg.find(d=>/^Z/.test(d[0]))||sg[0]],fu:'1 year',instr:'No restrictions. Next routine check in one year.'});
  n.prim=n.dx[0][0]; n.saved=hm(D.NOW); return n;
}
function noteOf(a){
  const p=D.pat(a.pid);
  if(!NOTES[a.id]){ NOTES[a.id]=blank(a); if(a.st==='done'){ aiDraft(NOTES[a.id],a,p); NOTES[a.id].ai=false; NOTES[a.id].signed=hm(a.e); } }
  return NOTES[a.id];
}
const missing=n=>[!n.cc.trim()&&'chief complaint',!n.dx.length&&'diagnosis'].filter(Boolean);

/* ---------- small controls ---------- */
const opts=(k,list,sel,{multi=true,flag=false}={})=>`<div class="opts" role="group">${list.map(v=>`<button type="button" class="opt${flag?' flag':''}" data-${multi?'tg':'one'}="${k}" data-v="${attr(v)}" aria-pressed="${multi?sel.includes(v):sel===v}">${esc(v)}</button>`).join('')}</div>`;
const fld=(label,inner,o={})=>`<div class="field${o.cls?' '+o.cls:''}"><label${o.for?` for="${o.for}"`:''}>${label}</label>${inner}${o.help?`<span class="help">${o.help}</span>`:''}</div>`;
const inp=(k,n,ph,o={})=>`<input class="input" id="vn-${k}" data-k="${k}" value="${attr(n[k])}" placeholder="${attr(ph)}"${o.mode?` inputmode="${o.mode}"`:''}>`;
const ta=(k,n,ph)=>`<textarea class="textarea" id="vn-${k}" data-k="${k}" placeholder="${attr(ph)}">${esc(n[k])}</textarea>`;
const ro=(l,v)=>v&&String(v).trim()?`<dt>${l}</dt><dd>${esc(v).replace(/\n/g,'<br>')}</dd>`:'';

/* everything ordered for the patient today: prescriptions, existing orders, orders added in this note */
function orderItems(n,p){
  const rx=D.ORX.filter(r=>r.pid===p.id&&r.fresh), today=D.ORDERS.filter(o=>o.p===p.id);
  return [...rx.map(r=>[ic('doc'),`${r.f.drug} ${r.f.dose}`,`${r.f.freq} · sent to pharmacy`]),...today.map(o=>[ic(/X-Ray|CT|MRI|Ultra/.test(o.test)?'img':'flask'),o.test,'Ordered '+hm(o.ordered)]),...n.orders.map(([k,v])=>[ic(k==='ref'?'doc':k==='img'?'img':'flask'),v,ORDL[k]+' · ordered'])];
}
/* "•••" next to Sign & Complete: lab tests, imaging and referrals in one menu */
const moreOrders=()=>`<div class="menu-wrap"><button class="icon-btn bordered" data-menu="#vnMore" aria-label="More Orders" aria-expanded="false"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg></button><div class="pop right ord-pop" id="vnMore" role="menu">${[['lab','Lab Test','flask'],['img','Imaging','img'],['ref','Referral','doc']].map(([k,l,i])=>`<div class="grp" role="presentation">${ic(i)}${l}</div>${ORD[k].map(v=>`<button class="it" role="menuitem" data-ord="${k}" data-v="${attr(v)}">${esc(v)}</button>`).join('')}`).join('')}</div></div>`;
/* ---------- editable note ---------- */
function noteForm(n,a,p){
  const knee=/knee/i.test(a.reason), sg=suggOf(p,a.reason), avail=sg.filter(d=>!n.dx.some(x=>x[0]===d[0]));
  const tplFields={
    pain:`<div class="f2 even">${fld('Onset',opts('onset',ONSET,n.onset,{multi:false}))}${fld('Character',opts('chr',CHR,n.chr))}</div>
      ${fld('Location',opts('loc',knee?LOC_KNEE:LOC_BACK,n.loc))}
      ${fld(`Severity <span class="muted">${n.sev!=null?n.sev+' / 10':'0–10'}</span>`,`<div class="sev" role="group">${Array.from({length:11},(_,i)=>`<button type="button" data-sev="${i}" aria-pressed="${n.sev===i}" aria-label="Severity ${i}">${i}</button>`).join('')}</div>`)}
      ${fld('Worse with',inp('aggr',n,'e.g. bending, sitting, stairs'),{for:'vn-aggr'})}
      ${fld('Red flags',opts('red',RED,n.red,{flag:true}),{help:n.red.length?'':'Mark any that apply. If none are marked, the note records none.'})}
      ${n.red.length?`<div class="vn-alert">${ic('alert')}<span><b>Red flag noted: ${esc(n.red.join(', ').toLowerCase())}.</b> Consider urgent imaging or a same-day referral.</span></div>`:''}`,
    followup:`<div class="f2 even">${fld('Medication adherence',opts('adh',ADH,n.adh,{multi:false}))}${fld('Side effects',opts('se',SE,n.se))}</div>
      ${fld('Home readings',inp('home',n,'e.g. blood pressure average 132/84'),{for:'vn-home'})}`,
    general:''
  }[n.tpl];
  const S=card('Subjective','',`<div class="form">
      ${fld('Chief complaint',inp('cc',n,`e.g. ${a.reason}`),{for:'vn-cc'})}
      ${tplFields}
      ${fld('History of present illness',ta('hpi',n,'When it started, how it developed, what helps, what was tried'),{for:'vn-hpi'})}
      ${fld('Review of systems',opts('ros',ROS,n.ros,{flag:true}),{help:'Mark systems with complaints. The rest are recorded as negative.'})}
    </div>`,{right:`<span class="vn-tpl">${ic('doc')}Template: ${TPLN[n.tpl]}</span>`});
  const O=card('Objective','',`<div class="form">
      <div class="f5">${[['bp','Blood pressure','120/80','text'],['hr','Pulse, bpm','72','numeric'],['temp','Temp, °C','36.6','decimal'],['spo2','SpO₂, %','98','numeric'],['wt','Weight, kg','70','decimal']].map(([k,l,ph,m])=>fld(l,inp(k,n,ph,{mode:m}),{for:'vn-'+k})).join('')}</div>
      ${fld('Physical examination',ta('exam',n,'Findings by system'),{for:'vn-exam'})}
    </div>`);
  const A=card('Assessment','',`<div class="form">
      ${n.dx.length?`<div class="dx-list">${n.dx.map(([c,l])=>`<div class="dx-r"><span class="mono">${c}</span><span class="t">${esc(l)}</span>${n.prim===c?st('confirm','Primary'):`<button class="btn btn-ghost btn-sm" data-prim="${c}">Make Primary</button>`}<button class="icon-btn" data-dxrm="${c}" aria-label="Remove ${attr(l)}">${ic('x')}</button></div>`).join('')}</div>`:''}
      ${fld(n.dx.length?'Add another diagnosis':'Diagnosis',`<select class="input" id="vn-dx"><option value="" selected disabled>Select a diagnosis · ICD-10</option>${avail.filter(d=>p.dx.some(x=>x[0]===d[0])).length?`<optgroup label="Problem list">${avail.filter(d=>p.dx.some(x=>x[0]===d[0])).map(([c,l])=>`<option value="${c}">${c} · ${esc(l)}</option>`).join('')}</optgroup>`:''}${avail.filter(d=>!p.dx.some(x=>x[0]===d[0])).length?`<optgroup label="Suggested for ${attr(a.reason.toLowerCase())}">${avail.filter(d=>!p.dx.some(x=>x[0]===d[0])).map(([c,l])=>`<option value="${c}">${c} · ${esc(l)}</option>`).join('')}</optgroup>`:''}</select>`,{for:'vn-dx'})}
    </div>`);
  const items=orderItems(n,p);
  const P=card('Plan','',`<div class="form">
      ${fld('Orders this visit',items.length?`<div class="ord-list">${items.map(([i,t,s])=>`<div class="ord-r">${i}<span class="cell"><b>${esc(t)}</b>${esc(s)}</span></div>`).join('')}</div>`:'<span class="muted ord-none">No orders yet.</span>')}
      <div class="f2 even">${fld('Follow-up',`<select class="input" id="vn-fu" data-k="fu"><option value="" ${n.fu?'':'selected'} disabled>Select</option>${FU.map(f=>`<option ${n.fu===f?'selected':''}>${f}</option>`).join('')}</select>`,{for:'vn-fu'})}<span></span></div>
      ${fld('Instructions for the patient',ta('instr',n,'Shown in the visit summary the patient receives'),{for:'vn-instr'})}
    </div>`);
  return S+O+A+P;
}

/* ---------- signed note, read-only ---------- */
function noteView(n,a,p){
  const tf={pain:ro('Onset',n.onset)+ro('Location',n.loc.join(', '))+ro('Character',n.chr.join(', '))+ro('Severity',n.sev!=null?n.sev+' / 10':'')+ro('Worse with',n.aggr)+`<dt>Red flags</dt><dd>${n.red.length?esc(n.red.join(', ')):'None'}</dd>`,
    followup:ro('Adherence',n.adh)+ro('Side effects',n.se.join(', '))+ro('Home readings',n.home),general:''}[n.tpl];
  return card('Subjective','',`<dl class="dl vn-ro">${ro('Chief complaint',n.cc)}${tf}${ro('History',n.hpi)}<dt>Review of systems</dt><dd>${n.ros.length?'Complaints: '+esc(n.ros.join(', '))+'. Other systems negative.':'All systems negative.'}</dd></dl>`)+
    card('Objective','',`<dl class="dl vn-ro">${ro('Vitals',[n.bp&&'BP '+n.bp,n.hr&&'pulse '+n.hr,n.temp&&n.temp+' °C',n.spo2&&'SpO₂ '+n.spo2+'%',n.wt&&n.wt+' kg'].filter(Boolean).join(' · '))}${ro('Examination',n.exam)}</dl>`)+
    card('Assessment','',`<div class="dx-list">${n.dx.map(([c,l])=>`<div class="dx-r"><span class="mono">${c}</span><span class="t">${esc(l)}</span>${n.prim===c?st('confirm','Primary'):''}</div>`).join('')}</div>`)+
    card('Plan','',`<dl class="dl vn-ro">${ro('Orders',orderItems(n,p).map(o=>o[1]).join('\n'))}${ro('Follow-up',n.fu)}${ro('Instructions',n.instr)}</dl>`);
}

/* ---------- page ---------- */
views.visit=(id,root)=>{
  const a=D.APPTS.find(x=>x.id===id); if(!a){ location.hash='#/appointments'; return {title:'Appointments',html:''}; }
  const p=D.pat(a.pid), n=noteOf(a), signed=!!n.signed, miss=missing(n), h=histOf(p);
  const side=`<aside class="rec-side">
      ${card('','',`<div class="vn-pt">${avatar(p.name,'lg')}<span class="cell"><b>${esc(p.name)}</b>${p.age} · ${p.sex} · born ${esc(p.dob)}</span></div>
        <dl class="dl"><dt>Record</dt><dd class="mono">${p.mrn}</dd><dt>Visit</dt><dd>${D.dayLabel(a.w,a.day)} · ${hm(a.s)}</dd><dt>Reason</dt><dd>${esc(a.reason)}</dd><dt>Coverage</dt><dd>${esc(D.planOf(p).name)}</dd></dl>
        <div class="vn-facts">${p.allergies.length?`<span class="st bad">${ic('alert')}Allergies: ${p.allergies.map(esc).join(', ')}</span>`:`<span class="st muted">No known allergies</span>`}</div>
        <a class="btn btn-secondary btn-sm vn-prof" href="#/patient/${p.id}" data-patback>${ic('user')}Open Patient Profile</a>`)}
      ${card('Problem List','',`<div class="dx-list sm">${p.dx.map(([c,l])=>`<div class="dx-r"><span class="mono">${c}</span><span class="t">${esc(l)}</span></div>`).join('')}</div>`)}
      ${card('Current Medications','',`<div class="dx-list sm">${medsOf(p).map(m=>`<div class="dx-r"><span class="t">${esc(m.drug)}</span><span class="muted">${esc(m.dose)} · ${esc(m.freq)}</span></div>`).join('')}</div>`)}
      ${histCard(p,{edit:!signed})}
      ${card('Last Visit','18 Aug 2026',`<div class="lv"><b>18 Aug 2026 · Follow-up</b><p>${esc(p.dx[0][1])} stable. BP 134/86. Continued current medication. Repeat blood tests in 3 months.</p>${signed?'':`<button class="btn btn-ghost btn-sm" id="vnCopy">Copy to This Note</button>`}</div>`)}
    </aside>`;
  const head=signed?`<div class="vn-signed">${ic('lock')}<span>Signed by ${ME} · ${D.dayLabel(a.w,a.day)} ${n.signed}. The note is locked; changes are added as dated addenda.</span></div>`
    :`<div class="vn-bar"><button class="btn btn-secondary btn-sm" id="vnAi"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>Draft from Dictation</button>${n.ai?`<div class="vn-ai">${ic('info')}<span>Drafted from a 2-minute dictation. Review every field before signing.</span><button class="btn btn-ghost btn-sm" id="vnClear">Clear Draft</button></div>`:''}</div>`;
  return {
    back:App.visitBack||'#/appointments', title:p.name, meta:[],
    actions:signed?`<button class="btn btn-secondary" data-stub>Print</button><button class="btn btn-secondary" data-stub>${ic('edit')}Add Addendum</button>`
      :`<span class="vn-saved" id="vnSaved">${n.saved?`${ic('ok')}Draft saved · ${n.saved}`:''}</span><button class="btn btn-secondary" id="vnRx">${ic('doc')}Prescribe</button>${moreOrders()}<button class="btn btn-primary" id="vnSign" ${miss.length?`disabled data-tip="Missing: ${miss.join(', ')}"`:''}>Sign &amp; Complete Visit</button>`,
    bodyCls:'split-body',
    html:`<div class="rec vn"><div class="rec-main">${head}${signed?noteView(n,a,p):noteForm(n,a,p)}</div>${side}</div>`,
    bind(root){
      const cur=()=>{ const a2=D.APPTS.find(x=>x.id===location.hash.split('/')[2]); return a2&&[a2,NOTES[a2.id],D.pat(a2.pid)]; };
      const touch=n=>{ n.saved=hm(D.NOW); const s=$('#vnSaved',root); if(s) s.innerHTML=`${ic('ok')}Draft saved · ${n.saved}`;
        const b=$('#vnSign',root); if(b){ const m=missing(n); b.disabled=!!m.length; m.length?b.setAttribute('data-tip','Missing: '+m.join(', ')):b.removeAttribute('data-tip'); } };
      root.addEventListener('input',e=>{ const k=e.target.dataset.k, c=cur(); if(!k||!c) return; c[1][k]=e.target.value; touch(c[1]); });
      root.addEventListener('change',e=>{ const c=cur(); if(!c) return; const [a,n,p]=c;
        if(e.target.id==='vn-dx'){ const d=suggOf(p,a.reason).find(x=>x[0]===e.target.value); if(d){ n.dx.push(d); if(!n.prim) n.prim=d[0]; touch(n); App.render(); } }
        else if(e.target.dataset.k){ n[e.target.dataset.k]=e.target.value; touch(n); } });
      root.addEventListener('click',e=>{ const c=cur(); if(!c) return; const [a,n,p]=c; let b;
        if(b=e.target.closest('[data-tg]')){ const k=b.dataset.tg, v=b.dataset.v; n[k]=n[k].includes(v)?n[k].filter(x=>x!==v):[...n[k],v];
          if(k==='se'&&v==='None'&&n.se.includes('None')) n.se=['None']; else if(k==='se') n.se=n.se.filter(x=>x!=='None'||v==='None');
          touch(n); App.render(); return; }
        if(b=e.target.closest('[data-one]')){ const k=b.dataset.one; n[k]=n[k]===b.dataset.v?'':b.dataset.v; touch(n); App.render(); return; }
        if(b=e.target.closest('[data-sev]')){ n.sev=+b.dataset.sev; touch(n); App.render(); return; }
        if(b=e.target.closest('[data-prim]')){ n.prim=b.dataset.prim; touch(n); App.render(); return; }
        if(b=e.target.closest('[data-dxrm]')){ n.dx=n.dx.filter(d=>d[0]!==b.dataset.dxrm); if(n.prim===b.dataset.dxrm) n.prim=n.dx[0]?n.dx[0][0]:''; touch(n); App.render(); return; }
        if(b=e.target.closest('[data-ord]')){ b.closest('.pop').classList.remove('on'); n.orders.push([b.dataset.ord,b.dataset.v]); touch(n); App.render(); UI.toast(`${ORDL[b.dataset.ord]} ordered · ${b.dataset.v}`); return; }
        if(e.target.closest('#vnRx')){ App.prescribe(p,{onDone:()=>App.render()}); return; }
        if(e.target.closest('#vnAi')){ const empty=!n.cc&&!n.hpi&&!n.exam&&!n.dx.length;
          const go=()=>{ const keep=n.orders; Object.assign(n,blank(a)); aiDraft(n,a,p); n.orders=keep; App.render(); UI.toast('Draft ready · review before signing'); };
          return empty?go():App.confirm({title:'Replace the current note?',text:'The dictation draft overwrites what you have typed so far.',ok:'Replace',onOk:go}); }
        if(e.target.closest('#vnClear')){ const keep=n.orders; Object.assign(n,blank(a)); n.orders=keep; touch(n); App.render(); return; }
        if(e.target.closest('#vnCopy')){ n.exam=n.exam||'Heart rhythm regular, no murmurs. Lungs clear. No ankle swelling.'; p.dx.forEach(d=>{ if(!n.dx.some(x=>x[0]===d[0])) n.dx.push(d); }); n.prim=n.prim||(n.dx[0]||[])[0]||''; n.fu=n.fu||'3 months'; n.instr=n.instr||'Continue current medication. Repeat blood tests in 3 months.'; touch(n); App.render(); UI.toast('Copied from the 18 Aug visit · examination, diagnoses and plan'); return; }
        if(e.target.closest('#vnSign')){ App.confirm({title:'Sign and complete this visit?',text:`${esc(p.name)} · ${esc(a.reason)}. The note will be locked; later changes are added as dated addenda.`,ok:'Sign &amp; Complete',onOk:()=>{
            n.signed=hm(D.NOW); n.ai=false; a.st='done'; location.hash=App.visitBack||'#/appointments'; UI.toast(`Visit with ${p.name} completed · note signed`); }}); return; }
      });
    }
  };
};
/* ---------- all visits of a patient (patient record → Visits tab) ---------- */
const LEGACY=[['18 Aug 2026','Follow-up','Routine follow-up. Feels well, no new complaints.','BP 134/86. Heart and lungs normal.','Continued current medication. Repeat blood tests in 3 months.'],
  ['04 Nov 2025','Annual physical','Annual check. No complaints.','Normal examination. BMI 26.','Influenza vaccine given. Next annual check in one year.']];
function visitsOf(p){
  for(let w=-8;w<=1;w++) D.ensureWeek(w);
  const rows=[];
  D.APPTS.filter(a=>a.pid===p.id).forEach(a=>{ const n=a.st==='done'||NOTES[a.id]?noteOf(a):null;
    rows.push({k:'a:'+a.id,abs:(a.w||0)*7+a.day+a.s/24,date:D.dayKey(a.w,a.day)+' 2026',time:hm(a.s),type:'Clinic',reason:a.reason,doc:D.doc(a.doc).name,
      dx:n&&n.dx.length?(n.dx.find(d=>d[0]===n.prim)||n.dx[0]):null,
      st:a.st==='done'?['ok','Signed']:a.st==='noshow'?['bad','Absent']:a.st==='cancel'?['muted','Cancelled']:n&&n.saved?['warn','Draft']:['muted','Scheduled']}); });
  D.HOMEVISITS.filter(h=>h.pid===p.id).forEach(h=>rows.push({k:'h:'+h.id,abs:(h.w||0)*7+h.day+h.s/24,date:D.dayKey(h.w,h.day)+' 2026',time:hm(h.s),type:'Home',reason:h.reason,doc:D.doc(h.doc).name,
    dx:h.st==='done'?p.dx[0]:null,st:h.st==='done'?['ok','Signed']:['muted','Scheduled']}));
  LEGACY.forEach((l,i)=>{ if(!rows.some(r=>r.date===l[0])) rows.push({k:'l:'+i+':'+p.id,abs:Math.round((new Date(l[0])-new Date(2026,8,28))/864e5),date:l[0],time:'',type:'Clinic',reason:l[1],doc:ME,dx:p.dx[0],st:['ok','Signed']}); });
  return rows.sort((a,b)=>b.abs-a.abs);
}
function visitsPanel(p){
  const R=visitsOf(p);
  return card('','',App.h.table('110px 80px minmax(0,1.3fr) minmax(0,1.3fr) 130px 100px',['Date','Type','Reason','Diagnosis','Clinician','Note'],
    R.map(r=>`<div class="t-row click" data-vrow="${r.k}"><span class="cell"><b>${r.date}</b>${r.time}</span><span class="cell">${r.type==='Home'?`${ic('home')} Home`:'Clinic'}</span><span class="t">${esc(r.reason)}</span><span class="cell">${r.dx?`<b>${esc(r.dx[1])}</b><span class="mono">${r.dx[0]}</span>`:'<span class="muted">—</span>'}</span><span class="cell">${esc(r.doc)}</span>${st(r.st[0],r.st[1])}</div>`),{empty:'No visits yet.'}),{cls:'flush'});
}
function legacyNote(i,p){
  const [date,reason,s,o,pl]=LEGACY[i];
  App.drawer({eyebrow:`${esc(p.name)} · ${p.mrn}`,title:`${reason} · ${date}`,wide:true,body:`<div class="vn-signed">${ic('lock')}<span>Signed by ${ME} · ${date}</span></div>`+
    card('Subjective','',`<p class="vn-p">${esc(s)}</p>`)+card('Objective','',`<p class="vn-p">${esc(o)}</p>`)+
    card('Assessment','',`<div class="dx-list">${p.dx.map(([c,l],k)=>`<div class="dx-r"><span class="mono">${c}</span><span class="t">${esc(l)}</span>${k?'':st('confirm','Primary')}</div>`).join('')}</div>`)+
    card('Plan','',`<p class="vn-p">${esc(pl)}</p>`)});
}
document.addEventListener('click',e=>{
  const r=e.target.closest('[data-vrow]'); if(!r) return;
  const [k,id]=r.dataset.vrow.split(':');
  if(k==='h') return App.hvDrawer(id);
  if(k==='l') return legacyNote(+id,D.pat(r.dataset.vrow.split(':')[2]));
  const a=D.APPTS.find(x=>x.id===id), today=!a.w&&a.day===1;
  if(App.S.role==='physician'&&(a.st==='done'||(today&&a.st!=='noshow'&&a.st!=='cancel'))){ App.closeDrawer(); App.visitBack=location.hash; location.hash='#/visit/'+id; }
  else App.apptDrawer(id);
});
/* the patient profile's back arrow returns to the visit it was opened from */
document.addEventListener('click',e=>{ if(e.target.closest('[data-patback]')) App.patBack=location.hash; },true);
window.addEventListener('hashchange',()=>{ if(!location.hash.startsWith('#/patient/')) App.patBack=null; });
App.visitsOf=visitsOf; App.visitsPanel=visitsPanel;
})();
