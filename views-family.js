/* Family physician views: dashboard, my patients, home visits, prescriptions */
(function(){
const {views}=App, {$,$$,esc,attr,ic,st,sicon,N,hm,mins,tiles,card,box,hbars,mini,table,avatar,legend}=App.h;
const ME='marsh', isDoc=()=>App.S.role==='physician';
const panel=()=>D.PATIENTS.filter(p=>p.att===ME);
const APST={done:['muted','Completed'],noshow:['bad','No-Show'],progress:['confirm','In Progress'],waiting:['warn','Waiting'],checkedin:['ok','Checked In'],sched:['muted','Scheduled'],cancel:['muted','Cancelled']};
const money=v=>'$'+v.toFixed(2);

/* last and next contact with this doctor, from appointments and home visits */
function visits(p){
  const ab=x=>(x.w||0)*7+x.day;
  const ap=D.APPTS.filter(a=>a.doc===ME&&a.pid===p.id&&a.st!=='cancel').map(a=>({w:a.w||0,day:a.day,abs:ab(a),s:a.s,done:ab(a)<1||(ab(a)===1&&['done','noshow'].includes(a.st)),kind:'Clinic'}));
  const hv=D.HOMEVISITS.filter(v=>v.pid===p.id).map(v=>({w:v.w||0,day:v.day,abs:ab(v),s:v.s,done:v.st==='done',kind:'Home'}));
  const all=[...ap,...hv].sort((a,b)=>a.abs-b.abs||a.s-b.s);
  const last=[...all].reverse().find(v=>v.done), next=all.find(v=>!v.done);
  const lbl=v=>v?`${D.dayLabel(v.w,v.day)}${v.abs===1?' '+hm(v.s):''}${v.kind==='Home'?' · home':''}`:null;
  const fallback={p1:'Admitted 26 Sep',p3:'Admitted 27 Sep',p4:'Admitted 24 Sep',p6:'Admitted 27 Sep',p14:'Discharged 22 Sep',p15:'Today 8:00 AM'};
  return {last:lbl(last)||fallback[p.id]||p.lastSeen||'Aug 2026',next:lbl(next),nextV:next,lastV:last};
}
const CHRONIC=[['I10','Hypertension'],['E11','Type 2 diabetes'],['E78','High cholesterol'],['I50','Heart failure'],['J44','COPD'],['N18','Chronic kidney disease'],['F41','Anxiety']];
const hasCode=(p,c)=>p.dx.some(x=>x[0].startsWith(c));


/* Date picker for the physician dashboard: demo data covers Mon 21 Sep – Fri 9 Oct */
function picker(sel,root){
  const week=root.range==='week', abs=sel.w*7+sel.day;
  if(!week){ root.range='day'; root.dabs=abs; }
  root.pmode=root.pmode||root.range;
  const label=week?(root.wk===0?'This week · '+D.weekRange(0).replace(' 2026',''):D.weekRange(root.wk).replace(' 2026','')):(abs===1?'Today · Tue 29 Sep':D.dayLabel(sel.w,sel.day));
  return `<div class="menu-wrap"><button class="head-sel" data-menu="#spPop" aria-expanded="false">${ic('cal')}${esc(label)}${ic('chev')}</button><div class="pop right dp cal-pick" id="spPop">${App.pickerBody(root)}</div></div>`;
}

/* Donut: part-to-whole for a handful of groups. Fixed categorical order, 2px surface gaps, hover per slice. */
function donut(parts,{size=168,thick=26,center='',sub=''}={}){
  const tot=parts.reduce((t,p)=>t+p.v,0), r=size/2-2, ri=r-thick, cx=size/2; let a=-Math.PI/2;
  const pt=(ang,rad)=>[cx+rad*Math.cos(ang),cx+rad*Math.sin(ang)];
  const seg=parts.map(p=>{ const a0=a, a1=a+p.v/tot*Math.PI*2; a=a1; const big=a1-a0>Math.PI?1:0, [x0,y0]=pt(a0,r),[x1,y1]=pt(a1,r),[x2,y2]=pt(a1,ri),[x3,y3]=pt(a0,ri);
    return `<path class="dn-s" style="--c:${p.c}" d="M${x0},${y0}A${r},${r} 0 ${big} 1 ${x1},${y1}L${x2},${y2}A${ri},${ri} 0 ${big} 0 ${x3},${y3}Z" data-t="${attr(`<b>${esc(p.l)}</b><div class="tr"><span>Prescriptions</span><em>${p.v}</em></div><div class="tr"><span>Share</span><em>${Math.round(p.v/tot*100)}%</em></div>`)}"/>`; }).join('');
  return `<div class="dn"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${attr(parts.map(p=>p.l+' '+p.v).join(', '))}">${seg}<text x="${cx}" y="${cx+2}" class="dn-v">${center}</text><text x="${cx}" y="${cx+20}" class="dn-l">${sub}</text></svg>
    <div class="dn-lg">${parts.map(p=>`<div><i style="--c:${p.c}"></i><span>${esc(p.l)}</span><b>${p.v}</b><em>${Math.round(p.v/tot*100)}%</em></div>`).join('')}</div></div>`;
}
const RXGROUP={Statin:'Cholesterol',Biguanide:'Diabetes',SSRI:'Mental health',NSAID:'Pain relief',Analgesic:'Pain relief','Muscle relaxant':'Pain relief',Bronchodilator:'Respiratory',Penicillin:'Antibiotics','ACE inhibitor':'Blood pressure'};
/* Both widgets follow the date picker: they receive the days to count */
function periodOf(days){ const abs=days.map(([w,d])=>w*7+d), when=abs.every(a=>a>1)?'future':abs.length===1&&abs[0]===1?'today':abs.includes(1)?'thisweek':'past';
  const label=days.length===1?D.dayLabel(days[0][0],days[0][1]).replace('Today','today'):'this period'; return {when,label}; }
function emptyState(kind,days){
  const {when,label}=periodOf(days), rx=kind==='rx';
  const title=rx?{today:'No prescriptions yet today',thisweek:'No prescriptions this week yet',past:`No prescriptions were issued ${days.length===1?'on '+label:'in this period'}`,future:'Nothing to show yet'}[when]
    :{today:'No home visit requests yet today',thisweek:'No home visit requests this week yet',past:`No home visit requests ${days.length===1?'on '+label:'in this period'}`,future:'Nothing to show yet'}[when];
  const hint=rx?(when==='future'?'Prescriptions appear here once visits on this date take place.':'Prescriptions you write during clinic or home visits are counted here by medication group.')
    :(when==='future'?'Requests appear here as patients call in on this date.':'When patients ask for a home visit, you see here how many were closed by phone and how many needed a visit.');
  const visual=rx?`<svg class="dn-empty" viewBox="0 0 168 168" width="168" height="168" aria-hidden="true"><circle cx="84" cy="84" r="69" /><text x="84" y="86" class="dn-v">0</text><text x="84" y="104" class="dn-l">prescriptions</text></svg>`
    :`<div class="hvm-bar hvm-none"><span style="width:100%">No requests</span></div>`;
  return rx?`<div class="dn">${visual}<div class="es"><b>${esc(title)}</b><span>${esc(hint)}</span></div></div>`
    :`${visual}<div class="es"><b>${esc(title)}</b><span>${esc(hint)}</span></div>`;
}
function rxMix(days){
  const keys=days.map(([w,d])=>D.dayKey(w,d)), m={}; days.forEach(([w])=>D.ensureWeek(w));
  D.ORX.filter(r=>keys.includes(r.date)).forEach(r=>{ const g=RXGROUP[r.f.cls]||'Other'; m[g]=(m[g]||0)+1; });
  const all=Object.entries(m).sort((a,b)=>b[1]-a[1]), top=all.slice(0,5), rest=all.slice(5).reduce((t,x)=>t+x[1],0);
  const C=['var(--s1)','var(--s2)','var(--s3)','var(--s4)','var(--s5)'];
  const parts=top.map(([l,v],i)=>({l,v,c:C[i]})); if(rest) parts.push({l:'Other',v:rest,c:'var(--line-2)'});
  const n=all.reduce((t,x)=>t+x[1],0);
  return card('Prescriptions by Group','',n?donut(parts,{center:String(n),sub:n===1?'prescription':'prescriptions'}):emptyState('rx',days),{cls:'s2'});
}
function hvMix(days){
  days.forEach(([w])=>D.ensureWeek(w));
  /* phone side: requests closed by a call; visit side: the doctor's real home visits in the period, done or still scheduled */
  const phone=days.flatMap(([w,d])=>D.hvReqs(w,d)).filter(x=>x[0]==='phone').map(x=>x[1]);
  const V=days.flatMap(([w,d])=>D.HOMEVISITS.filter(v=>(v.w||0)===w&&v.day===d&&(v.doc||ME)===ME));
  const done=V.filter(v=>v.st==='done'), sched=V.filter(v=>v.st!=='done');
  const np=phone.length, nd=done.length, ns=sched.length, tot=np+nd+ns;
  if(!tot) return card('Home Visit Requests','',emptyState('hv',days),{cls:'s2'});
  const group=list=>{ const m={}; list.forEach(k=>m[k]=(m[k]||0)+1); return Object.entries(m).sort((a,b)=>b[1]-a[1]); };
  const P=group(phone), VR=(()=>{ const m={}; V.forEach(v=>{ const k=v.reason.split(' · ')[0]; m[k]=m[k]||{d:0,s:0}; v.st==='done'?m[k].d++:m[k].s++; }); return Object.entries(m).sort((a,b)=>(b[1].d+b[1].s)-(a[1].d+a[1].s)); })();
  const mx=Math.max(1,...P.map(r=>r[1]),...VR.map(r=>r[1].d+r[1].s));
  const seg=(v,cls,label)=>v?`<span class="${cls}" style="width:${v/tot*100}%" data-t="${attr(`<b>${label}</b><div class="tr"><span>Count</span><em>${v} · ${Math.round(v/tot*100)}%</em></div>`)}">${v/tot>.12?`${v} ${label.toLowerCase()}`:v}</span>`:'';
  const left=`<div class="hvm-c"><div class="hvm-h"><i style="--c:var(--s3)"></i><b>Closed by phone</b><span>${np}</span></div>${P.length?P.map(([l,v])=>`<div class="hvm-r"><span>${esc(l)}</span><span class="hvm-b"><i style="width:${v/mx*100}%;--c:var(--s3)"></i></span><b>${v}</b></div>`).join(''):'<div class="muted" style="font-size:12.5px">None</div>'}</div>`;
  const right=`<div class="hvm-c"><div class="hvm-h"><i style="--c:var(--s1)"></i><b>Home visits</b><span>${nd} done${ns?` · ${ns} scheduled`:''}</span></div>${VR.length?VR.map(([l,c])=>`<div class="hvm-r" data-t="${attr(`<b>${esc(l)}</b><div class="tr"><span>Done</span><em>${c.d}</em></div><div class="tr"><span>Scheduled</span><em>${c.s}</em></div>`)}"><span>${esc(l)}${!c.d?' <em class="sch">Scheduled</em>':''}</span><span class="hvm-b">${c.d?`<i style="width:${c.d/mx*100}%;--c:var(--s1)"></i>`:''}${c.s?`<i class="sch" style="left:${c.d/mx*100}%;width:${c.s/mx*100}%"></i>`:''}</span><b>${c.d+c.s}</b></div>`).join(''):'<div class="muted" style="font-size:12.5px">None</div>'}</div>`;
  return card('Home Visit Requests','',`<div class="hvm-bar">${seg(np,'ph','By phone')}${seg(nd,'vd','Visited')}${seg(ns,'sc','Scheduled')}</div><div class="hvm">${left}${right}</div>
    <div class="legend"><span><i class="lg-sw" style="--c:var(--s3)"></i>Closed by phone</span><span><i class="lg-sw" style="--c:var(--s1)"></i>Visited</span><span><i class="lg-sw sch"></i>Scheduled</span></div>`,{cls:'s2'});
}
/* =================== DASHBOARD (physician) =================== */
const baseDash=views.dashboard;
views.dashboard=(a,root)=>{
  if(!isDoc()) return baseDash(a,root);
  const sel=root.sel||{w:0,day:1}; if(root.range==='week') return weekDash(root.wk||0,root); if(!(sel.w===0&&sel.day===1)) return pastDay(sel,root);
  const P=panel(), today=D.APPTS.filter(x=>x.doc===ME&&!x.w&&x.day===1).sort((a,b)=>a.s-b.s);
  const waiting=today.filter(x=>x.st==='waiting'||x.st==='checkedin'), hvWeek=D.HOMEVISITS.filter(v=>!v.w&&v.st==='sched');
  const refills=D.ORX.filter(r=>r.status==='Refill Requested'), results=D.ORDERS.filter(o=>o.by===ME&&(o.flag==='abn'||o.flag==='crit')&&!o.ack);
  const due=P.filter(p=>p.checkEvery&&p.monthsAgo>p.checkEvery&&!visits(p).next).sort((a,b)=>(b.monthsAgo-b.checkEvery)-(a.monthsAgo-a.checkEvery));
  return {
    title:'Analytics', meta:[],
    actions:picker(sel,root),
    html: tiles([
      {l:'Patients Today',v:String(today.filter(x=>x.st!=='cancel').length),s:`${today.filter(x=>x.st==='done').length} seen · ${today.filter(x=>x.st==='sched').length} to come`,href:'#/appointments'},
      {l:'Waiting for You',v:String(waiting.length),s:waiting.length?`next: ${waiting[0].name}`:'no one waiting',cls:waiting.length?'warn':'',href:'#/appointments'},
      {l:'Home Visits This Week',v:String(hvWeek.length),s:'Wed 30 and Fri 2',href:'#/homevisits'},
      {l:'Prescriptions Today',v:String(D.ORX.filter(r=>r.date==='29 Sep').length),href:'#/prescriptions'}
    ].map(t=>({...t,s:'',d:''})),'bare')+
    `<div class="lay c4">`+
      card('Today in Clinic',`${today.filter(x=>x.st==='done').length} seen · ${today.filter(x=>x.st==='noshow').length} no-show · ${today.filter(x=>x.st==='cancel').length} cancelled`,`<div class="agenda compact">${today.filter(x=>!['done','noshow','cancel'].includes(x.st)).slice(0,6).map(x=>{ const [k,l]=APST[x.st]; return `<button class="ag ${x.st}" data-ap="${x.id}"><span class="ag-t">${hm(x.s)}</span><span class="ag-n">${avatar(x.name,"sm")}<b>${esc(x.name)}</b><span>${esc(x.reason)}</span></span>${st(k,l)}</button>`; }).join('')}</div><a class="more" href="#/appointments">Full schedule · ${today.filter(x=>x.st!=='cancel').length} today ${ic('go')}</a>`,{cls:'s2'})+lowerRow('s2')+`</div>`+`<div class="lay c4">`+rxMix([[0,1]])+hvMix([[0,1]])+`</div>`,
    bind:bindDash,
  };
};


function lowerRow(cls){
  const P=panel();
  return card('Your Patients by Condition',`${P.length} patients registered to you · top 6 chronic conditions`,'<div class="hb-match">'+hbars(CHRONIC.map(([c,l])=>({l,v:P.filter(p=>hasCode(p,c)).length})).filter(r=>r.v).sort((a,b)=>b.v-a.v).slice(0,6).map(r=>({...r,tip:`<div class="tr"><span>Patients</span><em>${r.v}</em></div>`})),{lw:170,vw:40,bg:true})+'</div>',{cls:cls||''});
}
function bindDash(root){ root.addEventListener('click',e=>{
  const pmn=e.target.closest('#spPop [data-pm]'); if(pmn){ e.stopPropagation(); root.pm=+pmn.dataset.pm; document.getElementById('spPop').innerHTML=App.pickerBody(root); return; }
  const pmo=e.target.closest('#spPop [data-pmode]'); if(pmo){ e.stopPropagation(); root.pmode=pmo.dataset.pmode; document.getElementById('spPop').innerHTML=App.pickerBody(root); return; }
  const dd=e.target.closest('#spPop [data-day]'); if(dd){ const v=+dd.dataset.day; root.sel={w:Math.floor(v/7),day:((v%7)+7)%7}; root.range='day'; root.pmode='day'; root.pm=null; App.render(); return; }
  const wk=e.target.closest('#spPop [data-wk]'); if(wk){ root.range='week'; root.pmode='week'; root.wk=+wk.dataset.wk; root.pm=null; App.render(); return; }
  const gd=e.target.closest('[data-goday]'); if(gd){ const v=+gd.dataset.goday; root.sel={w:Math.floor(v/7),day:((v%7)+7)%7}; root.range='day'; root.pmode='day'; App.render(); return; }
  const a=e.target.closest('[data-ap]'); if(a){ App.apptDrawer(a.dataset.ap); return; }
  const h=e.target.closest('[data-hv]'); if(h){ App.hvDrawer(h.dataset.hv); return; }
  const b=e.target.closest('[data-book]'); if(b){ b.outerHTML=st('ok','Invited'); UI.toast('Invitation sent · the patient gets an SMS with a link to book a check-up'); } }); }

/* Week summary for the dashboard */
function weekDash(W,root){
  D.ensureWeek(W);
  const doc=D.doc(ME), A=D.APPTS.filter(a=>a.doc===ME&&(a.w||0)===W), HV=D.HOMEVISITS.filter(v=>(v.w||0)===W&&(v.doc||ME)===ME);
  const keys=[0,1,2,3,4].map(i=>D.dayKey(W,i)), RX=D.ORX.filter(r=>keys.includes(r.date));
  const seen=A.filter(a=>a.st==='done').length+HV.filter(v=>v.st==='done').length, booked=A.filter(a=>a.st!=='cancel').length;
  const max=Math.max(1,...[0,1,2,3,4].map(i=>A.filter(a=>a.day===i&&a.st!=='cancel').length+HV.filter(v=>v.day===i).length));
  const rows=[0,1,2,3,4].map(i=>{ const home=!doc.clinicDays.includes(i), a=A.filter(x=>x.day===i&&x.st!=='cancel'), h=HV.filter(v=>v.day===i), n=home?h.length:a.length, done=home?h.filter(v=>v.st==='done').length:a.filter(x=>x.st==='done').length, ns=a.filter(x=>x.st==='noshow').length, abs=W*7+i;
    return `<button class="wk-r${abs===1?' today':''}" data-goday="${abs}"><span class="wk-d"><b>${D.dayLabel(W,i,false).replace('Today','Tue 29 Sep')}</b>${home?'Home visits':'Clinic'}</span><span class="wk-bar"><i class="done" style="width:${done/max*100}%"></i><i class="left" style="width:${(n-done)/max*100}%"></i></span><span class="wk-n">${n}</span><span class="wk-s">${ns?`<span class="st bad">${ns} no-show</span>`:done===n&&n?'<span class="muted">all done</span>':n-done?`<span class="muted">${n-done} to come</span>`:''}</span></button>`; }).join('');
  return {
    title:'Analytics', meta:[], actions:picker({w:W,day:1},root),
    html: tiles([
      {l:'Patients',v:String(booked+HV.length)},
      {l:'Seen',v:String(seen)},
      {l:'Home Visits',v:String(HV.length)},
      {l:'Prescriptions',v:String(RX.length)}
    ])+
    `<div class="lay c4">`+
      card('Week at a Glance','',`<div class="wk">${rows}</div><div class="legend"><span><i class="lg-sw" style="--c:var(--s1)"></i>Seen</span><span><i class="lg-sw" style="--c:var(--q2)"></i>Booked</span></div>`,{cls:'s2'})+
      card('Prescriptions Issued','',RX.length?`<div class="feed">${RX.map(r=>`<div class="fi"><div class="meta">${avatar(D.pat(r.pid).name,'sm')}<b style="color:var(--ink);font-weight:500;font-size:13.5px">${esc(r.f.drug)} ${esc(r.f.dose)}</b><span>${esc(D.pat(r.pid).name)} · ${r.date}</span></div></div>`).join('')}</div>`:'<div class="empty">No prescriptions this week.</div>',{cls:'s2'})+
    `</div>`+lowerRow()+`<div class="lay c4">`+rxMix([0,1,2,3,4].map(i=>[W,i]))+hvMix([0,1,2,3,4].map(i=>[W,i]))+`</div>`,
    bind:bindDash
  };
}

/* Any other day: what happened (past) or what is booked (future) */
function pastDay(sel,root){
  D.ensureWeek(sel.w);
  const past=sel.w*7+sel.day<1, key=D.dayKey(sel.w,sel.day), long=D.dayLabel(sel.w,sel.day,true);
  const A=D.APPTS.filter(x=>x.doc===ME&&(x.w||0)===sel.w&&x.day===sel.day).sort((a,b)=>a.s-b.s), HV=D.HOMEVISITS.filter(v=>(v.w||0)===sel.w&&v.day===sel.day);
  const home=!D.doc(ME).clinicDays.includes(sel.day), RX=D.ORX.filter(r=>r.date===key);
  const done=A.filter(x=>x.st==='done').length+HV.filter(v=>v.st==='done').length, noshow=A.filter(x=>x.st==='noshow').length, cancel=A.filter(x=>x.st==='cancel').length;
  const saved=RX.reduce((t,r)=>t+r.price.saved,0);
  const rows=home?HV.map(v=>{ const p=D.pat(v.pid); return `<button class="ag ${v.st==='done'?'done':'sched'}" data-hv="${v.id}"><span class="ag-t">${hm(v.s)}</span><span class="ag-n">${avatar(p.name,"sm")}<b>${esc(p.name)}</b><span>${esc(v.reason)}</span></span>${v.st==='done'?st('muted','Completed'):st('muted','Scheduled')}</button>`; })
    :A.map(x=>{ const [k,l]=APST[x.st]; return `<button class="ag ${x.st}" data-ap="${x.id}"><span class="ag-t">${hm(x.s)}</span><span class="ag-n">${avatar(x.name,"sm")}<b>${esc(x.name)}</b><span>${esc(x.reason)}</span></span>${st(k,l)}</button>`; });
  return {
    title:'Analytics', meta:[],
    actions:picker(sel,root),
    html: tiles(past?[
      {l:home?'Home Visits':'Patients Seen',v:String(done),s:home?`${HV.length} planned`:`of ${A.filter(x=>x.st!=='cancel').length} booked`},
      {l:'No-Shows',v:String(noshow),s:noshow?'rebooking SMS sent':'everyone came',cls:noshow?'warn':''},
      {l:'Cancelled',v:String(cancel),s:'by the patient'},
      {l:'Prescriptions Issued',v:String(RX.length),s:RX.length?`patients saved $${N(saved)}`:'none this day',href:'#/prescriptions'},
      {l:'Average Visit',v:home?'45 min':'27 min',s:home?'plus travel':'target 30 min'}
    ]:[
      {l:home?'Home Visits Booked':'Appointments Booked',v:String(home?HV.length:A.filter(x=>x.st!=='cancel').length),s:home?HV.map(v=>D.pat(v.pid).name.split(' ')[0]).join(', '):'free slots available'},
      {l:'Free Slots',v:home?'—':String(Math.max(0,14-A.length)),s:home?'home visit day':'30-minute slots'},
      {l:'New Patients',v:String(A.filter(x=>/new patient/i.test(x.reason)).length),s:'first visit'},
      {l:'Check-ups',v:String(A.filter(x=>/physical|follow-up|review/i.test(x.reason)).length),s:'chronic care and physicals'},
      {l:'Confirmed by Patients',v:String(Math.round((home?HV.length:A.filter(x=>x.st!=='cancel').length)*.7)),s:'SMS reminders go out 24h before'}
    ].map(t=>({...t,s:'',d:''})),'tiles-5 bare')+
    `<div class="lay c5">`+
      card(home?'Home Visits':'Clinic',`${rows.length} ${home?'visits':'appointments'} · select one to open`,rows.length?`<div class="agenda compact">${rows.join('')}</div>`:'<div class="empty">Nothing booked.</div>',{cls:'s3'})+
      card(past?'Prescriptions Issued':'Before This Day',past?`${RX.length} · Westside Pharmacy`:'Prepare in advance',past?(RX.length?`<div class="feed">${RX.map(r=>`<div class="fi"><div class="meta"><b style="color:var(--ink);font-weight:500;font-size:13.5px">${esc(r.f.drug)} ${esc(r.f.dose)}</b><span>${esc(D.pat(r.pid).name)}</span></div><span style="font-size:12.5px;color:var(--ink-2)">${esc(r.price.plan)} · patient paid $${r.price.pays.toFixed(2)} <s class="muted">$${r.price.list.toFixed(2)}</s></span></div>`).join('')}</div>`:'<div class="empty">No prescriptions this day.</div>')
        :`<div class="att">${[['muted',`${A.filter(x=>/new patient/i.test(x.reason)).length} new patients`,'Registration forms sent by SMS'],['muted','Lab results','Review results for booked follow-ups the day before'],['muted','Reminders','Patients get an SMS reminder 24 hours before']].map(([k,t,d2])=>`<a href="#/appointments">${sicon(k,'To do')}<span class="t">${esc(t)}</span><span class="go">${ic('go')}</span><span class="d">${esc(d2)}</span></a>`).join('')}</div>`,{cls:'s2'})+
    `</div>`+lowerRow()+`<div class="lay c4">`+rxMix([[sel.w,sel.day]])+hvMix([[sel.w,sel.day]])+`</div>`,
    bind:bindDash
  };
}

/* =================== MY PATIENTS (physician) =================== */
const basePatients=views.patients;
views.patients=(a,root)=>{
  if(!isDoc()) return basePatients(a,root);
  const TABS=[['all','All'],['week','Seen This Week'],['next','Visit Booked'],['home','Home Visits'],['hosp','In Hospital']];
  const match=(p,f)=>{ const v=visits(p); return f==='all'||(f==='week'&&v.lastV&&v.lastV.abs>=0)||(f==='next'&&!!v.next)||(f==='home'&&p.homebound)||(f==='hosp'&&p.status==='Inpatient'); };
  const list=()=>{ const f=root.f||'all', q=(root.q||'').toLowerCase(); return panel().filter(p=>match(p,f)&&(!q||(p.name+' '+p.mrn+' '+p.dx.map(x=>x[1]).join(' ')).toLowerCase().includes(q))).sort((a,b)=>a.name.localeCompare(b.name)); };
  const stOf=p=>p.status==='Inpatient'?st('confirm','In Hospital'):p.homebound?st('muted','Home Visits'):p.status==='Discharged'?st('warn','Recently Discharged'):st('ok','Active');
  const cols='minmax(0,1.4fr) 70px minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) 150px 80px', head=['Patient','Age · Sex','Conditions','Last Visit','Next Visit','Status','Allergies'];
  const rows=()=>list().map(p=>{ const v=visits(p); return `<a class="t-row click" href="#/patient/${p.id}"><span class="pcell">${avatar(p.name)}<span class="cell"><b>${esc(p.name)}</b><span class="mono">${p.mrn}</span></span></span><span class="num">${p.age} · ${p.sex}</span><span class="cell"><b>${esc(p.dx[0][1])}</b>${p.dx[1]?esc(p.dx.slice(1).map(x=>x[1]).join(', ')):''}</span><span class="cell"><b>${esc(v.last)}</b></span><span class="cell">${v.next?`<b>${esc(v.next)}</b>`:'<span class="muted">Not booked</span>'}</span>${stOf(p)}<span>${p.allergies.length?`<span class="st bad" data-tip="${attr(p.allergies.join(', '))}">${ic('alert')}${p.allergies.length}</span>`:'<span class="muted" style="font-size:12.5px">None</span>'}</span></a>`; });
  const cards=()=>{ const L=list(); return L.length?`<div class="pgrid">${L.map(p=>{ const v=visits(p); return `<a class="pcard" href="#/patient/${p.id}">
      <div class="pc-top">${avatar(p.name,'lg')}<span class="cell"><b>${esc(p.name)}</b>${p.age} · ${p.sex} · <span class="mono">${p.mrn}</span></span></div>
      <div class="pc-st">${stOf(p)}${p.allergies.length?`<span class="st bad" data-tip="${attr(p.allergies.join(', '))}">${ic('alert')}${p.allergies.length===1?esc(p.allergies[0]):p.allergies.length+' allergies'}</span>`:''}</div>
      <div class="pc-dx">${p.dx.slice(0,2).map(x=>`<span class="tag">${esc(x[1])}</span>`).join('')}${p.dx.length>2?`<span class="tag">+${p.dx.length-2}</span>`:''}</div>
      <dl class="pc-v"><dt>Last visit</dt><dd>${esc(v.last)}</dd><dt>Next visit</dt><dd>${v.next?esc(v.next):'<span class="muted">Not booked</span>'}</dd></dl></a>`; }).join('')}</div>`:`<div class="empty">No patients match.</div>`; };
  const body=()=>(root.pv||'list')==='cards'?cards():`<section class="card flush"><div id="pTable">${table(cols,head,rows(),{empty:'No patients match.'})}</div></section>`;
  const n=f=>panel().filter(p=>match(p,f)).length;
  return {
    title:'Patients', meta:[],
    actions:`<button class="btn btn-secondary" data-stub>${ic('dl')}Export</button>`,
    html:`<div class="toolbar"><div class="seg st-tabs">${TABS.map(([k,l])=>`<button class="chip" data-filter="${k}" aria-pressed="${k===(root.f||'all')}">${l} <span class="n">${n(k)}</span></button>`).join('')}</div><div class="tb-right"><input class="input tb-search" id="pSearch" placeholder="Search by name, MRN or condition…" value="${attr(root.q||'')}"><div class="seg" role="tablist" id="pvSeg"><button role="tab" aria-selected="${(root.pv||'list')==='list'}" data-pv="list"><svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>List</button><button role="tab" aria-selected="${root.pv==='cards'}" data-pv="cards"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Cards</button></div></div></div><div id="pWrap">${body()}</div>`,
    bind(root){
      const upd=()=>{ $('#pWrap',root).innerHTML=body(); };
      root.addEventListener('click',e=>{ const b=e.target.closest('#pvSeg [data-pv]'); if(!b) return; root.pv=b.dataset.pv; $$('#pvSeg button',root).forEach(x=>x.setAttribute('aria-selected',x===b)); upd(); });
      root.addEventListener('input',e=>{ if(e.target.id==='pSearch'){ root.q=e.target.value; upd(); } });
      root.addEventListener('filter',e=>{ root.f=e.detail; upd(); });
    }
  };
};

/* =================== HOME VISITS =================== */
const DAYFULL={2:'Wednesday 30 September',4:'Friday 2 October'};
function routeSvg(V2){
  const pts=[[12,50],...V2.map(v=>v.xy)], X=x=>x*3.2, Y=y=>y*2;
  return `<svg class="route" viewBox="0 0 320 200" role="img" aria-label="Route">
    <defs><pattern id="rg" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" class="rg"/></pattern></defs>
    <rect width="320" height="200" fill="url(#rg)"/><path class="road" d="M0 120 C80 110 140 150 320 130"/><path class="road" d="M150 0 C160 60 140 120 170 200"/>
    <polyline class="leg" points="${pts.map(([x,y])=>X(x)+','+Y(y)).join(' ')}"/>
    <g class="pin home-base"><circle cx="${X(12)}" cy="${Y(50)}" r="11"/><text x="${X(12)}" y="${Y(50)+4}">C</text></g>
    ${V2.map((v,i)=>`<g class="pin" data-t="${attr(`<b>${i+1}. ${esc(D.pat(v.pid).name)}</b><div class="tr"><span>${hm(v.s)} · ${esc(D.pat(v.pid).addr)}</span></div>`)}"><circle cx="${X(v.xy[0])}" cy="${Y(v.xy[1])}" r="11"/><text x="${X(v.xy[0])}" y="${Y(v.xy[1])+4}">${i+1}</text></g>`).join('')}
  </svg>`;
}
function driverBlock(day){ const d=D.DRIVERS[day]; if(!d) return '';
  return `<div class="drv"><div class="drv-lbl">Driver</div><div class="drv-p">${avatar(d.name,'lg')}<span class="cell"><b>${esc(d.name)}</b>Leaves clinic ${d.leave}</span><button class="icon-btn bordered" aria-label="Call ${attr(d.name)}" data-stub>${ic('phone')}</button></div>
    <dl class="dl drv-car"><dt>Car</dt><dd>${esc(d.car)} · ${esc(d.color)}</dd><dt>Plate</dt><dd class="mono">${esc(d.plate)}</dd>${d.note?`<dt>Access</dt><dd>${esc(d.note)}</dd>`:''}</dl></div>`; }
views.homevisits=(a,root)=>{
  const range=root.range||'week', W=root.wk||0, dAbs=root.dabs??1, dW=Math.floor(dAbs/7), dD=((dAbs%7)+7)%7;
  D.ensureWeek(range==='day'?dW:W);
  const tab=root.tab||'sched', inTab=v=>(v.st==='done'?'done':'sched')===tab;
  const cols=range==='day'?[[dW,dD]]:[[W,2],[W,4]];
  const of=(w,i)=>D.HOMEVISITS.filter(v=>(v.w||0)===w&&v.day===i&&(v.doc||ME)===ME).sort((a,b)=>a.s-b.s);
  const all=cols.flatMap(([w,i])=>of(w,i)), n=k=>all.filter(v=>(v.st==='done'?'done':'sched')===k).length;
  const miles=V2=>V2.reduce((t,v)=>t+(parseFloat(v.dist)||0),0).toFixed(1);
  const rx=v=>`<button class="icon-btn row-more" data-rxrow="${v.pid}" aria-label="Prescribe">${ic('pill')}</button>`;
  const call=v=>`<button class="icon-btn row-more" data-call-p="${v.pid}" aria-label="Call Patient">${ic('phone')}</button>`;
  const more=v=>`<button class="icon-btn row-more" data-more="h:${v.id}" aria-label="More Actions"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg></button>`;
  const list=`<div class="wl">${cols.map(([w,i])=>{ const day=of(w,i), L=day.filter(inTab);
    return `<div class="wl-day">${range==='day'?'':`<div class="wl-dh"><b>${D.dayLabel(w,i,true)}</b><span class="muted">${L.length} ${L.length===1?'visit':'visits'}</span></div>`}
      ${L.length?table('90px minmax(0,1fr) minmax(0,1fr) minmax(0,1.4fr) 200px',['Time','Patient','Address','Reason',''],L.map(v=>{ const p=D.pat(v.pid), k=day.indexOf(v)+1;
        return `<div class="t-row click${v.st==='done'?' done':''}" data-hv="${v.id}"><span class="num">${hm(v.s)}</span><span class="pcell">${avatar(p.name)}<span class="cell"><b>${esc(p.name)}</b>${p.age} · ${p.sex}</span></span><span class="cell"><b>${esc(p.addr)}</b>${esc(v.dist)} from clinic</span><span class="cell"><b>${esc(v.reason)}</b>${v.note?esc(v.note):''}</span><span class="act">${call(v)}${rx(v)}${v.st!=='done'?`<button class="btn btn-secondary btn-sm" data-hvdone="${v.id}">Complete</button>`:''}${more(v)}</span></div>`; })):`<div class="empty" style="padding:14px 0;text-align:left">${range==='day'&&![2,4].includes(i)?'Home visits happen on Wednesdays and Fridays.':tab==='sched'?'Nothing scheduled.':'Nothing completed.'}</div>`}</div>`; }).join('')}</div>`;
  /* calendar view: one column per home-visit day, same grid as Appointments */
  const mode=root.mode||'list', H0=8, H1=17, slot=v=>((v-H0)/(H1-H0)*100).toFixed(3)+'%';
  const calv=`<div class="cal week${cols.length===1?' one':''}" style="--cols:${cols.length}">
    <div class="cal-h"><span></span>${cols.map(([w,i])=>`<span class="cal-doc day${!w&&i===1?' today':''}"><span class="cell"><b>${D.dayLabel(w,i).replace('Today','Tue 29 Sep')}</b>${of(w,i).filter(inTab).length} visits</span></span>`).join('')}</div>
    <div class="cal-b"><div class="cal-t">${Array.from({length:H1-H0},(_,k)=>`<span style="top:${slot(H0+k)}">${hm(H0+k).replace(':00','')}</span>`).join('')}</div>
      ${cols.map(([w,i])=>`<div class="cal-col">${of(w,i).filter(inTab).map(v=>{ const p=D.pat(v.pid); return `<button class="appt home${v.st==='done'?' done':''}" data-hv="${v.id}" style="top:${slot(v.s)};height:calc(${((v.e-v.s)/(H1-H0)*100).toFixed(3)}% - 3px)" data-t="${attr(`<b>${esc(p.name)}</b><div class="tr"><span>${hm(v.s)} – ${hm(v.e)}</span></div><div class="tr"><span>${esc(p.addr)}</span></div><div class="tr"><span>${esc(v.reason)}</span></div>`)}"><b>${esc(p.name)}</b><span>${ic('home')}${esc(p.addr)} · ${esc(v.reason)}</span></button>`; }).join('')}</div>`).join('')}
    </div></div>`;
  const vseg=`<div class="seg" role="tablist" id="vSeg"><button role="tab" aria-selected="${mode==='list'}" data-m="list"><svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>List</button><button role="tab" aria-selected="${mode==='cal'}" data-m="cal">${ic('cal')}Calendar</button></div>`;
  const tabs=`<div class="seg st-tabs" role="tablist" id="stTabs"><button role="tab" aria-selected="${tab==='sched'}" data-st="sched">Scheduled <span class="n">${n('sched')}</span></button><button role="tab" aria-selected="${tab==='done'}" data-st="done">Completed <span class="n">${n('done')}</span></button></div>`;
  const rday=range==='day'?[dW,dD]:[W,root.rday||2], RV=of(rday[0],rday[1]);
  const fieldLabel=range==='day'?(dAbs===1?'Today · Tue 29 Sep':D.dayLabel(dW,dD)):(W===0?'This week · '+D.weekRange(W).replace(' 2026',''):D.weekRange(W).replace(' 2026',''));
  const field=`<div class="menu-wrap"><button class="head-sel" data-menu="#spPop" aria-expanded="false">${ic('cal')}${esc(fieldLabel)}${ic('chev')}</button><div class="pop right dp cal-pick" id="spPop">${App.pickerBody(Object.assign(root,{range}))}</div></div>`;
  return {
    title:'Home Visits', meta:[],
    actions:field+`<button class="btn btn-primary" id="hvNew">${ic('plus')}Schedule Home Visit</button>`,
    html:
    `<div class="toolbar">${tabs}<div class="tb-right">${vseg}</div></div>`+
    `<div class="lay c4">`+
      `<section class="card s3 nohead">${mode==='cal'?calv:list}</section>`+
      card('Route',RV.length?`${D.dayLabel(rday[0],rday[1])} · ${miles(RV)} mi`:'',RV.length?routeSvg(RV)+`<div class="legs">${[{addr:'Corvina General · clinic'},...RV.map(v=>({addr:D.pat(v.pid).addr,dist:v.dist}))].map((l,i)=>`<div><span class="hv-n${i?'':' c'}">${i?i:'C'}</span><span>${esc(l.addr)}</span>${l.dist?`<span class="muted">${l.dist}</span>`:''}</div>`).join('')}</div>`+driverBlock(rday[1]):'<div class="empty">No route for this day.</div>',{cls:'s1',right:range==='week'?`<div class="seg" role="tablist" id="rSeg"><button role="tab" aria-selected="${rday[1]===2}" data-d="2">Wed</button><button role="tab" aria-selected="${rday[1]===4}" data-d="4">Fri</button></div>`:''})+
    `</div>`,
    bind(root){ root.addEventListener('click',e=>{
      const repick=()=>{ document.getElementById('spPop').innerHTML=App.pickerBody(root); };
      const pmo=e.target.closest('#spPop [data-pmode]'); if(pmo){ e.stopPropagation(); root.pmode=pmo.dataset.pmode; repick(); return; }
      const pmn=e.target.closest('#spPop [data-pm]'); if(pmn){ e.stopPropagation(); root.pm=+pmn.dataset.pm; repick(); return; }
      const pd=e.target.closest('#spPop [data-day]'); if(pd){ root.range='day'; root.pmode='day'; root.dabs=+pd.dataset.day; root.pm=null; App.render(); return; }
      const pw=e.target.closest('#spPop [data-wk]'); if(pw){ root.range='week'; root.pmode='week'; root.wk=+pw.dataset.wk; root.pm=null; App.render(); return; }
      const vm=e.target.closest('#vSeg [data-m]'); if(vm){ root.mode=vm.dataset.m; App.render(); return; }
      const tb=e.target.closest('#stTabs [data-st]'); if(tb){ root.tab=tb.dataset.st; App.render(); return; }
      const d=e.target.closest('#rSeg [data-d]'); if(d){ root.rday=+d.dataset.d; App.render(); return; }
      const cl=e.target.closest('[data-call-p]'); if(cl){ e.stopPropagation(); const p=D.pat(cl.dataset.callP); UI.toast(`Calling ${p.name} · +1 555 01${String(p.age).padStart(2,'0')}`); return; }
      const hd=e.target.closest('[data-hvdone]'); if(hd){ e.stopPropagation(); const v=D.HOMEVISITS.find(x=>x.id===hd.dataset.hvdone), p=D.pat(v.pid); App.confirm({title:'Complete this home visit?',text:`${esc(p.name)} · ${hm(v.s)} · ${esc(p.addr)}`,ok:'Complete Visit',onOk:()=>{ v.st='done'; v.note=v.note||'Visit note filed.'; App.render(); UI.toast(`Home visit with ${p.name} marked completed`); }}); return; }
      const rr=e.target.closest('[data-rxrow]'); if(rr){ e.stopPropagation(); App.prescribe(D.pat(rr.dataset.rxrow),{onDone:()=>App.render()}); return; }
      const mo=e.target.closest('[data-more]'); if(mo){ e.stopPropagation(); App.rowMenu(mo); return; }
      const h=e.target.closest('[data-hv]'); if(h){ App.hvDrawer(h.dataset.hv); return; }
      if(e.target.closest('#hvNew')) newHomeVisit(); }); }
  };
};
App.hvDrawer=id=>{
  const v=D.HOMEVISITS.find(x=>x.id===id), p=D.pat(v.pid), pt=App.patientTabs(p,'h-'), done=v.st==='done';
  App.drawer({eyebrow:`${p.mrn} · ${p.age} · ${p.sex} · born ${esc(p.dob)}`,title:p.name,wide:true,body:`
    <div class="pv-facts">${p.allergies.length?`<span class="st bad">${ic('alert')}Allergies: ${p.allergies.map(esc).join(', ')}</span>`:`<span class="st muted">No known allergies</span>`}</div>
    ${card('Home Visit',`${D.dayLabel(v.w,v.day)} · ${hm(v.s)} – ${hm(v.e)}`,`<dl class="dl"><dt>Status</dt><dd>${done?st('ok','Completed'):st('muted','Scheduled')}</dd><dt>Address</dt><dd>${esc(p.addr)} · ${v.dist} from clinic</dd><dt>Reason</dt><dd>${esc(v.reason)}</dd>${v.note?`<dt>${done?'Visit note':'Notes'}</dt><dd>${esc(v.note)}</dd>`:''}</dl>`)}
    ${pt.tabs}${pt.panels}
    <div class="demo-note">${ic('lock')}Opening this record was logged for audit · demo data, names are fictional.</div>`,
    foot:(isDoc()?`<button class="btn btn-secondary" id="hvRx">${ic('pill')}Prescribe</button>`:'')+`<button class="btn btn-secondary" data-stub>${ic('phone')}Call Patient</button><span style="flex:1"></span>`+(done?'':`<button class="btn btn-primary" id="hvDone">Complete Visit</button>`)});
  const b=$('#hvRx'); if(b) b.onclick=()=>App.prescribe(p,{onBack:()=>App.hvDrawer(id),onDone:()=>App.hvDrawer(id)});
  const c=$('#hvDone'); if(c) c.onclick=()=>App.confirm({title:'Complete this home visit?',text:`${esc(p.name)} · ${hm(v.s)} · ${esc(p.addr)}`,ok:'Complete Visit',onOk:()=>{ v.st='done'; v.note=v.note||'Visit note filed.'; App.closeDrawer(); App.render(); UI.toast(`Home visit with ${p.name} marked completed`); }});
};
function newHomeVisit(){
  const H=panel().filter(p=>p.homebound||p.age>=75), FM=D.DOCTORS.filter(d=>d.spec==='Family Medicine');
  const days=[[0,2],[0,4],[1,2],[1,4]], times=[9,10.5,13,14.5,15.25];
  App.drawer({eyebrow:'Home visit',title:'Schedule Home Visit',body:`<div class="form">
    <div class="field"><label>Patient</label><select class="input req" id="nhP"><option value="" disabled selected>Select a patient</option>${H.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.age}${p.addr?' · '+esc(p.addr):''}</option>`).join('')}</select><span class="help">Homebound patients and patients aged 75+.</span></div>
    <div class="field"><label>Doctor</label><select class="input req" id="nhDoc"><option value="" disabled selected>Select a doctor</option>${FM.map(d=>`<option value="${d.id}">${esc(d.name)}${d.id===ME?' (you)':''}</option>`).join('')}</select><span class="help">Assign the visit to yourself or another family physician.</span></div>
    <div class="f2 even"><div class="field"><label>Day</label><select class="input req" id="nhD"><option value="" disabled selected>Select a day</option>${days.map(([w,d])=>`<option value="${w}_${d}">${D.dayLabel(w,d,true)}</option>`).join('')}</select></div><div class="field"><label>Time</label><select class="input req" id="nhT"><option value="" disabled selected>Select a time</option>${times.map(t=>`<option value="${t}">${hm(t)}</option>`).join('')}</select></div></div>
    <div class="field"><label>Reason</label><input class="input" id="nhR" placeholder="e.g. Medication review"></div></div>`,
    foot:`<button class="btn btn-secondary" data-close>Cancel</button><span style="flex:1"></span><button class="btn btn-primary" id="nhOk" disabled data-tip="Choose a patient, doctor, day and time">Schedule Visit</button>`});
  const ok=$('#nhOk'), sync=()=>{ const miss=['#nhP','#nhDoc','#nhD','#nhT'].filter(s=>!$(s).value).length; ok.disabled=!!miss; miss?ok.setAttribute('data-tip','Choose a patient, doctor, day and time'):ok.removeAttribute('data-tip'); };
  $('#dBody').addEventListener('change',sync);
  ok.onclick=()=>{ const p=D.pat($('#nhP').value), doc=$('#nhDoc').value, [w,day]=$('#nhD').value.split('_').map(Number), s=+$('#nhT').value; if(!p.addr) p.addr='Address on file';
    const known=D.HOMEVISITS.find(v=>v.pid===p.id&&v.dist!=='—');
    D.HOMEVISITS.push({id:'hv'+(D.HOMEVISITS.length+1),pid:p.id,doc,w,day,s,e:s+.75,reason:$('#nhR').value.trim()||'Home visit',dist:known?known.dist:'2.0 mi',note:'',xy:known?known.xy:[40,60],st:'sched'});
    D.HOMEVISITS.sort((a,b)=>(a.w*7+a.day)-(b.w*7+b.day)||a.s-b.s); App.closeDrawer(); App.render();
    UI.toast(doc===ME?`Home visit booked · ${D.dayLabel(w,day)} ${hm(s)}`:`Home visit assigned to ${D.doc(doc).name} · ${D.dayLabel(w,day)} ${hm(s)}`); };
}

/* =================== PRESCRIPTIONS (physician) =================== */
const RXK={'Sent':'confirm','Ready for Pickup':'ok','Picked Up':'muted','Refill Requested':'warn','Refill Approved':'ok','Cancelled':'muted'};
views.prescriptions=(a,root)=>{
  const f=root.f||'all';
  if(!root.range){ root.range='week'; root.pmode='week'; }
  const range=root.range, W=root.wk||0, dAbs=root.dabs??1, dW=Math.floor(dAbs/7), dD=((dAbs%7)+7)%7;
  const days=range==='day'?[[dW,dD]]:[0,1,2,3,4].map(i=>[W,i]); days.forEach(([w])=>D.ensureWeek(w));
  const keys=days.map(([w,d])=>D.dayKey(w,d)), R=D.ORX.filter(r=>keys.includes(r.date));
  const fieldLabel=range==='day'?(dAbs===1?'Today · Tue 29 Sep':D.dayLabel(dW,dD)):(W===0?'This week · '+D.weekRange(W).replace(' 2026',''):D.weekRange(W).replace(' 2026',''));
  const field=`<div class="menu-wrap"><button class="head-sel" data-menu="#spPop" aria-expanded="false">${ic('cal')}${esc(fieldLabel)}${ic('chev')}</button><div class="pop right dp cal-pick" id="spPop">${App.pickerBody(root)}</div></div>`;
  const match=r=>f==='all'||(f==='refill'&&r.status==='Refill Requested')||(f==='active'&&['Sent','Ready for Pickup','Refill Approved'].includes(r.status))||(f==='done'&&r.status==='Picked Up');
  const sept=R.filter(r=>/Sep/.test(r.date)), saved=sept.reduce((t,r)=>t+r.price.saved,0), listSum=sept.reduce((t,r)=>t+r.price.list,0);
  const tag=s=>/Generic/.test(s)?'Generic':/coupon/.test(s)?'Coupon':/discount/.test(s)?'Discount −30%':/covers/.test(s)?s.replace(/ covers.*/,''):s;
  const hit=r=>{ const q=(root.q||'').trim().toLowerCase(); if(!q) return true; const p=D.pat(r.pid); return (p.name+' '+r.f.drug+' '+r.f.cls+' '+r.id+' '+r.price.plan+' '+r.status).toLowerCase().includes(q); };
  const rowsOf=()=>R.filter(r=>match(r)&&hit(r)).map(r=>{ const p=D.pat(r.pid), pr=r.price;
    return `<div class="t-row click${r.fresh?' fresh':''}" data-rx="${r.id}"><span class="num muted">${r.date}</span><span class="pcell">${avatar(p.name)}<span class="cell"><b>${esc(p.name)}</b>${p.age} · ${p.sex}</span></span><span class="cell"><b>${esc(r.f.drug)} ${esc(r.f.dose)}</b>${esc(r.f.freq)} · qty ${r.qty}</span><span class="cell"><b>${esc(pr.plan)}</b></span><span class="tags"><span class="sr">Saves ${pr.pct}% off the list price with ${pr.steps.map(([s])=>/covers/.test(s)?'insurance':s.toLowerCase()).join(' and ')}</span><span aria-hidden="true" class="save">−${pr.pct}%</span>${pr.steps.filter(([s])=>!/covers/.test(s)).map(([s])=>`<span aria-hidden="true" class="tag sv">${esc(tag(s))}</span>`).join('')}${pr.steps.some(([s])=>/covers/.test(s))?'<span aria-hidden="true" class="tag sv">Insurance</span>':''}</span><span class="price"><s>${money(pr.list)}</s><b>${money(pr.pays)}</b></span>${st(RXK[r.status],r.status)}<span class="act">${r.status==='Refill Requested'?`<button class="btn btn-weak btn-sm" data-ok="${r.id}">Approve</button>`:''}</span></div>`; }); 

  const body=()=>(root.rv||'list')==='cards'?rxCards(R.filter(r=>match(r)&&hit(r))):`<section class="card flush">${table('64px minmax(0,1fr) minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.2fr) 100px 150px 90px',['Date','Patient','Medication','Coverage','Savings Applied','Patient Pays','Status',''],rowsOf(),{empty:'No prescriptions here.'})}</section>`;
  root.rxBody=body; /* the search handler is bound once, so it always calls the latest renderer */
  const tabs=[['all','All'],['refill','Refill Requests'],['active','Active'],['done','Picked Up']];
  const n=k=>R.filter(r=>k==='all'||(k==='refill'&&r.status==='Refill Requested')||(k==='active'&&['Sent','Ready for Pickup','Refill Approved'].includes(r.status))||(k==='done'&&r.status==='Picked Up')).length;
  return {
    title:'Prescriptions', meta:[],
    actions:field+`<button class="btn btn-secondary" data-stub>${ic('dl')}Export</button><button class="btn btn-primary" id="rxNew">${ic('plus')}New Prescription</button>`,
    html:
    `<div class="toolbar"><div class="seg st-tabs">${tabs.map(([k,l])=>`<button class="chip" data-filter="${k}" aria-pressed="${k===f}">${l} <span class="n">${n(k)}</span></button>`).join('')}</div><div class="tb-right"><input class="input tb-search" id="rxSearch2" placeholder="Search by patient, medication or Rx number…" value="${attr(root.q||'')}"><div class="seg" role="tablist" id="rvSeg"><button role="tab" aria-selected="${(root.rv||'list')==='list'}" data-rv="list"><svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>List</button><button role="tab" aria-selected="${root.rv==='cards'}" data-rv="cards"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Cards</button></div></div></div>`+
    `<div id="rxWrap">${body()}</div>`,
    bind(root){
      root.addEventListener('filter',e=>{ root.f=e.detail; App.render(); });
      root.addEventListener('input',e=>{ if(e.target.id!=='rxSearch2') return; root.q=e.target.value; $('#rxWrap',root).innerHTML=root.rxBody(); });
      root.addEventListener('click',e=>{
        const repick=()=>{ document.getElementById('spPop').innerHTML=App.pickerBody(root); };
        const pmo=e.target.closest('#spPop [data-pmode]'); if(pmo){ e.stopPropagation(); root.pmode=pmo.dataset.pmode; repick(); return; }
        const pmn=e.target.closest('#spPop [data-pm]'); if(pmn){ e.stopPropagation(); root.pm=+pmn.dataset.pm; repick(); return; }
        const pd=e.target.closest('#spPop [data-day]'); if(pd){ root.range='day'; root.pmode='day'; root.dabs=+pd.dataset.day; root.pm=null; App.render(); return; }
        const pw=e.target.closest('#spPop [data-wk]'); if(pw){ root.range='week'; root.pmode='week'; root.wk=+pw.dataset.wk; root.pm=null; App.render(); return; }
        const rv=e.target.closest('#rvSeg [data-rv]'); if(rv){ root.rv=rv.dataset.rv; App.render(); return; }
        const ok=e.target.closest('[data-ok]'); if(ok){ e.stopPropagation(); approve(ok.dataset.ok); return; }
        const r=e.target.closest('[data-rx]'); if(r){ rxDrawer(r.dataset.rx); return; }
        if(e.target.closest('#rxNew')) App.prescribe(null,{onDone:()=>App.render()}); });
    }
  };
};
function rxCards(L){
  const tag=s=>/Generic/.test(s)?'Generic':/coupon/.test(s)?'Coupon':/discount/.test(s)?'Discount −30%':/covers/.test(s)?'Insurance':s;
  return L.length?`<div class="pgrid">${L.map(r=>{ const p=D.pat(r.pid), pr=r.price; return `<div class="pcard rxc" data-rx="${r.id}" role="button" tabindex="0">
    <div class="pc-top">${avatar(p.name,'lg')}<span class="cell"><b>${esc(p.name)}</b>${p.age} · ${p.sex} · ${r.date}</span><span class="pc-status">${st(RXK[r.status],r.status)}</span></div>
    <div class="rxc-m"><b>${esc(r.f.drug)} ${esc(r.f.dose)}</b><span>${esc(r.f.freq)} · qty ${r.qty}</span></div>
    <div class="tags"><span class="sr">Saves ${pr.pct}% off the list price</span><span aria-hidden="true" class="save">−${pr.pct}%</span>${pr.steps.map(([s])=>`<span aria-hidden="true" class="tag sv">${esc(tag(s))}</span>`).join('')}</div>
    <div class="rxc-f"><span class="cell"><b>${esc(pr.plan)}</b>Coverage</span><span class="price"><s>$${pr.list.toFixed(2)}</s><b>$${pr.pays.toFixed(2)}</b></span></div>
    ${r.status==='Refill Requested'?`<button class="btn btn-weak btn-sm" data-ok="${r.id}">Approve Refill</button>`:''}</div>`; }).join('')}</div>`:`<div class="empty">No prescriptions here.</div>`;
}
function approve(id){ const r=D.ORX.find(x=>x.id===id); r.status='Refill Approved'; r.refills=2; App.closeDrawer(); App.render(); UI.toast(`Refill approved · ${r.f.drug} sent to Westside Pharmacy for ${D.pat(r.pid).name}`); }
function rxDrawer(id){
  const r=D.ORX.find(x=>x.id===id), p=D.pat(r.pid), pr=r.price;
  const hist=[['Sent to pharmacy',r.date+' · 9:14 AM',1],['Ready for pickup',r.date+' · 11:02 AM',['Ready for Pickup','Picked Up','Refill Requested','Refill Approved'].includes(r.status)],['Picked up',r.date+' · 4:35 PM',['Picked Up','Refill Requested','Refill Approved'].includes(r.status)],['Refill requested','Today · 8:05 AM',r.status==='Refill Requested'||r.status==='Refill Approved']].filter(h=>h[2]);
  App.drawer({eyebrow:`${r.id} · issued ${r.date} by Dr. Elena Marsh`,title:`${r.f.drug} ${r.f.dose}`,wide:true,body:`
    ${card('','',`<div class="pcell">${avatar(p.name)}<span class="cell"><b>${esc(p.name)}</b>${p.mrn} · ${p.age} · ${p.sex}${p.allergies.length?` · <span style="color:var(--bad)">allergies: ${esc(p.allergies.join(', '))}</span>`:''}</span><span style="flex:1"></span>${st(RXK[r.status],r.status)}</div>`)}
    ${card('Prescription','',`<dl class="dl"><dt>Medication</dt><dd>${esc(r.f.drug)} · ${esc(r.f.cls)}</dd><dt>Dose</dt><dd>${esc(r.f.dose)} · ${r.f.route}</dd><dt>Frequency</dt><dd>${esc(r.f.freq)}</dd><dt>Quantity</dt><dd>${r.qty} · ${r.f.days} days</dd><dt>Refills left</dt><dd>${r.refills}</dd><dt>Pharmacy</dt><dd>Westside Pharmacy · 0.8 mi</dd>${r.f.note?`<dt>Instructions</dt><dd>${esc(r.f.note)}</dd>`:''}</dl>`)}
    ${card('Price for the Patient',pr.plan,`<div class="rx-price"><div><span class="muted">List price</span><s>${money(pr.list)}</s></div>${pr.steps.map(([l,v])=>`<div><span class="muted">${esc(l)}</span><span class="ok">−${money(v)}</span></div>`).join('')}<div class="tot"><span>Patient pays</span><b>${money(pr.pays)}</b></div><div class="muted" style="font-size:12px">Saves ${money(pr.saved)} · ${pr.pct}% off the list price</div></div>`)}
    ${card('History','',`<div class="tline">${hist.map(([t,d])=>`<div class="ti"><span class="tdot ok"></span><div><div class="tm">${d}</div><div class="tx">${t}</div></div></div>`).join('')}</div>`)}`,
    foot:`<button class="btn btn-secondary btn-danger" data-stub>Cancel Prescription</button><span style="flex:1"></span><button class="btn btn-secondary" id="rxPrintD">Print</button><button class="btn btn-secondary" id="rxRenew">Renew</button>`+(r.status==='Refill Requested'?`<button class="btn btn-primary" id="rxOk">Approve Refill</button>`:'')});
  const ok=$('#rxOk'); if(ok) ok.onclick=()=>approve(id);
  $('#rxRenew').onclick=()=>App.prescribe(p,{onBack:()=>rxDrawer(id),onDone:()=>App.render()});
  $('#rxPrintD').onclick=()=>App.printRx({id:r.id,patient:p,doctor:'Dr. Elena Marsh',date:r.date+' 2026',drug:r.f.drug,dose:r.f.dose,route:r.f.route,freq:r.f.freq,days:r.f.days+' days',refills:r.refills,pharmacy:'Westside Pharmacy',note:r.f.note});
}
})();
