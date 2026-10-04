/* Prototype stubs: anything outside the designed flow explains itself instead of doing nothing. */
(function(){
  const STUB_SEL=['a[href="#"]','.topbar .select','.topbar .btn:not(#createBtn)','.topbar .icon-btn:not(.nav-toggle):not(#themeBtn)','.topbar .avatar:not(.role-btn)','.queue button','.sort .select','.doc-foot .btn','.note-add .btn','[data-stub]'].join(',');
  const MSG='Not designed in this prototype — this control is outside the demo flows.';
  let tt;
  function toast(msg){
    const t=document.getElementById('toast'); if(!t) return;
    t.classList.add('show','info'); t.querySelector('#toastMsg').textContent=msg;
    clearTimeout(tt); tt=setTimeout(()=>t.classList.remove('show','info'),3200);
  }
  document.addEventListener('click',e=>{
    const el=e.target.closest(STUB_SEL); if(!el) return;
    if(el.closest('.nav') && el.getAttribute('aria-current')) return; /* current page link */
    e.preventDefault(); e.stopPropagation();
    const label=(el.getAttribute('aria-label')||el.textContent||'').trim().replace(/\s+/g,' ');
    toast(label?`“${label.slice(0,40)}” — ${MSG}`:MSG);
  },true);
})();

/* Collapsible nav sections — the section holding the current page opens by default; state is remembered per viewer. */
(function(){
  let saved={}; try{ saved=JSON.parse(localStorage.getItem('hcp.nav')||'{}'); }catch(e){}
  document.querySelectorAll('.nav-group[data-sec]').forEach(g=>{
    const h=g.querySelector('.nav-h'), key=g.dataset.sec, hasCurrent=!!g.querySelector('[aria-current]');
    if(hasCurrent) g.classList.add('has-current');
    const open=key in saved?saved[key]:hasCurrent;
    h.setAttribute('aria-expanded',open);
    h.addEventListener('click',()=>{ const on=h.getAttribute('aria-expanded')!=='true'; h.setAttribute('aria-expanded',on); saved[key]=on; try{ localStorage.setItem('hcp.nav',JSON.stringify(saved)); }catch(e){} });
  });
})();

/* Sidebar collapse toggle (top bar) — remembered per viewer. */
(function(){
  const b=document.getElementById('navToggle'); if(!b) return;
  let on=false; try{ on=localStorage.getItem('hcp.navCollapsed')==='1'; }catch(e){}
  const apply=()=>{ document.body.classList.toggle('nav-collapsed',on); b.setAttribute('aria-pressed',on); b.setAttribute('aria-label',on?'Expand Sidebar':'Collapse Sidebar'); };
  apply();
  b.addEventListener('click',()=>{ on=!on; apply(); try{ localStorage.setItem('hcp.navCollapsed',on?'1':'0'); }catch(e){} });
})();

/* Global tooltips: every icon-only control (aria-label / title) and any [data-tip] gets the same tooltip. */
(function(){
  const tt=document.createElement('div'); tt.className='tt'; tt.setAttribute('role','tooltip'); document.body.appendChild(tt);
  let cur=null, timer=null;
  function labelOf(el){ return el.getAttribute('data-tip')||el.getAttribute('aria-label')||''; }
  function eligible(el){ if(!el||el===document.body||el===document.documentElement) return null;
    const t=el.closest('[data-tip],[aria-label],[title]'); if(!t||t===document.body) return null;
    if(t.hasAttribute('title')){ if(!t.hasAttribute('data-tip')&&!t.hasAttribute('aria-label')) t.setAttribute('data-tip',t.getAttribute('title')); t.removeAttribute('title'); }
    if(t.matches('nav,aside,article,section,main,input,textarea,[role="tabpanel"],[role="listbox"],[role="dialog"],[role="menu"],.drawer,.side,.article')) return null;
    const hasText=t.textContent.trim().length>0 && !t.matches('.icon-btn,.x,.back,.hb'); if(hasText&&!t.hasAttribute('data-tip')) return null;
    return labelOf(t)?t:null; }
  function show(el){ const l=labelOf(el); if(!l) return; cur=el; tt.textContent=l; tt.classList.add('on');
    const r=el.getBoundingClientRect(), w=tt.offsetWidth, h=tt.offsetHeight; let left=r.left+r.width/2-w/2, top=r.bottom+8;
    if(top+h>window.innerHeight-8) top=r.top-8-h; left=Math.max(8,Math.min(left,window.innerWidth-8-w)); tt.style.left=left+'px'; tt.style.top=top+'px'; }
  function hide(){ cur=null; tt.classList.remove('on'); clearTimeout(timer); }
  document.addEventListener('mouseover',e=>{ const el=eligible(e.target); if(!el){ if(cur&&!cur.contains(e.target)) hide(); return; } if(el===cur) return; clearTimeout(timer); timer=setTimeout(()=>show(el),140); });
  document.addEventListener('mouseout',e=>{ if(cur&&!cur.contains(e.relatedTarget)) hide(); else clearTimeout(timer); });
  document.addEventListener('focusin',e=>{ const el=eligible(e.target); if(el) show(el); });
  document.addEventListener('focusout',hide);
  document.addEventListener('mousedown',hide,true); document.addEventListener('keydown',e=>{ if(e.key==='Escape') hide(); });
  window.addEventListener('scroll',hide,true);
})();

/* =====================================================================
   KIT HELPERS — small, dependency-free behaviours you can rely on
   in any prototype page. All are opt-in via attributes.
   ===================================================================== */
window.UI = (function(){
  /* Toast: UI.toast('Saved') / UI.toast('Not built', {info:true}) */
  let tt; function toast(msg,{info=false}={}){ const t=document.getElementById('toast'); if(!t) return; t.querySelector('#toastMsg').textContent=msg; t.classList.toggle('info',info); t.classList.add('show'); clearTimeout(tt); tt=setTimeout(()=>t.classList.remove('show','info'),2600); }

  /* Menus: <button data-menu="#myPop"> toggles .pop#myPop; closes on outside click / Esc */
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-menu]');
    document.querySelectorAll('.pop.on').forEach(p=>{ if(!p.contains(e.target)&&!(b&&document.querySelector(b.dataset.menu)===p)){ p.classList.remove('on'); const o=document.querySelector(`[data-menu="#${p.id}"]`); o&&o.setAttribute('aria-expanded','false'); } });
    if(!b) return; const p=document.querySelector(b.dataset.menu); if(!p) return; const on=!p.classList.contains('on'); p.classList.toggle('on',on); b.setAttribute('aria-expanded',on);
  });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.pop.on').forEach(p=>p.classList.remove('on')); });

  /* Radio-style menu items: <button class="it" data-pick="value"> inside a .pop[data-picker] → sets aria-checked, writes label into [data-label] target */
  document.addEventListener('click',e=>{ const it=e.target.closest('.pop[data-picker] .it[data-pick]'); if(!it) return; const p=it.closest('.pop'); p.querySelectorAll('.it').forEach(x=>x.setAttribute('aria-checked',x===it)); const lbl=document.querySelector(p.dataset.picker); if(lbl) lbl.textContent=it.textContent.replace(/\s*\d+$/,'').trim(); p.classList.remove('on'); p.dispatchEvent(new CustomEvent('pick',{bubbles:true,detail:it.dataset.pick})); });

  /* Tabs: [role=tablist] > [role=tab][data-tab=x]; panels have id="panel-x" */
  document.addEventListener('click',e=>{ const t=e.target.closest('[role="tab"][data-tab]'); if(!t) return; const list=t.closest('[role="tablist"]'); list.querySelectorAll('[role="tab"]').forEach(x=>x.setAttribute('aria-selected',x===t)); const scope=list.closest('.side')||document; scope.querySelectorAll('[role="tabpanel"]').forEach(p=>p.hidden=p.id!=='panel-'+t.dataset.tab); });

  /* Chips as toggles: .chip[data-filter] siblings behave as a radio group */
  document.addEventListener('click',e=>{ const c=e.target.closest('.chip[data-filter]'); if(!c) return; c.parentElement.querySelectorAll('.chip[data-filter]').forEach(x=>x.setAttribute('aria-pressed',x===c)); c.dispatchEvent(new CustomEvent('filter',{bubbles:true,detail:c.dataset.filter})); });

  /* Checkbox / switch buttons toggle aria-checked */
  document.addEventListener('click',e=>{ const b=e.target.closest('.cb[role="checkbox"],.switch[role="switch"]'); if(!b||b.getAttribute('aria-disabled')==='true') return; b.setAttribute('aria-checked',b.getAttribute('aria-checked')!=='true'); b.dispatchEvent(new CustomEvent('toggle',{bubbles:true,detail:b.getAttribute('aria-checked')==='true'})); });

  /* Drawer: <button data-drawer="#id"> opens .drawer#id (+ .scrim#scrim); [data-close] inside closes */
  function drawer(sel,open=true){ const d=document.querySelector(sel), s=document.getElementById('scrim'); if(!d) return; d.classList.toggle('on',open); s&&s.classList.toggle('on',open); d.setAttribute('aria-hidden',!open); }
  document.addEventListener('click',e=>{ const o=e.target.closest('[data-drawer]'); if(o){ drawer(o.dataset.drawer,true); return; } if(e.target.closest('[data-close]')||e.target.id==='scrim'){ document.querySelectorAll('.drawer.on').forEach(d=>drawer('#'+d.id,false)); } });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.drawer.on').forEach(d=>drawer('#'+d.id,false)); });

  /* Resizable side panel: <div class="resizer" data-resize=".split"> on the panel's left edge */
  document.addEventListener('mousedown',e=>{ const rz=e.target.closest('.resizer'); if(!rz) return; e.preventDefault(); const host=document.querySelector(rz.dataset.resize||'.split'); const move=ev=>{ const w=Math.min(640,Math.max(320,window.innerWidth-ev.clientX)); host.style.setProperty('--side-w',w+'px'); }; const up=()=>{ document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); }; document.addEventListener('mousemove',move); document.addEventListener('mouseup',up); });

  /* Position a fixed floating element relative to a rect: UI.place(el, rect, 'above'|'below') */
  function place(el,r,where='below'){ el.hidden=false; const w=el.offsetWidth,h=el.offsetHeight; let left=r.left+r.width/2-w/2, top=where==='below'?r.bottom+8:r.top-8-h; if(top<8) top=r.bottom+8; if(top+h>innerHeight-8) top=r.top-8-h; left=Math.max(8,Math.min(left,innerWidth-8-w)); el.style.left=left+'px'; el.style.top=top+'px'; }

  return {toast,drawer,place};
})();
