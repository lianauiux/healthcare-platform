/* Facilities & Departments · Staff · Analytics & Reports · Administration */
(function(){
const {views}=App, {$,$$,esc,attr,ic,st,sicon,N,walk,hm,mins,tiles,card,box,hbars,mini,table,avatar,legend}=App.h;

/* =================== FACILITIES & DEPARTMENTS =================== */
views.facilities=()=>{
  const DP=D.DEPTS, beds=DP.reduce((a,d)=>a+d.beds,0), occ=DP.reduce((a,d)=>a+d.occ,0);
  const named={}; D.PATIENTS.filter(p=>p.loc.startsWith('4 West')).forEach(p=>named[p.loc.split(' · ')[1]]=p);
  const free=D.FREE_BEDS['4 West'], special={'403A':['cleaning','Being cleaned · ready ~11:15 AM'],'417B':['blocked','Blocked · isolation room']};
  const rooms=Array.from({length:18},(_,i)=>401+i).map(n=>`<div class="room"><span class="rn">${n}</span><div class="rb">${['A','B'].map(s=>{ const id=n+s, p=named[id], sp=special[id]; const k=p?'occ named':free.includes(id)?'free':sp?sp[0]:'occ';
    const tip=p?`<b>${esc(p.name)}</b><div class="tr"><span>${esc(p.dx[0][1])}</span></div><div class="tr"><span>Day ${p.los+1}</span></div>`:free.includes(id)?`<b>Bed ${id}</b><div class="tr"><span>Available · clean</span></div>`:sp?`<b>Bed ${id}</b><div class="tr"><span>${sp[1]}</span></div>`:`<b>Bed ${id}</b><div class="tr"><span>Occupied</span></div>`;
    return p?`<a class="bd ${k}" href="#/patient/${p.id}" data-t="${attr(tip)}">${s}</a>`:`<span class="bd ${k}" data-t="${attr(tip)}">${s}</span>`; }).join('')}</div></div>`).join('');
  return {
    title:'Facilities & Departments', meta:[['bld',App.fac().name],['bed',`${beds} staffed beds · ${DP.length} departments`],['clock','Bed status live']],
    actions:`<button class="btn btn-secondary" data-stub>${ic('edit')}Edit Departments</button><button class="btn btn-primary" data-stub>${ic('plus')}Add Department</button>`,
    html: tiles([
      {l:'Staffed Beds',v:String(beds),s:'licensed 420'},
      {l:'Occupied',v:String(occ),s:`${Math.round(occ/beds*100)}% occupancy · target 85%`,cls:occ/beds>.85?'warn':''},
      {l:'Available Now',v:String(beds-occ),s:'clean and ready'},
      {l:'Out of Service',v:'4',s:'2 cleaning · 2 isolation'}
    ])+
    card('Departments','Capacity by department',table('minmax(0,1.3fr) 100px 70px minmax(0,1.2fr) 80px minmax(0,1fr) 120px',['Department','Floor','Beds','Occupancy','Free','Nurse Lead','Status'],DP.map(d=>{ const o=d.occ/d.beds; return `<div class="t-row"><span class="t">${esc(d.name)}</span><span class="cell">${d.floor}</span><span class="num">${d.beds}</span>${mini(o*100,100,{t:85,c:o>=.95?'var(--s2)':'var(--s1)',label:Math.round(o*100)+'%'})}<span class="num">${d.beds-d.occ}</span><span class="cell"><b>${esc(d.lead)}</b></span>${o>=.95?st('bad','Full'):o>=.85?st('warn','Busy'):st('ok','Available')}</div>`; })),{cls:'flush'})+
    card('Floor Plan · 4th Floor, 4 West','18 rooms, 36 beds · select a named bed to open the patient',`<div class="floor">${rooms}</div><div class="legend"><span><i class="lg-bd occ"></i>Occupied</span><span><i class="lg-bd free"></i>Available</span><span><i class="lg-bd cleaning"></i>Cleaning</span><span><i class="lg-bd blocked"></i>Blocked</span></div>`)+
    (App.can('analytics')?card('Facilities in the Network','Corvina Health · 5 hospitals',table('minmax(0,1.6fr) 90px minmax(0,1fr) 120px',['Facility','Beds','Occupancy',''],D.FACILITIES.map((f,i)=>{ const o=[.89,.96,.82,.78,.84][i]; return `<div class="t-row"><span class="pcell"><span class="mk-s">${f.mk}</span><span class="t">${esc(f.name)}</span></span><span class="num">${f.beds}</span>${mini(o*100,100,{t:85,c:o>=.95?'var(--s2)':'var(--s1)',label:Math.round(o*100)+'%'})}<span class="act">${f.id===App.fac().id?st('ok','Current'):`<button class="btn btn-ghost btn-sm" data-fac="${f.id}">Switch</button>`}</span></div>`; })),{cls:'flush'}):'')
  };
};

/* =================== STAFF =================== */
const ROSTER=[['Jordan Okafor, RN',['D','D','D','Off','Off','D','D']],['Mia Alvarez, RN',['D','D','Off','D','D','Off','Off']],['Owen Fitzgerald, RN',['N','N','N','Off','Off','N','N']],['Ruth Kim, RN',['Off','N','N','N','Off','Off','D']],['Aaron Diaz, RN',['D','Off','D','D','N','N','Off']],['Open shift',['','','','N','D','D','N']]];
views.staff=(arg,root)=>{
  const f=root.f||'all', S=D.STAFF.filter(s=>f==='all'||s.role===f);
  const onN=D.STAFF.filter(s=>s.st==='on').length, nurses=D.STAFF.filter(s=>s.role==='Nurse'&&s.st==='on');
  const avg=(nurses.reduce((a,s)=>a+s.load,0)/nurses.length).toFixed(1);
  const days=['Mon 28','Tue 29','Wed 30','Thu 1','Fri 2','Sat 3','Sun 4'];
  root.filled=root.filled||{};
  return {
    title:'Staff', meta:[['bld',App.fac().name],['user',`${D.STAFF.length} people shown`],['clock','Day shift 7 AM – 7 PM']],
    actions:`<button class="btn btn-secondary" data-stub>${ic('cal')}Full Schedule</button><button class="btn btn-primary" data-stub>${ic('plus')}Add Staff Member</button>`,
    html: tiles([
      {l:'On Duty Now',v:String(onN),s:`of ${D.STAFF.length} · day shift`},
      {l:'On Leave',v:String(D.STAFF.filter(s=>s.st==='leave').length),s:'1 unplanned today',cls:'warn'},
      {l:'Patients per Nurse',v:avg,s:'unit limits 2–5'},
      {l:'Open Shifts This Week',v:String(ROSTER[5][1].filter(Boolean).length-Object.keys(root.filled).length),s:'4 West · select one to post'}
    ])+
    `<div class="toolbar"><div class="chips">${['all','Physician','Nurse','Allied Health','Admin'].map(r=>`<button class="chip" data-filter="${r}" aria-pressed="${r===f}"><span class="n">${D.STAFF.filter(s=>r==='all'||s.role===r).length}</span> ${r==='all'?'Everyone':r==='Allied Health'?r:r+'s'}</button>`).join('')}</div></div>`+
    card('','',table('minmax(0,1.4fr) 110px minmax(0,1fr) 110px 110px minmax(0,1fr) 50px',['Name','Role','Department','Shift Today','Status','Workload',''],S.map(s=>`<div class="t-row"><span class="pcell">${avatar(s.name)}<span class="t">${esc(s.name)}</span></span><span class="cell">${s.role}</span><span class="cell"><b>${esc(s.dept)}</b></span><span class="cell">${s.st==='on'?(s.shift==='Day'?'7 AM – 7 PM':'7 PM – 7 AM'):s.shift==='Night'?'Tonight 7 PM':'—'}</span>${s.st==='on'?st('ok','On Duty'):s.st==='leave'?st('warn','On Leave'):st('muted','Off Duty')}${s.cap&&s.st==='on'?mini(s.load,Math.max(s.cap,s.load)*1.15,{t:s.cap,c:s.load>s.cap?'var(--s2)':'var(--s1)',label:`${s.load} pts`}):'<span class="muted" style="font-size:12.5px">—</span>'}<span class="act"><button class="icon-btn" aria-label="Message ${attr(s.name)}" data-stub>${ic('phone')}</button></span></div>`)),{cls:'flush'})+
    card('Weekly Roster · 4 West Nursing','D = day 7 AM – 7 PM · N = night 7 PM – 7 AM · select an open shift to post it to the float pool',`<div class="roster" style="--n:7"><span></span>${days.map((d,i)=>`<span class="rh${i===1?' today':''}">${d}</span>`).join('')}${ROSTER.map(([n,r],ri)=>`<span class="rn">${ri===5?'<span class="muted">Open shifts</span>':esc(n)}</span>`+r.map((c,i)=>ri===5?(c?(root.filled[i]?`<span class="rc posted" data-t="${attr('<b>Posted to float pool</b>')}">${c} · Posted</span>`:`<button class="rc open" data-open="${i}">${c} · Open</button>`):'<span class="rc"></span>'):`<span class="rc ${c==='Off'?'off':c==='N'?'night':'day'}${i===1?' today':''}">${c}</span>`).join('')).join('')}</div>`),
    bind(root){ root.addEventListener('filter',e=>{ root.f=e.detail; App.render(); }); root.addEventListener('click',e=>{ const o=e.target.closest('[data-open]'); if(o){ root.filled[o.dataset.open]=1; App.render(); UI.toast('Shift posted to the float pool · staff will be notified'); } }); }
  };
};

/* =================== ANALYTICS & REPORTS =================== */
views.analytics=(arg,root)=>{
  const wk=Array.from({length:12},(_,i)=>{ const d=new Date(2026,6,7+i*7); return d.toLocaleString('en-US',{month:'short',day:'numeric'}); });
  const adm=walk(3,12,318,2,26).map(Math.round), dis=adm.map((v,i)=>Math.round(v-6+Math.sin(i)*9));
  root.ran=root.ran||{};
  const reps=[['Daily Bed Census','Operations','Every day · 6 AM','Today 6:00 AM'],['Monthly Occupancy by Department','Operations','Monthly · 1st','1 Sep'],['Readmissions within 30 Days','Quality','Monthly · 5th','5 Sep'],['Clinic No-Show Report','Outpatient','Weekly · Monday','Mon 28 Sep'],['Staffing vs Census','Workforce','Weekly · Friday','Fri 25 Sep']];
  return {
    title:'Analytics & Reports', meta:[['bld',App.fac().name],['cal','Last 12 weeks'],['clock','Data refreshed nightly']],
    actions:`<button class="head-sel" data-stub>${ic('cal')}Last 12 Weeks${ic('chev')}</button><button class="btn btn-primary" data-stub>${ic('plus')}New Report</button>`,
    html: tiles([
      {l:'Average Length of Stay',v:'4.7 days',d:'+0.2',good:false,s:'target 4.5',spark:walk(11,12,4.4,.03,.15),sc:'var(--s2)'},
      {l:'30-Day Readmissions',v:'13.8%',d:'-0.4 pts',good:true,s:'target 14%',spark:walk(12,12,14.5,-.06,.3),sc:'var(--s3)'},
      {l:'Bed Turnover',v:'5.2',s:'patients per bed per month'},
      {l:'Clinic No-Show Rate',v:'7.4%',d:'+0.9 pts',good:false,s:'target 5%'}
    ])+
    `<div class="lay g-1-1">`+
      card('Admissions vs Discharges','Per week · a gap above zero means the census grows',box('anLine',220)+legend([{name:'Admissions',color:'var(--s1)'},{name:'Discharges',color:'var(--s3)'}]))+
      card('Length of Stay by Department','Average days · marker = target',hbars([['Internal Medicine',5.6,4.8],['Cardiology',4.1,4.0],['Orthopedics',3.9,3.5],['Oncology',6.2,6.0],['Pediatrics',2.4,2.5],['Obstetrics',2.1,2.0]].map(([l,v,t])=>({l,v,t,c:v>t*1.1?'var(--s2)':'var(--s1)',vs:v>t?`+${(v-t).toFixed(1)} over`:'on target',tip:`<div class="tr"><span>Average</span><em>${v} days</em></div><div class="tr"><span>Target</span><em>${t} days</em></div>`})),{max:7,fmt:v=>v+' d',lw:140,bg:true,vw:72}))+
    `</div>`+
    `<div class="lay g-1-1">`+
      card('No-Show Rate by Clinic','Last 12 weeks',box('anCols',210))+
      card('Saved Reports','Scheduled and on-demand',`<div class="feed">${reps.map(([n,c,s,l],i)=>`<div class="fi"><div class="meta"><b style="color:var(--ink);font-weight:500;font-size:13.5px">${n}</b><span class="tag">${c}</span></div><span style="font-size:12.5px;color:var(--ink-2)">${s} · last run ${root.ran[i]?'just now':l}</span><span class="act"><button class="btn btn-secondary btn-sm" data-run="${i}">Run Now</button></span></div>`).join('')}</div>`)+
    `</div>`,
    draw(){
      V.line($('#anLine'),{labels:wk,tipLabels:wk.map(w=>'Week of '+w),series:[{name:'Admissions',values:adm,color:'var(--s1)'},{name:'Discharges',values:dis,color:'var(--s3)'}],min:260,max:380,every:2,tipExtra:i=>[{name:'Net change',value:(adm[i]-dis[i]>0?'+':'')+(adm[i]-dis[i])}]});
      V.cols($('#anCols'),{labels:['Cardiology','Endocrinology','Oncology','Pediatrics','Internal Med.'],series:[{name:'No-show rate',values:[9.1,6.4,3.2,8.8,7.9],color:'var(--s1)'}],refs:[{value:5,label:'Target 5%'}],fmt:v=>v+'%',height:210,left:36,gap:.45,every:1});
    },
    bind(root){ root.addEventListener('click',e=>{ const b=e.target.closest('[data-run]'); if(!b) return; root.ran[b.dataset.run]=1; App.render(); UI.toast('Report generated · available to download for 7 days'); }); }
  };
};

/* =================== ADMINISTRATION =================== */
const MODS=[['dashboard','Dashboard'],['patients','Patients'],['appointments','Appointments'],['admissions','Admissions'],['clinical','Clinical Care'],['diagnostics','Diagnostics'],['medications','Medications'],['homevisits','Home Visits'],['prescriptions','Prescriptions'],['facilities','Facilities & Departments'],['staff','Staff'],['analytics','Analytics & Reports'],['admin','Administration']];
const USERS=[['Dr. Elena Marsh','Physician','Internal Medicine','Active',1,'Today 7:02 AM'],['Jordan Okafor, RN','Nurse','4 West','Active',1,'Today 6:48 AM'],['Maya Chen','Reception','Front Desk','Active',1,'Today 7:55 AM'],['Sam Ruiz','Hospital Administrator','Administration','Active',1,'Today 8:10 AM'],['Dana Whitfield','Management','Executive','Active',1,'Yesterday 5:40 PM'],['Dr. Omar Siddiqui','Physician','Critical Care','Locked',1,'22 Sep · 5 failed attempts'],['Kate Morrison, RN','Nurse','Emergency','Invited',0,'Invite sent 28 Sep'],['Daniel Frost','Reception','Radiology Desk','Inactive',0,'14 Jun · 107 days ago']];
const AUDIT=[['10:39 AM','Jordan Okafor, RN','Viewed record','Margaret Hollis · CG-104821','WS-4W-02'],['10:36 AM','Dr. Elena Marsh','Acknowledged result','LAB-88213 · Basic Metabolic Panel','WS-4W-01'],['10:31 AM','Maya Chen','Checked in patient','Chloe Adams · Pediatrics','WS-FD-01'],['10:22 AM','Dr. Rafael Soto','Break-the-glass access','Record outside care team · reason: ED consult','WS-ED-06'],['10:05 AM','Emily Watson','Verified prescription','Piperacillin-tazobactam · Daniel Okoye','WS-PH-01'],['9:48 AM','Sam Ruiz','Changed permission','Nurse · Staff → View','WS-AD-01'],['9:12 AM','System','Account locked','Dr. Omar Siddiqui · 5 failed sign-ins','—'],['8:40 AM','Dana Whitfield','Exported report','Monthly Occupancy by Department','Remote · VPN']];
views.admin=(arg,root)=>{
  const tab=root.tab||'users';
  root.set=root.set||{mfa:true,timeout:true,glass:true,shared:false,export:true};
  const lvl=(r,m)=>{ if(!r.mods.includes(m)) return 0; if(r.id==='mgmt') return 1; if(r.id==='admin'&&['patients','admissions'].includes(m)) return 1; if(r.id==='nurse'&&m==='staff') return 1; return 2; };
  const lv=[['muted','No Access'],['confirm','View'],['ok','Edit']];
  const body={
    users:card('','',table('minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,1fr) 110px 70px minmax(0,1.2fr) 50px',['User','Role','Department','Status','MFA','Last Sign-In',''],USERS.map(([n,r,d,s,m,l])=>`<div class="t-row"><span class="pcell">${avatar(n)}<span class="t">${esc(n)}</span></span><span class="cell"><b>${r}</b></span><span class="cell">${d}</span>${st({Active:'ok',Locked:'bad',Invited:'confirm',Inactive:'warn'}[s],s)}<span>${m?App.h.sicon('ok','MFA enabled'):App.h.sicon('warn','MFA not set up')}</span><span class="cell">${l}</span><span class="act"><button class="icon-btn" aria-label="Edit ${attr(n)}" data-stub>${ic('edit')}</button></span></div>`)),{cls:'flush'}),
    roles:card('Roles & Permissions','Select a cell to grant or remove access · switch roles to see the navigation change',`<div class="perm" style="--n:${D.ROLES.length}"><span class="ph">Module</span>${D.ROLES.map(r=>`<span class="ph">${esc(r.label)}</span>`).join('')}${MODS.map(([k,l])=>`<span class="pm">${l}</span>`+D.ROLES.map(r=>{ const v=lvl(r,k); return k==='dashboard'?`<span class="pc locked" data-tip="Every role keeps the dashboard">${st(lv[v][0],lv[v][1])}</span>`:`<button class="pc" data-perm="${r.id}|${k}">${st(lv[v][0],lv[v][1])}</button>`; }).join('')).join('')}</div>`),
    audit:card('Audit Log','Every record view, change and sign-in is logged · kept for 7 years',table('90px minmax(0,1fr) minmax(0,1fr) minmax(0,1.5fr) 110px',['Time','User','Action','Object','Workstation'],AUDIT.map(([t,u,a,o,w])=>`<div class="t-row"><span class="num muted">${t}</span><span class="cell"><b>${esc(u)}</b></span><span class="cell"><b style="${/glass|locked/i.test(a)?'color:var(--warn)':''}">${esc(a)}</b></span><span class="cell">${esc(o)}</span><span class="mono" style="font-size:12px;color:var(--ink-3)">${w}</span></div>`)),{cls:'flush'}),
    settings:card('Security & System Settings','Applies to all facilities in Corvina Health',`<div class="setl">${[['mfa','Require multi-factor sign-in','For every account, including shared workstations.'],['timeout','Sign out after 15 minutes of inactivity','Shared clinical workstations lock sooner, after 5 minutes.'],['glass','Ask for a reason on break-the-glass access','Opening a record outside the care team is logged and reviewed.'],['shared','Allow badge tap sign-in on shared workstations','Nurses sign in with their badge instead of a password.'],['export','Watermark exported reports','Adds the user name and time to every exported file.']].map(([k,l,h])=>`<div class="set"><div><b>${l}</b><span>${h}</span></div><button class="switch" role="switch" aria-checked="${root.set[k]}" data-set="${k}"><span class="sw-track"><span class="sw-knob"></span></span></button></div>`).join('')}</div>`)
  }[tab];
  return {
    title:'Administration', meta:[['shield','Corvina Health · all facilities'],['user',`${USERS.length} users · ${D.ROLES.length} roles`]],
    actions:`<div class="seg" role="tablist" id="adTab">${[['users','Users'],['roles','Roles & Permissions'],['audit','Audit Log'],['settings','Settings']].map(([k,l])=>`<button role="tab" aria-selected="${k===tab}" data-k="${k}">${l}</button>`).join('')}</div>${tab==='users'?`<button class="btn btn-primary" data-stub>${ic('plus')}Invite User</button>`:''}`,
    html: tab==='users'?tiles([{l:'Active Users',v:'5',s:'signed in this week'},{l:'Locked',v:'1',s:'needs a reset',cls:'bad'},{l:'Pending Invites',v:'1',s:'sent 28 Sep'},{l:'Inactive 90+ Days',v:'1',s:'review access',cls:'warn'}])+body:body,
    bind(root){
      root.addEventListener('click',e=>{ const t=e.target.closest('#adTab [data-k]'); if(t){ root.tab=t.dataset.k; App.render(); return; }
        const p=e.target.closest('[data-perm]'); if(p){ const [rid,m]=p.dataset.perm.split('|'), r=D.ROLES.find(x=>x.id===rid), v=lvl(r,m);
          if(rid===App.S.role&&m==='admin'){ UI.toast('You cannot remove your own access to Administration'); return; }
          if(v===0) r.mods.push(m); else r.mods=r.mods.filter(x=>x!==m);
          App.render(); UI.toast(`${r.label} · ${MODS.find(x=>x[0]===m)[1]}: ${r.mods.includes(m)?'access granted':'access removed'}`); } });
      root.addEventListener('toggle',e=>{ const k=e.target.dataset.set; if(!k) return; root.set[k]=e.detail; UI.toast('Setting saved · logged in the audit trail'); });
    }
  };
};
})();
