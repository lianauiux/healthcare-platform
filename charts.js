/* Chart helpers — plain SVG/HTML, sized to their container, colours from CSS tokens.
   Every mark carries data-t (tooltip HTML); line/bar charts get a hover band + guide. */
window.V=(function(){
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const attr=s=>esc(s).replace(/'/g,'&#39;');

  function nice(lo,hi,n=4){
    const span=Math.max(hi-lo,1e-9), raw=span/n, p=Math.pow(10,Math.floor(Math.log10(raw))), m=raw/p;
    const step=(m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p;
    const a=Math.floor(lo/step)*step, b=Math.ceil(hi/step)*step, t=[];
    for(let v=a;v<=b+step/2;v+=step) t.push(+v.toFixed(6));
    return {lo:a,hi:b,ticks:t};
  }
  /* bar with only the data-end rounded (4px), anchored to the baseline */
  function barPath(x,y,w,h,r=4,end='top'){
    if(h<=0||w<=0) return '';
    r=Math.min(r,w/2,h);
    if(end==='top') return `M${x},${y+h}V${y+r}Q${x},${y} ${x+r},${y}H${x+w-r}Q${x+w},${y} ${x+w},${y+r}V${y+h}Z`;
    if(end==='right') return `M${x},${y}H${x+w-r}Q${x+w},${y} ${x+w},${y+r}V${y+h-r}Q${x+w},${y+h} ${x+w-r},${y+h}H${x}Z`;
    return `M${x},${y}H${x+w}V${y+h}H${x}Z`;
  }
  function sw(color,dash){ return dash?`<i class="lg-ln dash" style="--c:${color}"></i>`:`<i class="lg-sw" style="--c:${color}"></i>`; }
  function legend(items){ return `<div class="legend">${items.map(i=>`<span>${sw(i.color,i.dash)}${esc(i.name)}</span>`).join('')}</div>`; }
  function tipRows(title,rows){ return `<b>${esc(title)}</b>`+rows.map(r=>`<div class="tr">${r.color?sw(r.color,r.dash):''}<span>${esc(r.name)}</span><em>${esc(r.value)}</em></div>`).join(''); }

  /* ---------- Line chart ---------- */
  function line(el,o){
    const W=Math.max(260,el.clientWidth), H=o.height||220, L=o.left||46, R=o.right||14, T=10, B=26;
    const vals=o.series.flatMap(s=>s.values.filter(v=>v!=null)).concat((o.refs||[]).map(r=>r.value));
    const sc=nice(o.min??Math.min(0,...vals), o.max??Math.max(...vals));
    const n=o.labels.length, X=i=>L+(W-L-R)*(n===1?.5:i/(n-1)), Y=v=>T+(H-T-B)*(1-(v-sc.lo)/(sc.hi-sc.lo));
    const f=o.fmt||(v=>v), every=o.every||Math.ceil(n/8);
    let s=`<svg class="viz" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${attr(o.aria||'')}">`;
    sc.ticks.forEach(t=>{ s+=`<line class="grid" x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}"/><text class="ax" x="${L-8}" y="${Y(t)+4}" text-anchor="end">${esc(f(t))}</text>`; });
    o.labels.forEach((l,i)=>{ if(i%every===0||i===n-1&&o.lastLabel!==false) s+=`<text class="ax" x="${X(i)}" y="${H-6}" text-anchor="${i===0?'start':i===n-1?'end':'middle'}">${esc(l)}</text>`; });
    (o.bands||[]).forEach(b=>{ s+=`<rect class="band" x="${L}" width="${W-L-R}" y="${Y(b.to)}" height="${Y(b.from)-Y(b.to)}"/>`; });
    (o.refs||[]).forEach(r=>{ s+=`<line class="ref" x1="${L}" x2="${W-R}" y1="${Y(r.value)}" y2="${Y(r.value)}"/><text class="ref-l" x="${L+6}" y="${Y(r.value)-5}" text-anchor="start">${esc(r.label)}</text>`; });
    o.series.forEach(se=>{
      let d='',pen=false; se.values.forEach((v,i)=>{ if(v==null){pen=false;return;} d+=(pen?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1); pen=true; });
      if(se.area) s+=`<path class="area" style="--c:${se.color}" d="${d}L${X(n-1)},${Y(sc.lo)}L${X(0)},${Y(sc.lo)}Z"/>`;
      s+=`<path class="ln${se.dash?' dash':''}" style="--c:${se.color}" d="${d}"/>`;
    });
    (o.flags||[]).forEach(fl=>{ const v=o.series[fl.s||0].values[fl.i]; s+=`<circle class="flag" cx="${X(fl.i)}" cy="${Y(v)}" r="5"/>`; });
    o.series.forEach(se=>{ if(se.endDot===false) return; const i=se.values.length-1; if(se.values[i]==null) return; s+=`<circle class="dot" style="--c:${se.color}" cx="${X(i)}" cy="${Y(se.values[i])}" r="4"/>`; });
    s+=`<line class="guide" x1="0" x2="0" y1="${T}" y2="${H-B}"/>`;
    const bw=(W-L-R)/Math.max(1,n-1);
    o.labels.forEach((l,i)=>{ const rows=o.series.map(se=>({name:se.name,value:se.values[i]==null?'—':f(se.values[i]),color:se.color,dash:se.dash})); if(o.tipExtra) rows.push(...o.tipExtra(i));
      s+=`<rect class="hit" data-gx="${X(i)}" x="${Math.max(L,X(i)-bw/2)}" width="${bw}" y="${T}" height="${H-T-B}" data-t="${attr(tipRows(o.tipLabels?o.tipLabels[i]:l,rows))}"/>`; });
    el.innerHTML=s+'</svg>';
  }

  /* ---------- Column chart (grouped or stacked) ---------- */
  function cols(el,o){
    const W=Math.max(260,el.clientWidth), H=o.height||220, L=o.left||40, R=8, T=10, B=26;
    const n=o.labels.length, f=o.fmt||(v=>v), every=o.every||Math.ceil(n/12);
    const tot=o.labels.map((_,i)=>o.stacked?o.series.reduce((a,se)=>a+se.values[i],0):Math.max(...o.series.map(se=>se.values[i])));
    const sc=nice(0,o.max??Math.max(...tot,...(o.refs||[]).map(r=>r.value)));
    const Y=v=>T+(H-T-B)*(1-v/sc.hi), band=(W-L-R)/n, pad=band*(o.gap??.28), inner=band-pad;
    let s=`<svg class="viz" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${attr(o.aria||'')}">`;
    sc.ticks.forEach(t=>{ s+=`<line class="grid" x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}"/><text class="ax" x="${L-8}" y="${Y(t)+4}" text-anchor="end">${esc(f(t))}</text>`; });
    o.labels.forEach((l,i)=>{ const x0=L+band*i+pad/2;
      if(i%every===0) s+=`<text class="ax" x="${x0+inner/2}" y="${H-6}" text-anchor="middle">${esc(l)}</text>`;
      if(o.stacked){ let acc=0; const last=o.series.map((se,k)=>se.values[i]>0?k:-1).reduce((a,b)=>Math.max(a,b),-1);
        o.series.forEach((se,k)=>{ const v=se.values[i]; if(!v) return; const y1=Y(acc+v), y0=Y(acc); acc+=v; const h=y0-y1-(k<last?2:0);
          s+=`<path class="bar" style="--c:${se.color}" d="${barPath(x0,y1+(k<last?0:0),inner,Math.max(0,h),k===last?4:0,k===last?'top':'none')}"/>`; });
      } else { const g=o.series.length, bw=(inner-(g-1)*2)/g;
        o.series.forEach((se,k)=>{ const v=se.values[i]; s+=`<path class="bar" style="--c:${se.color}" d="${barPath(x0+k*(bw+2),Y(v),bw,Y(0)-Y(v))}"/>`; }); }
      const rows=o.series.map(se=>({name:se.name,value:f(se.values[i]),color:se.color})); if(o.stacked&&o.series.length>1) rows.push({name:'Total',value:f(tot[i])});
      s+=`<rect class="hit" x="${L+band*i}" width="${band}" y="${T}" height="${H-T-B}" data-t="${attr(tipRows(o.tipLabels?o.tipLabels[i]:l,rows))}"/>`;
    });
    (o.refs||[]).forEach(r=>{ s+=`<line class="ref" x1="${L}" x2="${W-R}" y1="${Y(r.value)}" y2="${Y(r.value)}"/><text class="ref-l" x="${W-R}" y="${Y(r.value)-5}" text-anchor="end">${esc(r.label)}</text>`; });
    s+=`<line class="base" x1="${L}" x2="${W-R}" y1="${Y(0)}" y2="${Y(0)}"/>`;
    el.innerHTML=s+'</svg>';
  }

  /* ---------- Sparkline ---------- */
  function spark(values,{w=96,h=28,color='var(--s1)'}={}){
    const lo=Math.min(...values), hi=Math.max(...values), n=values.length, X=i=>2+(w-4)*i/(n-1), Y=v=>h-3-(h-6)*((v-lo)/((hi-lo)||1));
    const d=values.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1)).join('');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="${d}" style="--c:${color}"/><circle cx="${X(n-1)}" cy="${Y(values[n-1])}" r="2.5" style="--c:${color}"/></svg>`;
  }

  /* ---------- Tooltip + guide (delegated) ---------- */
  const tip=document.createElement('div'); tip.className='vtip'; document.body.appendChild(tip);
  let guideSvg=null;
  document.addEventListener('mousemove',e=>{
    const t=e.target.closest&&e.target.closest('[data-t]');
    if(guideSvg&&(!t||t.ownerSVGElement!==guideSvg)){ guideSvg.querySelector('.guide').style.opacity=0; guideSvg=null; }
    if(!t){ tip.classList.remove('on'); return; }
    tip.innerHTML=t.getAttribute('data-t'); tip.classList.add('on');
    if(t.dataset.gx&&t.ownerSVGElement){ guideSvg=t.ownerSVGElement; const g=guideSvg.querySelector('.guide'); g.setAttribute('x1',t.dataset.gx); g.setAttribute('x2',t.dataset.gx); g.style.opacity=1; }
    const w=tip.offsetWidth,h=tip.offsetHeight; let x=e.clientX+14,y=e.clientY+14;
    if(x+w>innerWidth-8) x=e.clientX-14-w; if(y+h>innerHeight-8) y=e.clientY-14-h;
    tip.style.left=x+'px'; tip.style.top=y+'px';
  });
  window.addEventListener('scroll',()=>tip.classList.remove('on'),true);

  return {line,cols,spark,legend,tipRows,esc,attr};
})();
