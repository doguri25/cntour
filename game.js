// 충청남도 블록 탐방 — class game. Loaded only when the page is opened from a game link made on teacher.html:
//   ?g=<m·t·h 가운데 하나 이상, 예: mh> (미션·도장 모으기·보물찾기) &lv=3|4 &r=<시·군 하나 이상, 쉼표로 구분, 3학년만> &min=<분> &room=<방 코드>
// 3학년은 고른 시·군 안에서만, 4학년은 충청남도 전체에서 진행한다. 방식을 여러 개 고르면 한 판에서 함께 진행하고 점수를 더한다.
export const FB={ projectId:'cntour-tambang', apiKey:'AIzaSyCjUNM3S4EVYirp_TvSV1D0x4y2sZFKouM' };
const DOCS=`https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents`;

// ---------- leaderboard (Cloud Firestore over REST: nothing to download)
export async function sendScore(rec){
  const id=Array.from(crypto.getRandomValues(new Uint8Array(15)),b=>'abcdefghijklmnopqrstuvwxyz0123456789'[b%36]).join('');
  const body={writes:[{ update:{ name:`projects/${FB.projectId}/databases/(default)/documents/scores/${id}`, fields:{
      room:{stringValue:rec.room}, mode:{stringValue:rec.mode}, name:{stringValue:rec.name}, score:{integerValue:String(rec.score)}, time:{integerValue:String(rec.time)}, done:{integerValue:String(rec.done)} } },
    updateTransforms:[{fieldPath:'ts',setToServerValue:'REQUEST_TIME'}], currentDocument:{exists:false} }]};
  const r=await fetch(`${DOCS}:commit?key=${FB.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error('save '+r.status); return id; }
export async function loadScores(room){
  const q={structuredQuery:{from:[{collectionId:'scores'}],where:{fieldFilter:{field:{fieldPath:'room'},op:'EQUAL',value:{stringValue:room}}},limit:300}};
  const r=await fetch(`${DOCS}:runQuery?key=${FB.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});
  if(!r.ok) throw new Error('load '+r.status);
  const rows=(await r.json()).filter(x=>x.document).map(x=>{ const f=x.document.fields; return {id:x.document.name.split('/').pop(),name:f.name.stringValue,score:+f.score.integerValue,time:+f.time.integerValue,done:+f.done.integerValue,mode:f.mode.stringValue}; });
  return rows.sort((a,b)=>b.score-a.score||a.time-b.time); }
export const clock=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
export const MODES={m:'미션 탐방',t:'도장 모으기',h:'보물찾기'};
export const REGIONS=['홍성군','예산군','보령시','청양군','서산시','당진시','태안군','아산시','천안시','공주시','계룡시','논산시','부여군','서천군','금산군'];

// ---------- what kind of place it is (from the picture rules): 자연 · 문화유산 · 생활
const NATURE=new Set(['mountain','lake','river','waterfall','forest','beach','dune','tidal','island','birds','reeds','garden','ginkgo','cherry','leafy','cave','rock']);
const HERITAGE=new Set(['temple','pagoda','buddha','fortress','hanok','tomb','monument','statue','church','hall','thatch','kiln','museum','inkstone','jar','bowl','book']);
const group=k=>NATURE.has(k)?'n':HERITAGE.has(k)?'h':'l';

const CSS=`
#gbar{position:fixed;top:12px;left:12px;height:44px;padding:0 16px 0 8px;border-radius:999px;display:flex;gap:10px;align-items:center;font-size:14px;font-weight:700;cursor:pointer;z-index:3;max-width:calc(100vw - 96px)}
#gbar i{font-style:normal;background:var(--p);color:#fff;border-radius:999px;padding:5px 11px;font-size:13px;font-variant-numeric:tabular-nums;flex:none}
#gbar i.hot{background:#d93025}
#gbar span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#gbar b{color:var(--p);font-weight:900}
#gpan,#gend{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(18,24,38,.32);padding:16px;z-index:7}
#gpan .sheet,#gend .sheet{padding:22px;width:min(430px,100%)}
#gpan h3{margin:14px 0 2px;font-size:13px;color:var(--p);font-weight:700}
#gpan h1,#gend h1{margin:0 0 4px;font-size:21px;font-weight:900}
#gpan .sub,#gend .sub{margin:0 0 14px;font-size:13.5px;color:var(--sub);line-height:1.55}
.gl{list-style:none;margin:0 0 14px;padding:0}
.gl li{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--line);font-size:14.5px;line-height:1.45;font-weight:500}
.gl li em{flex:none;font-style:normal;width:22px;height:22px;border-radius:50%;border:2px solid #d5dbe5;display:inline-flex;align-items:center;justify-content:center;font-size:12px;color:#fff;margin-top:1px}
.gl li.v em{background:#188038;border-color:#188038}
.gl li small{margin-left:auto;flex:none;color:var(--p);font-weight:700;font-size:13px;padding-left:8px}
.gclue{background:#f1f6ff;border-radius:16px;padding:14px 16px;font-size:15px;line-height:1.65;margin:0 0 12px;color:#1f2430}
.ghint{background:#fff7e0;border-radius:12px;padding:10px 14px;font-size:14px;margin:0 0 12px;color:#7a5200;font-weight:700}
.gb2{display:block;width:100%;border:1.5px solid #d5dbe5;background:#fff;color:var(--p);border-radius:999px;font-size:15px;font-weight:700;padding:12px;margin:0 0 10px}
.gsc{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 14px}
.gsc div{flex:1 1 28%;background:#f4f7fb;border-radius:16px;padding:12px 6px;text-align:center;font-size:12px;color:var(--sub)}
.gsc b{display:block;font-size:22px;font-weight:900;color:var(--p);margin-top:2px;font-variant-numeric:tabular-nums}
#gname{width:100%;box-sizing:border-box;border:1.5px solid #c9d1dd;border-radius:14px;font-size:17px;padding:13px 14px;margin:0 0 10px;font-family:inherit;font-weight:700}
#gname:focus{outline:none;border-color:var(--p)}
.grank{list-style:none;margin:0 0 14px;padding:0;max-height:40vh;overflow:auto}
.grank li{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:12px;font-size:14.5px;font-weight:700}
.grank li.me{background:#e8f0fe}
.grank li em{font-style:normal;width:26px;text-align:center;color:var(--sub);flex:none}
.grank li span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.grank li b{color:var(--p);font-variant-numeric:tabular-nums}
.grank li small{color:var(--sub);font-weight:500;font-variant-numeric:tabular-nums;width:44px;text-align:right}
.gmsg{font-size:13px;color:var(--sub);margin:0 0 12px;line-height:1.5}
`;

export const areaName=rs=>rs.length<=3?rs.join('·'):`${rs[0]} 외 ${rs.length-1}곳`;
export const modeName=g=>[...'mht'].filter(c=>g.includes(c)).map(c=>MODES[c]).join(' + ');
export function init(api){
  const q=new URLSearchParams(location.search), gs=[...new Set((q.get('g')||'m').split('').filter(c=>MODES[c]))].join('')||'m', lv=q.get('lv')==='4'?4:3;
  const M=gs.includes('m'), T=gs.includes('t'), H=gs.includes('h');
  const regs=lv===3?((q.get('r')||'').split(',').filter((r,i,a)=>REGIONS.includes(r)&&a.indexOf(r)===i)):[]; if(lv===3&&!regs.length) regs.push('홍성군');
  const mins=Math.min(60,Math.max(3,+q.get('min')||15));
  const room=(q.get('room')||'').replace(/[^A-Za-z0-9]/g,'').slice(0,12).padEnd(4,'0'), area=lv===3?areaName(regs):'충청남도', title=modeName(gs);
  const {POI,say}=api, $=id=>document.getElementById(id), el=(t,p)=>Object.assign(document.createElement(t),p||{});
  // only the game's area is in play
  const play=POI.filter(p=>lv===4||regs.includes(p.c)); for(const p of POI){ if(lv===3&&!regs.includes(p.c)){ p.off=true; p.e.style.display='none'; } }
  document.head.appendChild(el('style',{textContent:CSS}));
  const st={on:false,over:false,t0:0,left:mins*60,stamps:0,wrong:0,hints:0,got:[],sent:false};
  let seed=0; for(const ch of room+area) seed=(seed*31+ch.charCodeAt(0))>>>0; const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);

  // ---------- intro text
  const how=[M&&'미션을 하나씩 마쳐요.',H&&'단서를 읽고 어떤 곳인지 찾아가 퀴즈를 맞히면 보물을 찾은 거예요.',T&&'도장을 많이 모을수록 점수가 올라가요. 퀴즈를 틀리면 10초를 기다려야 하니 설명을 잘 읽고 풀어요.',
    T?`${mins}분이 지나면 끝나요.`:`모두 마치거나 ${mins}분이 지나면 끝나요. 빨리 마칠수록 순위가 높아요.`].filter(Boolean).join(' ');
  { const hero=document.querySelector('#intro .hero'); hero.querySelector('small').textContent=(lv===3?'우리 고장 ':'우리 지역 ')+area;
    hero.querySelector('h1').textContent=title; hero.querySelector('p').textContent=how+' 이름표가 붙은 곳에 다가가 살펴보기를 누르고, 설명을 읽은 다음 퀴즈를 풀어요. 멀리 갈 때는 화면을 축소해 시·군 이름을 누르면 그곳으로 이동해요.';
    const go=$('go'), lab=()=>{ if(!go.disabled&&go.textContent!=='게임 시작') go.textContent='게임 시작'; }; lab(); new MutationObserver(lab).observe(go,{attributes:true,childList:true}); }
  for(const li of document.querySelectorAll('#intro .keys li')) if(li.firstChild.textContent==='바로 가기') li.lastChild.textContent='시·군 이름을 누르고 「이 곳으로 이동」';
  $('count').style.display='none';
  const bar=el('button',{id:'gbar',className:'glass'}), bt=el('i'), bs=el('span'); bar.append(bt,bs); document.body.appendChild(bar);
  const pan=el('div',{id:'gpan'}), ps=el('div',{className:'sheet'}); pan.appendChild(ps); document.body.appendChild(pan);
  const end=el('div',{id:'gend'}), es=el('div',{className:'sheet'}); end.appendChild(es); document.body.appendChild(end);
  for(const o of [pan,end]) for(const ev of ['pointerdown','pointermove','wheel','touchstart','keydown','keyup']) o.addEventListener(ev,e=>e.stopPropagation());
  pan.addEventListener('click',e=>{ if(e.target===pan) pan.style.display='none'; });
  bar.onclick=()=>{ if(st.over) showEnd(); else { drawPanel(); pan.style.display='flex'; } };

  // ---------- missions and treasures
  let missions=[], hunt=[], hi=0;
  function build(){
    const g={n:[],h:[],l:[]}; for(const p of play) g[group(api.kind(p))].push(p);
    const need=(k,n)=>Math.min(n,g[k].length), inG=k=>p=>group(api.kind(p))===k;
    if(M){ const L=[];
      if(lv===3){ L.push({t:`${area}에서 도장 ${Math.min(6,play.length)}개 모으기`,n:Math.min(6,play.length),f:()=>true});
        if(regs.length>1) L.push({t:`고른 시·군 ${regs.length}곳 모두에서 도장 받기`,n:regs.length,d:1,f:()=>true});
        if(need('h',2)) L.push({t:`옛 건물이나 유적·박물관 ${need('h',2)}곳 찾아가기`,n:need('h',2),f:inG('h')});
        if(need('n',2)) L.push({t:`산·강·바다 같은 자연 ${need('n',2)}곳 찾아가기`,n:need('n',2),f:inG('n')});
        if(need('l',2)) L.push({t:`시장·역·특산물처럼 사람들이 살아가는 모습 ${need('l',2)}곳 찾아가기`,n:need('l',2),f:inG('l')}); }
      else { const sea=['태안군','보령시','서천군'], land=['공주시','청양군','금산군','계룡시'];
        L.push({t:'서로 다른 시·군 4곳에서 도장 받기',n:4,d:1,f:()=>true});
        L.push({t:`서해와 맞닿은 ${sea.join('·')} 가운데 한 곳에서 도장 받기`,n:1,f:p=>sea.includes(p.c)});
        L.push({t:`바다가 없는 ${land.join('·')} 가운데 한 곳에서 도장 받기`,n:1,f:p=>land.includes(p.c)});
        L.push({t:'옛 건물이나 유적·박물관 3곳 찾아가기',n:3,f:inG('h')});
        L.push({t:'산·강·바다 같은 자연 2곳 찾아가기',n:2,f:inG('n')}); }
      missions=L; }
    if(H){ const pool=play.filter(p=>p.d&&p.d.length>24), n=Math.min(lv===3?5:6,pool.length);
      for(let i=pool.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
      // spread the treasures over the regions in play
      const per=Math.ceil(n/(lv===4?n:regs.length)), cnt={}; for(const p of pool){ if(hunt.length<n&&(cnt[p.c]||0)<per){ cnt[p.c]=(cnt[p.c]||0)+1; hunt.push(p); } }
      for(const p of pool) if(hunt.length<n&&!hunt.includes(p)) hunt.push(p); } }
  const prog=m=>{ const a=st.got.filter(m.f); return Math.min(m.n,m.d?new Set(a.map(p=>p.c)).size:a.length); };
  const mDone=()=>missions.filter(m=>prog(m)>=m.n).length, allDone=()=>(!M||mDone()>=missions.length)&&(!H||hi>=hunt.length);
  const doneN=()=>(M?mDone():0)+(H?hi:0)+(T?st.stamps:0);
  const score=()=>Math.max(0,(M?mDone()*300:0)+(H?hi*300-st.hints*60:0)+st.stamps*(T?100:M?20:0)-st.wrong*(T?30:10));
  const used=()=>Math.min(mins*60,Math.round((performance.now()-st.t0)/1000));
  // the clue is the place's description with its name hidden
  function clue(p){ let s=p.d; const words=[p.n].concat(p.n.split(/[\s·()]+/).filter(w=>w.length>=2)).sort((a,b)=>b.length-a.length); for(const w of words) s=s.split(w).join('○○'); return s; }
  function hint(p){ const dx=p.t[0]-api.P.x, dz=p.t[1]-api.P.z, d=Math.hypot(dx,dz), a=Math.atan2(dx,-dz)*180/Math.PI, dir=['북','북동','동','남동','남','남서','서','북서'][Math.round(((a+360)%360)/45)%8];
    return `${lv===4||regs.length>1?p.c+'에 있어요. ':''}지금 있는 곳에서 ${dir}쪽으로 ${d<60?'아주 가까워요':d<200?'조금 가면 돼요':'멀리 가야 해요'}. 이름은 ${p.n.length}글자예요.`; }

  const parts=()=>[M&&['미션',`${mDone()}/${missions.length}`],H&&['보물',`${hi}/${hunt.length}`],T&&['도장',st.stamps+'개']].filter(Boolean);
  function drawBar(){ bt.textContent=clock(st.left); bt.className=st.left<=60&&st.on?'hot':''; if(st.over) return;
    bs.textContent=''; parts().forEach(([k,v],i)=>{ if(i) bs.append(' · '); bs.append(k+' ',el('b',{textContent:v.replace(/\/.*|개/,'')}),v.includes('/')?' / '+v.split('/')[1]:'개'); }); }
  const subLine=()=>`${area} · 남은 시간 ${clock(st.left)} · ${score()}점`;
  function drawPanel(){ ps.textContent=''; ps.append(el('h1',{textContent:title}),el('p',{className:'sub',textContent:subLine()}));
    if(H){ const p=hunt[hi]; ps.appendChild(el('h3',{textContent:p?`${hi+1}번째 보물 단서`:'보물을 모두 찾았어요'}));
      if(p){ ps.appendChild(el('p',{className:'gclue',textContent:clue(p)}));
        if(p.hint) ps.appendChild(el('p',{className:'ghint',textContent:p.hint}));
        else { const hb=el('button',{className:'gb2',textContent:'힌트 보기 (60점 깎여요)'}); hb.onclick=()=>{ st.hints++; p.hint=hint(p); drawPanel(); }; ps.appendChild(hb); } } }
    if(M){ if(H||T) ps.appendChild(el('h3',{textContent:'미션'})); const ul=el('ul',{className:'gl'}); for(const m of missions){ const k=prog(m), li=el('li'); if(k>=m.n) li.className='v'; li.append(el('em',{textContent:k>=m.n?'✓':''}),el('span',{textContent:m.t}),el('small',{textContent:`${k}/${m.n}`})); ul.appendChild(li); } ps.appendChild(ul); }
    if(T){ if(M||H) ps.appendChild(el('h3',{textContent:'도장 모으기'})); ps.appendChild(el('p',{className:'gclue',textContent:`지금까지 도장 ${st.stamps}개를 모았어요. 도장 하나에 100점이에요. 틀린 횟수는 ${st.wrong}번이에요.`})); }
    const ok=el('button',{className:'btn',textContent:'계속하기'}); ok.onclick=()=>pan.style.display='none'; ps.appendChild(ok); }

  // ---------- the end: score, name, class ranking
  function finish(why){ if(st.over) return; st.time=used(); st.final=score(); st.doneN=doneN(); st.parts=parts(); st.all=allDone(); st.over=true; st.on=false; drawBar(); bs.textContent='결과 보기'; pan.style.display='none'; api.closeQ(); st.why=why; showEnd(); }
  function ranks(rows,me){ const ol=el('ol',{className:'grank'}); rows.slice(0,30).forEach((r,i)=>{ const li=el('li'); if(r.id===me) li.className='me'; li.append(el('em',{textContent:i+1}),el('span',{textContent:r.name}),el('b',{textContent:r.score+'점'}),el('small',{textContent:clock(r.time)})); ol.appendChild(li); }); return ol; }
  async function board(box,me){ box.textContent=''; box.appendChild(el('p',{className:'gmsg',textContent:'순위를 불러오는 중…'}));
    try{ const rows=await loadScores(room); box.textContent=''; if(!rows.length) box.appendChild(el('p',{className:'gmsg',textContent:'아직 올라온 기록이 없어요.'})); else { const i=rows.findIndex(r=>r.id===me); if(i>=0) box.appendChild(el('p',{className:'gmsg',textContent:`우리 반 ${rows.length}팀 가운데 ${i+1}등이에요.`})); box.appendChild(ranks(rows,me)); } }
    catch(e){ box.textContent=''; box.appendChild(el('p',{className:'gmsg',textContent:'순위를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'})); } }
  function showEnd(){ es.textContent='';
    es.append(el('h1',{textContent:st.why==='all'?'모두 마쳤어요!':'시간이 끝났어요'}),el('p',{className:'sub',textContent:`${title} · ${area}`}));
    const sc=el('div',{className:'gsc'}); for(const [k,v] of [['점수',st.final],['걸린 시간',clock(st.time)]].concat(st.parts)){ const d=el('div',{textContent:k}); d.appendChild(el('b',{textContent:v})); sc.appendChild(d); } es.appendChild(sc);
    const box=el('div');
    if(!st.sent){ const inp=el('input',{id:'gname',maxLength:6,placeholder:'모둠 이름이나 별명 (6자까지)',autocomplete:'off'}), go=el('button',{className:'btn',textContent:'기록 올리기'}), msg=el('p',{className:'gmsg',textContent:'진짜 이름 대신 모둠 이름이나 별명을 적어요.'});
      go.onclick=async()=>{ const name=inp.value.trim().slice(0,6); if(!name){ msg.textContent='이름을 적어 주세요.'; inp.focus(); return; } go.disabled=true; go.textContent='올리는 중…';
        try{ st.id=await sendScore({room,mode:`${gs}${lv}${regs.join(',')}`.slice(0,40),name,score:st.final,time:st.time,done:Math.min(600,st.doneN)}); st.sent=true; showEnd(); }
        catch(e){ go.disabled=false; go.textContent='다시 올리기'; msg.textContent='기록을 올리지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요. 점수는 이 화면에 그대로 남아 있어요.'; } };
      es.append(inp,msg,go); }
    else { es.appendChild(box); board(box,st.id); const re=el('button',{className:'gb2',textContent:'순위 새로 고침'}); re.onclick=()=>board(box,st.id); es.appendChild(re);
      const fr=el('button',{className:'btn',textContent:'자유롭게 더 둘러보기'}); fr.onclick=()=>end.style.display='none'; es.appendChild(fr); }
    end.style.display='flex'; }

  setInterval(()=>{ if(!st.on) return; st.left=Math.max(0,mins*60-(performance.now()-st.t0)/1000); drawBar(); if(pan.style.display==='flex'){ const s=ps.querySelector('.sub'); if(s) s.textContent=subLine(); } if(st.left<=0) finish('time'); },250);
  drawBar();
  return {
    async start(){ if(lv===3){ const s=api.regionSpot(regs[0]); api.goTo(regs[0],s[0],s[1]); }
      try{ await api.extra(); }catch(e){ try{ await api.extra(); }catch(e2){ say('자료를 불러오지 못했어요. 새로 고침 해 주세요'); return; } }
      build(); st.t0=performance.now(); st.on=true; drawBar(); drawPanel(); pan.style.display='flex'; },
    stamp(p){ if(!st.on) return; st.stamps++; st.got.push(p); let msg='', show=false;
      if(M){ const d=mDone(); if(d>(st.last||0)){ st.last=d; msg=d>=missions.length?'미션을 모두 마쳤어요!':`미션 ${d}개 완료!`; } }
      if(H){ if(p===hunt[hi]){ hi++; msg=hi>=hunt.length?'보물을 모두 찾았어요!':'보물 발견! 다음 단서를 확인해요'; show=hi<hunt.length; } else if(!M&&!T) msg='여기는 단서의 그곳이 아니에요'; }
      if(msg) say(msg);
      if(!T&&allDone()) setTimeout(()=>finish('all'),1600);
      else if(show) setTimeout(()=>{ if(st.on){ api.closeQ(); drawPanel(); pan.style.display='flex'; } },1700);
      drawBar(); },
    // 도장 모으기가 들어 있으면 틀렸을 때 10초 동안 답을 고를 수 없다 (창을 닫았다 열어도 그대로)
    wrong(p,box,qm){ if(!st.on) return; st.wrong++; drawBar(); if(!T) return; st.lock=performance.now()+10000;
      const tick=()=>{ const n=Math.ceil((st.lock-performance.now())/1000); if(n<=0){ if(qm.className==='no') qm.textContent='다시 골라 보세요.'; return; } if(qm.className==='no') qm.textContent=`아쉬워요. ${n}초 뒤에 다시 고를 수 있어요.`; setTimeout(tick,500); }; tick(); },
    canGo:c=>lv===4?c!=='대전광역시':regs.includes(c),
    locked(qm){ const n=Math.ceil(((st.lock||0)-performance.now())/1000); if(!st.on||n<=0) return false; qm.className='no'; qm.textContent=`${n}초 뒤에 다시 고를 수 있어요.`; return true; },
    get state(){ return {st,missions,hunt,hi,score:score(),done:doneN(),total:missions.length+hunt.length,room,gs,lv,regs}; }, finish };
}
