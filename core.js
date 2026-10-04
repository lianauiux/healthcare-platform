/* Core: helpers, role switching, facility switcher, router, drawer. Views register into App.views. */
window.App=(function(){
const {esc,attr}=V;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

const P={
  up:'<path d="M12 19V5M6 11l6-6 6 6"/>', down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
  ok:'<path d="M5 12l5 5 9-10"/>', warn:'<path d="M12 3.5l10 17.5H2z"/><path d="M12 10v4.5M12 17.5h.01"/>',
  bad:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>', go:'<path d="M9 6l6 6-6 6"/>', back:'<path d="M15 6l-6 6 6 6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', chev:'<path d="M6 9l6 6 6-6"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', bld:'<path d="M3 21h18M5 21V8l7-5 7 5v13"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', dl:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', plus:'<path d="M12 5v14M5 12h14"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>', dot:'<circle cx="12" cy="12" r="3"/>',
  pill:'<path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6M9 13h6M9 17h4"/>', doc:'<path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6M9 13h6M9 17h4"/>',
  scan:'<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10"/>', pause:'<path d="M9 5v14M15 5v14"/>',
  bed:'<path d="M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="1.6"/>', swap:'<path d="M7 7h13l-4-4M17 17H4l4 4"/>', home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  flask:'<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>', img:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  shield:'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>', lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', edit:'<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', alert:'<path d="M12 3.5l10 17.5H2z"/><path d="M12 10v4.5M12 17.5h.01"/>'
};
const ic=(k,c='')=>`<svg viewBox="0 0 24 24" class="${c}">${P[k]||''}</svg>`;
const st=(kind,label)=>`<span class="st ${kind}">${ic(kind==='muted'||kind==='confirm'||kind==='accent'?'dot':kind)}${esc(label)}</span>`;
const sicon=(kind,tip)=>`<span class="sicon ${kind}" data-tip="${attr(tip)}">${ic(kind)}</span>`;
const N=n=>Math.round(n).toLocaleString('en-US');
const pct=(n,d=0)=>(n*100).toFixed(d)+'%';
function rng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function walk(seed,n,start,drift,vol){ const r=rng(seed); let v=start; return Array.from({length:n},(_,i)=>{ if(i) v+=drift+(r()-.5)*vol; return +v.toFixed(2); }); }
const hm=h=>{ h=((h%24)+24)%24; const H=Math.floor(h+1e-6), m=Math.round((h-H)*60); return `${H%12||12}:${String(m).padStart(2,'0')} ${H<12||H===24?'AM':'PM'}`; };
const mins=m=>m<60?Math.round(m)+' min':Math.floor(m/60)+'h '+String(Math.round(m%60)).padStart(2,'0')+'m';
function delta(txt,good){ const k=good==null?'flat':good?'good':'bad'; const dir=/^[-−]/.test(txt.trim())?'down':'up'; return `<span class="delta ${k}">${good==null?'':ic(dir)}${esc(txt.replace('-','−'))}</span>`; }
function tile(o){
  const tag=o.filter!=null?`button class="tile is-filter${o.cls?' '+o.cls:''}" data-f="${o.filter}" aria-pressed="${!!o.on}"`:o.href?`a href="${o.href}" class="tile is-link${o.cls?' '+o.cls:''}"`:`div class="tile${o.cls?' '+o.cls:''}"`;
  return `<${tag}><span class="l">${esc(o.l)}</span><span class="top"><span class="v">${esc(o.v)}</span>${o.spark?V.spark(o.spark,{color:o.sc||'var(--s1)'}):''}</span><span class="foot">${o.d?delta(o.d,o.good):''}${o.s?`<span>${esc(o.s)}</span>`:''}</span></${tag.split(' ')[0]}>`;
}
const tiles=(arr,cls='')=>`<div class="tiles ${cls}">${arr.map(tile).join('')}</div>`;
function card(title,sub,body,o={}){ return `<section class="card${o.cls?' '+o.cls:''}"${o.id?` id="${o.id}"`:''}>${title?`<div class="card-h"><div class="ttl"><h2>${esc(title)}</h2>${sub?`<div class="sub">${esc(sub)}</div>`:''}</div>${o.right||''}</div>`:''}${body}</section>`; }
const box=(id,h)=>`<div class="viz-box" id="${id}" style="min-height:${h||220}px"></div>`;
function hbars(rows,o={}){
  const max=o.max||Math.max(...rows.map(r=>r.v),...rows.map(r=>r.t||0));
  return `<div class="hb" style="--lw:${o.lw||150}px;--vw:${o.vw||64}px">`+rows.map(r=>`<span class="l">${esc(r.l)}${r.sub?`<small>${esc(r.sub)}</small>`:''}</span><span class="trk${o.bg?' bg':''}" data-t="${attr(`<b>${esc(r.l)}</b>`+(r.tip||`<div class="tr"><span>Value</span><em>${esc(o.fmt?o.fmt(r.v):r.v)}</em></div>`))}"><span class="fill" style="width:${Math.max(.5,r.v/max*100)}%;--c:${r.c||o.c||'var(--s1)'}"></span>${r.t!=null?`<span class="tgt" style="left:${r.t/max*100}%"></span>`:''}</span><span class="val">${esc(o.fmt?o.fmt(r.v):r.v)}${r.vs?`<small>${esc(r.vs)}</small>`:''}</span>`).join('')+`</div>`;
}
function mini(v,max,{c,t,label}={}){ return `<span class="mini"><span class="trk"><span class="fill" style="width:${Math.min(100,v/max*100)}%;--c:${c||'var(--s1)'}"></span>${t!=null?`<span class="tgt" style="left:${t/max*100}%"></span>`:''}</span><span class="num">${esc(label??v)}</span></span>`; }
function table(cols,head,rows,o={}){ return `<div class="table" style="--cols:${cols}"><div class="t-head">${head.map(h=>`<span>${esc(h)}</span>`).join('')}</div>${rows.length?rows.join(''):`<div class="empty">${esc(o.empty||'Nothing here yet.')}</div>`}</div>`; }
/* Illustrated avatar drawn from the name (DiceBear); falls back to initials if it can't load */
const avatar=(name,cls='')=>{ const ini=name.replace(/^Dr\.\s*/,'').split(/[\s,]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join(''); const seed=encodeURIComponent(name.replace(/,.*$/,''));
  return `<span class="av ${cls}"><span class="av-i">${esc(ini)}</span><img src="https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=dbeafe,e0e7ff,fce7f3,fef3c7,dcfce7,ede9fe&backgroundType=solid" alt="" loading="lazy" onerror="this.remove()"></span>`; };
const legend=V.legend;

/* ---------- state ---------- */
const S={ role:'physician', fac:'CGH' };
try{ const s=JSON.parse(localStorage.getItem('hcp.state')||'{}'); Object.assign(S,s); }catch(e){}
const save=()=>{ try{ localStorage.setItem('hcp.state',JSON.stringify({role:S.role,fac:S.fac})); }catch(e){} };
const role=()=>D.ROLES.find(r=>r.id===S.role)||D.ROLES[0];
const fac=()=>D.FACILITIES.find(f=>f.id===S.fac)||D.FACILITIES[0];
const can=m=>role().mods.includes(m);

/* ---------- drawer ---------- */
function drawer({eyebrow='',title='',body='',foot='',wide=false}){
  $('#dEyebrow').innerHTML=eyebrow; $('#dTitle').textContent=title; $('#dBody').innerHTML=body; $('#dFoot').innerHTML=foot;
  $('#drawer').classList.toggle('wide',wide); $('#dFoot').hidden=!foot; UI.drawer('#drawer',true); return $('#drawer');
}
const closeDrawer=()=>UI.drawer('#drawer',false);

/* ---------- chrome ---------- */
function renderChrome(){
  const r=role(), f=fac();
  document.body.dataset.as=r.id;
  $('#uPic').textContent=r.ini; $('#uName').textContent=r.user; $('#uRole').textContent=r.title;
  $('#roleList').innerHTML=D.ROLES.map(x=>`<button class="it" role="menuitemradio" data-role="${x.id}" aria-checked="${x.id===r.id}"><span class="mk alt">${x.ini}</span><span style="flex:1;min-width:0"><span style="display:block">${esc(x.label)}</span><span style="display:block;font-size:11.5px;color:var(--ink-3)">${esc(x.user)}</span></span>${x.id===r.id?'<svg class="chk" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>':''}</button>`).join('');
  $('#brandName').textContent=f.name;
  $('#facList').innerHTML=D.FACILITIES.map(x=>`<button class="it" role="menuitem" data-fac="${x.id}"><span class="mk${x.id===f.id?'':' alt'}">${x.mk}</span>${esc(x.name)}${x.id===f.id?'<svg class="chk" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>':''}</button>`).join('');
  $$('.nav a[data-route]').forEach(a=>{ a.hidden=!can(a.dataset.route); });
  const top=$('.nav-top'), links=$$('.nav-top a[data-route]');
  if(!top.dataset.base) top.dataset.base=links.map(a=>a.dataset.route).join(',');
  const order=r.nav||top.dataset.base.split(',');
  [...order,...top.dataset.base.split(',').filter(k=>!order.includes(k))].forEach(k=>{ const a=top.querySelector(`a[data-route="${k}"]`); if(a) top.appendChild(a); });
  const dash=top.querySelector('a[data-route="dashboard"]'); if(dash){ if(!dash.dataset.icon0) dash.dataset.icon0=dash.querySelector('svg').outerHTML;
    const lbl=(r.labels||{}).dashboard||'Dashboard'; dash.innerHTML=(lbl==='Analytics'?'<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>':dash.dataset.icon0)+lbl; }
  $$('.nav-group[data-sec]').forEach(g=>{ g.hidden=!$$('a[data-route]',g).some(a=>!a.hidden); });
  const waiting=D.APPTS.filter(a=>a.st==='waiting'||a.st==='checkedin').length;
  $('#bdgWait').textContent=waiting||''; $('#bdgAdm').textContent=D.ADMISSIONS.filter(a=>a.stage==='bed'||a.stage==='pending').length||'';
  $('#bdgDx').textContent=D.ORDERS.filter(o=>o.flag==='crit'&&!o.ack).length||''; $('#bdgMed').textContent=App.dueCount?App.dueCount()||'':'';
  const rxb=document.getElementById('bdgRx'); if(rxb) rxb.textContent=(D.ORX||[]).filter(r=>r.status==='Refill Requested').length||'';
  $('#bdgDx').classList.toggle('hot',!!D.ORDERS.filter(o=>o.flag==='crit'&&!o.ack).length);
}
document.addEventListener('click',e=>{
  const r=e.target.closest('#roleList [data-role]'); if(r){ S.role=r.dataset.role; save(); $('#rolePop').classList.remove('on'); renderChrome(); if(!can(route().name)) location.hash='#/dashboard'; else render(); UI.toast(`Viewing as ${role().label} · ${role().user}`); return; }
  const f=e.target.closest('[data-fac]'); if(f){ S.fac=f.dataset.fac; save(); $('#brandPop').classList.remove('on'); renderChrome(); render(); UI.toast(`Switched to ${fac().name}`); return; }
});

/* ---------- router ---------- */
const views={};
let current=null, curView=null, curKey=null;
function route(){ const parts=(location.hash.replace(/^#\/?/,'')||role().home||'dashboard').split('/'); return {name:parts[0],arg:parts[1]}; }
function render(){
  const r=route(); let name=r.name;
  const MOD={patient:'patients',visit:'appointments'};
  if(!views[name]||!can(MOD[name]||name)){ if(location.hash!=='#/dashboard'){ location.hash='#/dashboard'; return; } name='dashboard'; }
  const key=name+'/'+(r.arg||'')+'/'+S.role+'/'+S.fac;
  if(!current||curKey!==key){ const fresh=document.createElement('div'); fresh.id='view'; fresh.className='view'; (current||$('#view')).replaceWith(fresh); current=fresh; if(curKey&&curKey.split('/')[0]!==name) window.scrollTo(0,0); }
  curKey=key; curView=views[name](r.arg,current);
  const v=curView;
  current.innerHTML=`<div class="page-head"><div class="row1">${v.back?`<a class="back" href="${v.back}" aria-label="Back">${ic('back')}</a>`:''}<h1>${esc(v.title)}</h1><div class="actions">${v.actions||''}</div></div>
    <div class="metaline"${v.back?'':' style="padding-left:0"'}>${(v.meta||[]).map(([i,t,k])=>`<span class="fact${k?' '+k:''}">${ic(i)}${esc(t)}</span>`).join('')}</div></div>
    <div class="page-body${v.bodyCls?' '+v.bodyCls:''}">${v.html}</div>`;
  document.title=v.title+' · Corvina Health';
  const nav=MOD[name]||name;
  $$('.nav a[data-route]').forEach(a=>{ a.dataset.route===nav?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'); });
  $$('.nav-group[data-sec]').forEach(g=>{ const has=!!g.querySelector('[aria-current]'); g.classList.toggle('has-current',has); if(has) g.querySelector('.nav-h').setAttribute('aria-expanded','true'); });
  renderChrome();
  if(v.draw) v.draw(current);
  if(v.bind&&!current.bound){ current.bound=true; v.bind(current); }
}
window.addEventListener('hashchange',render);
let rt; window.addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{ if(curView&&curView.draw) curView.draw(current); },120); });

/* theme */
function applyTheme(t){ if(t) document.documentElement.setAttribute('data-theme',t); else document.documentElement.removeAttribute('data-theme'); }
/* the theme switch was removed: drop any saved choice and follow the system setting */
try{ localStorage.removeItem('hcp.theme'); }catch(e){}
document.addEventListener('click',e=>{ if(!e.target.closest('#themeBtn')) return; const d=document.documentElement.getAttribute('data-theme'); const dark=d==='dark'||(!d&&matchMedia('(prefers-color-scheme: dark)').matches); const t=dark?'light':'dark'; applyTheme(t); try{ localStorage.setItem('hcp.theme',t); }catch(e){} if(curView&&curView.draw) curView.draw(current); });

/* Printable prescription: built into a hidden frame and sent to the browser print dialog */
/* confirmation dialog: sits above drawers, Esc or Cancel closes, focus starts on the confirm button */
function confirmBox({title,text,ok='Confirm',onOk}){
  document.getElementById('cfm')?.remove();
  const w=document.createElement('div'); w.id='cfm'; w.className='cfm-wrap';
  w.innerHTML=`<div class="cfm" role="alertdialog" aria-modal="true" aria-labelledby="cfmT" aria-describedby="cfmX"><h3 id="cfmT">${title}</h3><p id="cfmX">${text}</p><div class="cfm-f"><button class="btn btn-secondary" data-c="no">Cancel</button><button class="btn btn-primary" data-c="yes">${ok}</button></div></div>`;
  const back=document.activeElement, close=()=>{ w.remove(); document.removeEventListener('keydown',key,true); back&&back.focus&&back.focus(); };
  const key=e=>{ if(e.key==='Escape'){ e.stopPropagation(); close(); } if(e.key==='Tab'){ const b=[...w.querySelectorAll('button')], i=b.indexOf(document.activeElement); e.preventDefault(); b[(i+(e.shiftKey?-1:1)+b.length)%b.length].focus(); } };
  w.addEventListener('click',e=>{ const b=e.target.closest('[data-c]'); if(e.target===w||b&&b.dataset.c==='no') close(); else if(b){ close(); onOk&&onOk(); } });
  document.addEventListener('keydown',key,true); document.body.appendChild(w); w.querySelector('[data-c="yes"]').focus();
}
function printRx(r){
  const e=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Prescription · ${e(r.patient.name)}</title><style>
    body{font:13px/1.5 -apple-system,system-ui,sans-serif;color:#18181b;margin:32px}
    .hd{display:flex;justify-content:space-between;border-bottom:2px solid #18181b;padding-bottom:12px;margin-bottom:18px}
    h1{font-size:18px;margin:0}.muted{color:#66666f}.grid{display:grid;grid-template-columns:120px 1fr;gap:6px 16px;margin:14px 0}
    .rx{font-size:40px;font-weight:700;font-family:Georgia,serif;margin:10px 0 0}.drug{font-size:17px;font-weight:600;margin:4px 0 2px}
    .sig{margin-top:56px;display:flex;justify-content:space-between;align-items:flex-end}.line{border-top:1px solid #18181b;width:260px;padding-top:4px}
    .demo{margin-top:40px;font-size:11px;color:#66666f;border-top:1px dashed #d4d4d8;padding-top:8px}
  </style></head><body>
    <div class="hd"><div><h1>Corvina General Hospital</h1><div class="muted">Family Medicine Clinic · 1200 Harbor Avenue, Corvina</div></div><div style="text-align:right"><b>${e(r.doctor)}</b><div class="muted">Family Physician · Lic. FM-204518</div></div></div>
    <div class="grid"><span class="muted">Patient</span><b>${e(r.patient.name)}</b><span class="muted">Date of birth</span><span>${e(r.patient.dob)} · ${r.patient.age} · ${r.patient.sex}</span><span class="muted">MRN</span><span>${e(r.patient.mrn)}</span><span class="muted">Allergies</span><span>${e(r.patient.allergies.join(', ')||'None known')}</span><span class="muted">Date</span><span>${e(r.date)}</span></div>
    <div class="rx">℞</div><div class="drug">${e(r.drug)} ${e(r.dose)}</div><div>${e(r.route)} · ${e(r.freq)} · ${e(r.days)}</div>
    <div class="grid"><span class="muted">Refills</span><span>${e(r.refills)}</span><span class="muted">Pharmacy</span><span>${e(r.pharmacy)}</span>${r.note?`<span class="muted">Instructions</span><span>${e(r.note)}</span>`:''}</div>
    <div class="sig"><div class="line">Signature</div><div class="muted">${e(r.id||'Draft')}</div></div>
    <div class="demo">Demo prototype · fictional data · not a valid prescription.</div>
  </body></html>`;
  const fr=document.createElement('iframe'); fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(fr);
  fr.contentDocument.open(); fr.contentDocument.write(html); fr.contentDocument.close();
  setTimeout(()=>{ fr.contentWindow.focus(); fr.contentWindow.print(); setTimeout(()=>fr.remove(),1500); },150);
}
return {confirm:confirmBox,printRx,views,render,renderChrome,start:render,S,role,fac,can,drawer,closeDrawer,
  h:{$,$$,esc,attr,ic,st,sicon,N,pct,rng,walk,hm,mins,delta,tile,tiles,card,box,hbars,mini,table,avatar,legend}};
})();
