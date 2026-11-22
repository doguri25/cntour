// 충청남도 블록 탐방 — class game. Loaded only when the page is opened from a game link made on teacher.html:
//   &x=<켤 요소 글자들, 없으면 모두 켬> n 동시접속 · o 인사 · f 깃발 · c 함께 여는 상자 · g 반 목표 · p 특산물 · t 칭호 · d 마지막 1분 두 배 · e 깜짝 임무 · r 복습 퀴즈 · w 넓은 판
//   ?g=<m·t·h 가운데 하나 이상, 예: mh> (미션·도장 모으기·보물찾기) &lv=3|4 &r=<시·군 하나 이상, 쉼표로 구분, 3학년만> &min=<분> &room=<방 코드>
// 3학년은 고른 시·군 안에서만, 4학년은 충청남도 전체에서 진행한다. 방식을 여러 개 고르면 한 판에서 함께 진행하고 점수를 더한다.
export const FB={ projectId:'cntour-tambang', apiKey:'AIzaSyCjUNM3S4EVYirp_TvSV1D0x4y2sZFKouM' };
export const RTDB='https://cntour-tambang-default-rtdb.asia-southeast1.firebasedatabase.app';
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
export const EXTRAS=[['n','동시접속','친구들 캐릭터가 한 지도에 함께 보이고 서로 밀립니다'],['o','인사','손 흔들기·박수·여기야 세 가지'],['f','깃발 꽂기','퀴즈를 반에서 처음 맞히면 깃발이 꽂히고 50점'],['c','함께 여는 상자','두 명이 같이 서야 열리고 둘 다 150점'],['g','반 전체 목표','반 도장 수를 함께 채우기'],['p','특산물 줍기','길에 떨어진 특산물 하나에 10점'],['t','칭호','많이 찾은 종류에 따라 이름 위에 칭호'],['d','마지막 1분 두 배','끝나기 1분 전부터 점수 두 배'],['e','깜짝 임무','중간에 한 종류가 3분 동안 두 배'],['r','복습 퀴즈','끝난 뒤 다녀온 곳에서 세 문제, 하나에 50점'],['w','넓은 판','장소 사이를 두 배로 벌린 지도 (25명 안팎이 함께할 때)']];
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
#gset{margin:0 0 14px}#gname{user-select:text;-webkit-user-select:text}#gset .gmsg{margin:0 0 8px}
#gchars{display:grid;grid-template-columns:repeat(10,1fr);gap:5px;margin:0 0 4px}
#gchars button{border:2px solid transparent;background:#f4f7fb;border-radius:10px;padding:6px 0 4px;display:flex;flex-direction:column;align-items:center;cursor:pointer}
#gchars button.on{border-color:var(--p);background:#e8f0fe}
#gchars i{display:block;width:16px;height:7px;border-radius:4px 4px 1px 1px;position:relative}
#gchars i.h1::after{content:'';position:absolute;left:5px;top:-4px;width:6px;height:6px;border-radius:50%;background:#fff;border:1px solid #cfd6e0}
#gchars i.h2{background:#4a3324!important;border-bottom:3px solid var(--hc)}
#gchars u{display:block;width:14px;height:10px;border-radius:3px}
#gchars s{display:block;width:18px;height:11px;border-radius:3px 3px 4px 4px;margin-top:1px}
#gemo{position:fixed;right:12px;top:318px;display:flex;flex-direction:column;gap:8px;z-index:3}
#gemo button{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.7);background:rgba(255,255,255,.9);box-shadow:var(--sh);font-size:20px;line-height:1;cursor:pointer;padding:0}
#gemo button.txt{font-size:11px;font-weight:900;color:var(--p)}
.av{position:fixed;left:0;top:0;pointer-events:none;text-align:center;font-size:12px;font-weight:700;color:#fff;white-space:nowrap;z-index:1}
.av span{display:inline-block;background:rgba(31,36,48,.62);border-radius:999px;padding:2px 9px}
.av small{display:block;font-size:10px;color:#ffe08a;font-weight:700;margin-bottom:1px;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.av em{display:block;font-style:normal;font-size:22px;margin-bottom:2px}
.av em.txt{font-size:12px;font-weight:900;color:#1f2430;background:#fff;border-radius:10px;padding:3px 8px;display:inline-block;box-shadow:0 2px 6px rgba(0,0,0,.2)}
#ggoal{position:fixed;top:62px;left:204px;height:26px;width:min(240px,calc(100vw - 290px));border-radius:999px;overflow:hidden;font-size:11.5px;font-weight:700;display:flex;align-items:center;justify-content:center;z-index:2}
#ggoal i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#7fd6a0,#34a853);opacity:.55;transition:width .6s}
#ggoal span{position:relative}
#gev{position:fixed;top:64px;left:50%;transform:translateX(-50%);background:#fbbc04;color:#3c2a00;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:900;box-shadow:var(--sh);z-index:4;display:none;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis}
#gfrz{position:fixed;inset:0;background:rgba(18,24,38,.55);z-index:8;display:none;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:900;text-align:center;padding:20px}
.gconf{position:fixed;top:-20px;width:10px;height:14px;z-index:9;pointer-events:none;animation:gfall 2.6s linear forwards}
@keyframes gfall{to{transform:translateY(110vh) rotate(540deg);opacity:.7}}
.gj{list-style:none;margin:0 0 14px;padding:0;max-height:52vh;overflow:auto}
.gj li{padding:10px 0;border-bottom:1px solid var(--line);font-size:13.5px;line-height:1.55}
.gj li b{display:block;font-size:15px}.gj li small{color:var(--p);font-weight:700;font-size:11.5px}
.gq button{display:block;width:100%;text-align:left;border:1.5px solid #d5dbe5;background:#fff;border-radius:14px;padding:12px 14px;font:inherit;font-size:15px;font-weight:700;margin:0 0 8px;cursor:pointer;color:var(--ink)}
.gq button.ok{background:#e6f4ea;border-color:#188038;color:#137333}.gq button.no{background:#fce8e6;border-color:#d93025;color:#c5221f}
`;

export const areaName=rs=>rs.length<=3?rs.join('·'):`${rs[0]} 외 ${rs.length-1}곳`;
export const modeName=g=>[...'mht'].filter(c=>g.includes(c)).map(c=>MODES[c]).join(' + ');
// what each region is known for: [name, colour] (picked up along the way)
const SPECIAL={'홍성군':['한우',0x9a623c],'예산군':['사과',0xe03131],'보령시':['김',0x234d3a],'청양군':['고추',0xd62828],'서산시':['마늘',0xf3eee0],'당진시':['쌀',0xf5e6a3],'태안군':['꽃게',0xff7043],'아산시':['배',0xe6cf73],
  '천안시':['호두',0xa9743c],'공주시':['밤',0x7a4a24],'계룡시':['기념 배지',0x2f6bff],'논산시':['딸기',0xe5383b],'부여군':['방울토마토',0xff4d3d],'서천군':['모시',0xf3efe0],'금산군':['인삼',0xe8c27a]};
const TITLES=[['h','문화유산 박사'],['n','자연 탐험가'],['l','고장 살림꾼'],['f','깃발 대장'],['c','단짝 탐험가'],['p','특산물 수집가']];
const GNAME={n:'자연',h:'옛 건물·유적',l:'살아가는 모습'};

// ---------- the room on the realtime database: one stream in, small writes out (polling if the stream cannot open)
function Room(room){
  const base=`${globalThis.__RTDB||RTDB}/rooms/${room}`, data={}, subs=[]; let es=null, poll=null;
  const set=(path,v)=>{ const ks=path.split('/').filter(Boolean); if(!ks.length){ for(const k in data) delete data[k]; Object.assign(data,v||{}); return; } let o=data; for(let i=0;i<ks.length-1;i++) o=o[ks[i]]||(o[ks[i]]={}); if(v===null) delete o[ks[ks.length-1]]; else o[ks[ks.length-1]]=v; };
  const merge=(path,v)=>{ for(const k in v) set(path+'/'+k,v[k]); }, fire=()=>{ for(const f of subs) f(data); };
  const startPoll=()=>{ if(poll) return; const go=async()=>{ try{ const r=await fetch(base+'.json'); if(r.ok){ set('',await r.json()); fire(); } }catch(e){} }; go(); poll=setInterval(go,1200); };
  try{ es=new EventSource(base+'.json'); es.addEventListener('put',e=>{ const m=JSON.parse(e.data); set(m.path,m.data); fire(); }); es.addEventListener('patch',e=>{ const m=JSON.parse(e.data); merge(m.path,m.data); fire(); });
    es.onerror=()=>{ if(es.readyState===2||!Object.keys(data).length){ es.close(); startPoll(); } }; }catch(e){ startPoll(); }
  const req=(m,p,v)=>fetch(`${base}/${p}.json`,{method:m,headers:{'Content-Type':'application/json'},body:v===undefined?undefined:JSON.stringify(v),keepalive:true});
  return {data,on:f=>subs.push(f),put:(p,v)=>req('PUT',p,v),patch:(p,v)=>req('PATCH',p,v),del:p=>req('DELETE',p),get:async p=>{ const r=await fetch(`${base}/${p}.json`); return r.ok?r.json():null; }}; }
export const roomApi=Room;

export function init(api){
  const q=new URLSearchParams(location.search), gs=[...new Set((q.get('g')||'m').split('').filter(c=>MODES[c]))].join('')||'m', lv=q.get('lv')==='4'?4:3;
  const M=gs.includes('m'), T=gs.includes('t'), H=gs.includes('h'), xs=q.get('x'), X=c=>xs===null||xs.includes(c), NET=X('n');
  const regs=lv===3?((q.get('r')||'').split(',').filter((r,i,a)=>REGIONS.includes(r)&&a.indexOf(r)===i)):[]; if(lv===3&&!regs.length) regs.push('홍성군');
  const inPlay=lv===3?regs:REGIONS, mins=Math.min(60,Math.max(3,+q.get('min')||15));
  const room=(q.get('room')||'').replace(/[^A-Za-z0-9]/g,'').slice(0,12).padEnd(4,'0'), area=lv===3?areaName(regs):'충청남도', title=modeName(gs);
  const {POI,say,THREE,P}=api, $=id=>document.getElementById(id), el=(t,p)=>Object.assign(document.createElement(t),p||{});
  const play=POI.filter(p=>lv===4||regs.includes(p.c)); for(const p of POI){ if(lv===3&&!regs.includes(p.c)){ p.off=true; p.e.style.display='none'; } }
  document.head.appendChild(el('style',{textContent:CSS}));
  const me=Array.from(crypto.getRandomValues(new Uint8Array(10)),b=>'abcdefghijklmnopqrstuvwxyz0123456789'[b%36]).join('');
  const st={on:false,over:false,t0:0,left:mins*60,stamps:0,wrong:0,hints:0,got:[],sent:false,pts:0,name:'',ch:0,flags:0,chests:0,picks:0,title:-1,mdone:0,paused:0};
  const seeded=str=>{ let s=0; for(const ch of str) s=(s*31+ch.charCodeAt(0))>>>0; return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296); };
  const rnd=seeded(room+area), rndMe=seeded(room+me), net=NET?Room(room):null;
  const add=(n,why)=>{ st.pts=Math.max(0,st.pts+n); if(why) say(`${why} ${n>0?'+':''}${n}점`); drawBar(); };

  // ---------- intro: name and character first
  const how=[M&&'미션을 하나씩 마쳐요.',H&&'단서를 읽고 어떤 곳인지 찾아가 퀴즈를 맞히면 보물을 찾은 거예요.',T&&'도장을 많이 모을수록 점수가 올라가요. 퀴즈를 틀리면 10초를 기다려야 해요.',
    T?`${mins}분이 지나면 끝나요.`:`모두 마치거나 ${mins}분이 지나면 끝나요.`,'멀리 갈 때는 화면을 축소해 시·군 이름을 눌러요.'].filter(Boolean).join(' ');
  const go=$('go');
  { const hero=document.querySelector('#intro .hero'); hero.querySelector('small').textContent=(lv===3?'우리 고장 ':'우리 지역 ')+area; hero.querySelector('h1').textContent=title; hero.querySelector('p').textContent=how;
    const keys=document.querySelector('#intro .keys'); keys.style.display='none';
    const box=el('div',{id:'gset'}), inp=el('input',{id:'gname',maxLength:6,placeholder:'모둠 이름이나 별명 (6자까지)',autocomplete:'off'}), grid=el('div',{id:'gchars'});
    box.append(el('p',{className:'gmsg',textContent:'진짜 이름 대신 모둠 이름이나 별명을 적고, 캐릭터를 골라요.'}),inp,grid); keys.before(box);
    const hex=c=>'#'+c.toString(16).padStart(6,'0');
    for(let v=0;v<30;v++){ const sp=api.charSpec(v), b=el('button',{type:'button'}), hat=el('i',{className:'h'+sp.hat}), head=el('u'), bd=el('s'); hat.style.background=hex(sp.cap); hat.style.setProperty('--hc',hex(sp.cap)); head.style.background=hex(sp.skin); bd.style.background=hex(sp.jacket);
      b.append(hat,head,bd); if(v===0) b.className='on'; b.onclick=()=>{ st.ch=v; for(const x of grid.children) x.classList.toggle('on',x===b); api.setChar(v); }; grid.appendChild(b); }
    for(const ev of ['keydown','keyup','pointerdown']) inp.addEventListener(ev,e=>e.stopPropagation());
    let ready=false; const lab=()=>{ if(!ready&&go.disabled) return; if(!ready){ ready=true; go.dataset.ready='1'; } { const ok=!!inp.value.trim(); const t=ok?'게임 시작':'이름을 적어 주세요'; if(go.textContent!==t) go.textContent=t; if(go.disabled!==!ok) go.disabled=!ok; } };
    inp.addEventListener('input',()=>{ st.name=inp.value.trim().slice(0,6); lab(); }); lab(); new MutationObserver(lab).observe(go,{attributes:true,childList:true}); }
  $('count').style.display='none';
  const bar=el('button',{id:'gbar',className:'glass'}), bt=el('i'), bs=el('span'); bar.append(bt,bs); document.body.appendChild(bar);
  const pan=el('div',{id:'gpan'}), ps=el('div',{className:'sheet'}); pan.appendChild(ps); document.body.appendChild(pan);
  const end=el('div',{id:'gend'}), es=el('div',{className:'sheet'}); end.appendChild(es); document.body.appendChild(end);
  const evb=el('div',{id:'gev'}), frz=el('div',{id:'gfrz',textContent:'선생님이 잠깐 멈췄어요. 앞을 봐 주세요.'}); document.body.append(evb,frz);
  for(const o of [pan,end,frz]) for(const ev of ['pointerdown','pointermove','wheel','touchstart','keydown','keyup']) o.addEventListener(ev,e=>e.stopPropagation());
  pan.addEventListener('click',e=>{ if(e.target===pan) pan.style.display='none'; });
  bar.onclick=()=>{ if(st.over) showEnd(); else { drawPanel(); pan.style.display='flex'; } };

  // ---------- missions and treasures
  let missions=[], hunt=[], hi=0; const grp=p=>group(api.kind(p));
  function build(){
    const g={n:[],h:[],l:[]}; for(const p of play) g[grp(p)].push(p);
    const need=(k,n)=>Math.min(n,g[k].length), inG=k=>p=>grp(p)===k;
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
      const per=Math.ceil(n/(lv===4?n:regs.length)), cnt={}; for(const p of pool){ if(hunt.length<n&&(cnt[p.c]||0)<per){ cnt[p.c]=(cnt[p.c]||0)+1; hunt.push(p); } }
      for(const p of pool) if(hunt.length<n&&!hunt.includes(p)) hunt.push(p);
      // the same treasures for the whole class, but each explorer meets them in a different order (following a friend does not help)
      for(let i=hunt.length-1;i>0;i--){ const j=Math.floor(rndMe()*(i+1)); [hunt[i],hunt[j]]=[hunt[j],hunt[i]]; } } }
  const prog=m=>{ const a=st.got.filter(m.f); return Math.min(m.n,m.d?new Set(a.map(p=>p.c)).size:a.length); };
  const mDone=()=>missions.filter(m=>prog(m)>=m.n).length, allDone=()=>(!M||mDone()>=missions.length)&&(!H||hi>=hunt.length);
  const doneN=()=>(M?mDone():0)+(H?hi:0)+(T?st.stamps:0), score=()=>st.pts;
  const used=()=>Math.min(mins*60,Math.round((performance.now()-st.t0)/1000));
  function clue(p){ let s=p.d; const words=[p.n].concat(p.n.split(/[\s·()]+/).filter(w=>w.length>=2)).sort((a,b)=>b.length-a.length); for(const w of words) s=s.split(w).join('○○'); return s; }
  function hint(p){ const dx=p.t[0]-P.x, dz=p.t[1]-P.z, d=Math.hypot(dx,dz), a=Math.atan2(dx,-dz)*180/Math.PI, dir=['북','북동','동','남동','남','남서','서','북서'][Math.round(((a+360)%360)/45)%8];
    return `${lv===4||regs.length>1?p.c+'에 있어요. ':''}지금 있는 곳에서 ${dir}쪽으로 ${d<60?'아주 가까워요':d<200?'조금 가면 돼요':'멀리 가야 해요'}. 이름은 ${p.n.length}글자예요.`; }

  // ---------- multipliers: the last minute, and the class-wide surprise (the same three minutes for everyone, counted from the room's first start)
  let roomT0=0; const evNow=()=>{ if(!X('e')||!roomT0) return null; const m=(Date.now()-roomT0)/60000, k=Math.floor(m/6); return m>=3&&m%6>=3?['n','h','l'][k%3]:null; };
  const mult=p=>(X('d')&&st.left<=60?2:1)*(evNow()&&p&&grp(p)===evNow()?2:1);

  const parts=()=>[M&&['미션',`${mDone()}/${missions.length}`],H&&['보물',`${hi}/${hunt.length}`],T&&['도장',st.stamps+'개']].filter(Boolean);
  function drawBar(){ bt.textContent=clock(st.left); bt.className=st.left<=60&&st.on?'hot':''; if(st.over) return;
    bs.textContent=''; parts().forEach(([k,v],i)=>{ if(i) bs.append(' · '); bs.append(k+' ',el('b',{textContent:v.replace(/\/.*|개/,'')}),v.includes('/')?' / '+v.split('/')[1]:'개'); }); bs.append(' · ',el('b',{textContent:st.pts}),'점'); }
  const subLine=()=>`${area} · 남은 시간 ${clock(st.left)} · ${score()}점`;
  function drawPanel(){ ps.textContent=''; ps.append(el('h1',{textContent:title}),el('p',{className:'sub',textContent:subLine()}));
    if(H){ const p=hunt[hi]; ps.appendChild(el('h3',{textContent:p?`${hi+1}번째 보물 단서`:'보물을 모두 찾았어요'}));
      if(p){ ps.appendChild(el('p',{className:'gclue',textContent:clue(p)}));
        if(p.hint) ps.appendChild(el('p',{className:'ghint',textContent:p.hint}));
        else { const hb=el('button',{className:'gb2',textContent:'힌트 보기 (60점 깎여요)'}); hb.onclick=()=>{ st.hints++; add(-60); p.hint=hint(p); drawPanel(); }; ps.appendChild(hb); } } }
    if(M){ if(H||T) ps.appendChild(el('h3',{textContent:'미션'})); const ul=el('ul',{className:'gl'}); for(const m of missions){ const k=prog(m), li=el('li'); if(k>=m.n) li.className='v'; li.append(el('em',{textContent:k>=m.n?'✓':''}),el('span',{textContent:m.t}),el('small',{textContent:`${k}/${m.n}`})); ul.appendChild(li); } ps.appendChild(ul); }
    if(T){ if(M||H) ps.appendChild(el('h3',{textContent:'도장 모으기'})); ps.appendChild(el('p',{className:'gclue',textContent:`지금까지 도장 ${st.stamps}개를 모았어요. 도장 하나에 100점이에요. 틀린 횟수는 ${st.wrong}번이에요.`})); }
    const ok=el('button',{className:'btn',textContent:'계속하기'}); ok.onclick=()=>pan.style.display='none'; ps.appendChild(ok); }

  // ---------- titles
  function retitle(){ if(!X('t')) return; const c={n:0,h:0,l:0}; for(const p of st.got) c[grp(p)]++; const v={h:c.h>=3,n:c.n>=3,l:c.l>=3,f:st.flags>=3,c:st.chests>=2,p:st.picks>=10};
    for(let i=0;i<TITLES.length;i++) if(v[TITLES[i][0]]&&!(st.tset||(st.tset=new Set())).has(i)){ st.tset.add(i); st.title=i; say(`칭호를 얻었어요: ${TITLES[i][1]}`); myLab(); push(true); } }

  // ---------- friends on the same map
  const others=new Map(), v3=new THREE.Vector3(); let lastSend=0, lastKey='', sending=false, emo=0, emoT=0;
  const mine=el('div',{className:'av'}); api.lbBox.appendChild(mine); mine.style.display='none';
  function labFill(e,name,ti,em){ e.textContent=''; if(em){ const b=el('em',{textContent:['','👋','👏','여기야!'][em]}); if(em===3) b.className='txt'; e.appendChild(b); } if(ti>=0&&TITLES[ti]) e.appendChild(el('small',{textContent:TITLES[ti][1]})); e.appendChild(el('span',{textContent:name})); }
  const myLab=()=>labFill(mine,st.name,st.title,performance.now()<emoT?emo:0);
  function push(force){ if(!net||!st.name||!st.joined) return; const now=performance.now(), k=`${P.x.toFixed(1)}_${P.z.toFixed(1)}_${P.y.toFixed(1)}_${P.face.toFixed(1)}`; if(sending&&now-lastSend>3000) sending=false;   // a request that never came back must not stop the reports
    if(!force&&(sending||now-lastSend<280||(k===lastKey&&now-lastSend<4000))) return;
    lastSend=now; lastKey=k; sending=true; net.patch('p/'+me,{x:+P.x.toFixed(2),z:+P.z.toFixed(2),y:+P.y.toFixed(2),f:+P.face.toFixed(2),n:st.name,c:st.ch,t:st.title,e:now<emoT?emo:0,ts:Date.now()}).catch(()=>{}).finally(()=>sending=false); }
  function sync(d){ const ps=d.p||{}, now=performance.now();
    for(const id in ps){ if(id===me) continue; const r=ps[id]; if(!r||typeof r.x!=='number') continue; let o=others.get(id);
      if(!o){ o={m:api.makeAvatar(r.c||0),e:el('div',{className:'av'}),x:r.x,z:r.z,y:r.y||0,f:r.f||0,ts:0,seen:now,c:r.c}; api.scene.add(o.m); api.lbBox.appendChild(o.e); others.set(id,o); o.m.position.set(r.x,r.y||0,r.z); }
      if(r.ts!==o.ts){ o.ts=r.ts; o.seen=now; } o.tx=r.x; o.tz=r.z; o.ty=r.y||0; o.tf=r.f||0;
      const key=`${r.n}|${r.t}|${r.e}`; if(key!==o.key){ o.key=key; labFill(o.e,r.n||'',r.t,r.e); } }
    for(const [id,o] of others) if(!ps[id]||now-o.seen>15000){ api.scene.remove(o.m); o.e.remove(); others.delete(id); }
    if(d.t0&&!roomT0) roomT0=d.t0;
    flagsSync(d.flags||{}); chestSync(d.chests||{}); goalSync(d.s||{}); ctlSync(d.ctl||{}); }
  function place(e,x,y,z){ v3.set(x,y,z); const cd=v3.distanceTo(api.camera.position); v3.project(api.camera); const on=cd<170&&v3.z<1&&v3.z>-1&&Math.abs(v3.x)<1.1&&Math.abs(v3.y)<1.1; e.style.display=on?'':'none'; if(on) e.style.transform=`translate(${((v3.x+1)/2*innerWidth).toFixed(1)}px,${((1-v3.y)/2*innerHeight).toFixed(1)}px) translate(-50%,-100%)`; }

  // ---------- emotes
  if(NET&&X('o')){ const box=el('div',{id:'gemo'}); [['👋',1],['👏',2],['여기야!',3]].forEach(([t,k])=>{ const b=el('button',{textContent:t}); if(k===3) b.className='txt'; b.onclick=()=>{ if(!st.on) return; emo=k; emoT=performance.now()+3500; myLab(); push(true); setTimeout(()=>{ myLab(); push(true); },3600); }; box.appendChild(b); }); document.body.appendChild(box); box.style.display='none'; st.emoBox=box; }

  // ---------- flags: the first in the class to solve a place plants a flag there
  const flagMeshes={}, hexc=c=>api.charSpec(c).jacket;
  function flagsSync(fl){ if(!X('f')) return; for(const i in fl){ if(flagMeshes[i]) continue; const p=POI[+i], f=fl[i]; if(!p||!f) continue; const g=new THREE.Group(), pole=new THREE.Mesh(new THREE.BoxGeometry(.18,4.2,.18),new THREE.MeshStandardMaterial({color:0xf2f2f2})), cl=new THREE.Mesh(new THREE.BoxGeometry(1.5,.95,.1),new THREE.MeshStandardMaterial({color:hexc(f.c||0)}));
      pole.position.y=2.1; cl.position.set(.84,3.65,0); g.add(pole,cl); const s=api.safeSpot(p.t[0]+1.6,p.t[1]+1.2); g.position.set(s[0],s[1],s[2]); api.scene.add(g); flagMeshes[i]=g;
      if(!p.e.dataset.fl){ p.e.dataset.fl='1'; p.e.textContent=`${p.n} 🚩${f.n}`; } } }
  // ---------- chests: two explorers must stand together to open one
  const chests=[]; let chestGeo=null;
  function chestBuild(){ if(!NET||!X('c')) return; const per=lv===4?1:Math.max(2,Math.ceil(6/regs.length)); chestGeo=new THREE.BoxGeometry(1.7,1.2,1.2);
    for(const c of inPlay){ const [x0,z0,w,d]=api.tile(c); for(let k=0;k<per;k++){ const s=api.safeSpot(x0+w*(.12+rnd()*.76),z0+d*(.14+rnd()*.72)), g=new THREE.Group(), box=new THREE.Mesh(chestGeo,new THREE.MeshStandardMaterial({color:0x9a5b2c,roughness:.6})), band=new THREE.Mesh(new THREE.BoxGeometry(1.76,.26,1.26),new THREE.MeshStandardMaterial({color:0xfbbc04,roughness:.3,metalness:.3}));
        box.position.y=.6; band.position.y=.86; g.add(box,band); g.position.set(s[0],s[1],s[2]); api.scene.add(g); chests.push({k:c+k,g,x:s[0],z:s[2],y:s[1],open:false,tried:0}); } } }
  function chestSync(ch){ for(const c of chests){ const o=ch[c.k]; if(o&&!c.open){ c.open=true; c.g.children[1].position.y=1.5; c.g.children[1].rotation.z=.5; c.g.children[0].material=new THREE.MeshStandardMaterial({color:0xc9a27c,roughness:.7}); if(o.a===me||o.b===me){ st.chests++; add(150,'보물 상자를 함께 열었어요!'); retitle(); } } } }
  function chestTick(){ if(!chests.length||!st.on) return; const now=performance.now(); for(const c of chests){ if(c.open||now-c.tried<1500) continue; const d=Math.hypot(P.x-c.x,P.z-c.z); if(d>4.5) continue;
      let pal=null; for(const [id,o] of others) if(Math.hypot(o.x-c.x,o.z-c.z)<4.5){ pal=id; break; }
      c.tried=now; if(pal) net.put('chests/'+c.k,{a:me,b:pal}).catch(()=>{}); else if(now-(c.said||0)>6000){ c.said=now; say('친구와 둘이 서야 열려요. 「여기야!」로 불러 봐요'); } } }
  // ---------- the class goal
  const goal=el('div',{id:'ggoal',className:'glass'}), gi=el('i'), gt=el('span'); goal.append(gi,gt); if(NET&&X('g')) document.body.appendChild(goal); goal.style.display='none'; let goalHit=false;
  function goalSync(s){ if(!NET||!X('g')||!st.on&&!st.over) return; const vals=Object.values(s).filter(v=>typeof v==='number'), n=Math.max(1,vals.length), tot=vals.reduce((a,b)=>a+b,0), target=Math.max(10,n*5);
    goal.style.display=''; gi.style.width=Math.min(100,tot/target*100)+'%'; gt.textContent=`우리 반 도장 ${tot} / ${target}`; if(tot>=target&&!goalHit){ goalHit=true; say('우리 반 목표 달성! 모두 잘했어요'); confetti(); } }
  function confetti(){ const cs=['#ea4335','#fbbc04','#34a853','#4285f4','#ff7fb0']; for(let i=0;i<70;i++){ const c=el('div',{className:'gconf'}); c.style.left=Math.random()*100+'vw'; c.style.background=cs[i%5]; c.style.animationDelay=Math.random()*.9+'s'; document.body.appendChild(c); setTimeout(()=>c.remove(),3800); } }
  // ---------- the teacher's signals
  let gatherSeen=0;
  function ctlSync(c){ const pz=!!c.pause; if(pz!==api_.frozen){ api_.frozen=pz; frz.style.display=pz?'flex':'none'; if(pz){ st.pauseAt=performance.now(); api.closeQ(); pan.style.display='none'; } else if(st.pauseAt){ st.t0+=performance.now()-st.pauseAt; st.pauseAt=0; } }
    if(!st.ctl0){ st.ctl0=true; gatherSeen=c.gt||0; }   // a call made before this explorer joined is not followed
    if(c.gt&&c.gt!==gatherSeen){ gatherSeen=c.gt; if(st.on&&REGIONS.includes(c.gc)&&(lv===4||regs.includes(c.gc))){ const sp=api.regionSpot(c.gc), a=rndMe()*6.28, r=3+rndMe()*7; api.closeQ(); pan.style.display='none'; api.goTo(c.gc,sp[0]+Math.cos(a)*r,sp[1]+Math.sin(a)*r); say('선생님이 불렀어요. 모두 모여요!'); } } }
  // ---------- pick-ups: what each region is known for
  let items=null; const picks=[];
  function pickBuild(){ if(!X('p')) return; const per=lv===4?8:Math.max(8,Math.ceil(30/regs.length)), n=inPlay.length*per, r=seeded(room+'pick'+me);
    items=new THREE.InstancedMesh(new THREE.BoxGeometry(.8,.8,.8),new THREE.MeshStandardMaterial({roughness:.35}),n); const m4=new THREE.Matrix4(), col=new THREE.Color(); let i=0;
    for(const c of inPlay){ const [x0,z0,w,d]=api.tile(c), sp=SPECIAL[c]; for(let k=0;k<per;k++,i++){ const s=api.safeSpot(x0+w*(.06+r()*.88),z0+d*(.08+r()*.84)); picks.push({x:s[0],y:s[1]+.9,z:s[2],c,i,on:true}); m4.makeTranslation(s[0],s[1]+.9,s[2]); items.setMatrixAt(i,m4); items.setColorAt(i,col.setHex(sp[1])); } }
    items.frustumCulled=false; api.scene.add(items); st.m4=m4; }
  function pickTick(t){ if(!items||!st.on) return; for(const k of picks){ if(!k.on) continue; const dx=P.x-k.x, dz=P.z-k.z; if(dx*dx+dz*dz<2.6&&Math.abs(P.y-k.y)<3){ k.on=false; st.m4.makeScale(0,0,0); items.setMatrixAt(k.i,st.m4); items.instanceMatrix.needsUpdate=true; st.picks++; add(10*mult(null),`${k.c.slice(0,2)} ${SPECIAL[k.c][0]}`); retitle(); } } }

  // ---------- the end: review quiz, score, journal, class ranking
  function finish(why){ if(st.over) return; st.time=used(); st.doneN=doneN(); st.parts=parts(); st.over=true; st.on=false; drawBar(); bs.textContent='결과 보기'; pan.style.display='none'; api.closeQ(); st.why=why; evb.style.display='none'; if(st.emoBox) st.emoBox.style.display='none';
    const pool=st.got.filter(p=>p.q); if(X('r')&&pool.length){ for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; } review(pool.slice(0,3),0,0); } else done(); }
  function review(qs,i,ok){ es.textContent=''; if(i>=qs.length){ if(ok) st.pts+=ok*50; st.review=`${ok}/${qs.length}`; done(); return; } const p=qs[i];
    es.append(el('h1',{textContent:'복습 퀴즈'}),el('p',{className:'sub',textContent:`다녀온 곳에서 ${qs.length}문제 가운데 ${i+1}번째 · 맞히면 50점`}),el('p',{className:'gclue',textContent:p.q[0]}));
    const box=el('div',{className:'gq'}), opts=p.q.slice(1).map((t,k)=>({t,ok:k===0})); for(let a=opts.length-1;a>0;a--){ const b=Math.floor(Math.random()*(a+1)); [opts[a],opts[b]]=[opts[b],opts[a]]; }
    for(const o of opts){ const b=el('button',{textContent:o.t}); b.onclick=()=>{ for(const x of box.children){ x.disabled=true; } b.className=o.ok?'ok':'no'; if(!o.ok) [...box.children].find((x,k)=>opts[k].ok).className='ok'; setTimeout(()=>review(qs,i+1,ok+(o.ok?1:0)),o.ok?900:1900); }; box.appendChild(b); }
    es.appendChild(box); end.style.display='flex'; }
  function done(){ st.final=score(); showEnd(); upload(); }
  async function upload(){ if(st.sent||st.sending) return; st.sending=true; try{ st.id=await sendScore({room,mode:`${gs}${lv}${regs.join(',')}`.slice(0,40),name:st.name||'이름없음',score:st.final,time:st.time,done:Math.min(600,st.doneN)}); st.sent=true; }catch(e){ st.fail=true; } st.sending=false; if(end.style.display==='flex'&&!st.jopen) showEnd(); }
  function ranks(rows,meId){ const ol=el('ol',{className:'grank'}); rows.slice(0,30).forEach((r,i)=>{ const li=el('li'); if(r.id===meId) li.className='me'; li.append(el('em',{textContent:i+1}),el('span',{textContent:r.name}),el('b',{textContent:r.score+'점'}),el('small',{textContent:clock(r.time)})); ol.appendChild(li); }); return ol; }
  async function board(box,meId){ box.textContent=''; box.appendChild(el('p',{className:'gmsg',textContent:'순위를 불러오는 중…'}));
    try{ const rows=await loadScores(room); box.textContent=''; if(!rows.length) box.appendChild(el('p',{className:'gmsg',textContent:'아직 올라온 기록이 없어요.'})); else { const i=rows.findIndex(r=>r.id===meId); if(i>=0) box.appendChild(el('p',{className:'gmsg',textContent:`우리 반 ${rows.length}팀 가운데 ${i+1}등이에요.`})); box.appendChild(ranks(rows,meId)); } }
    catch(e){ box.textContent=''; box.appendChild(el('p',{className:'gmsg',textContent:'순위를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'})); } }
  function journal(){ st.jopen=true; es.textContent=''; es.append(el('h1',{textContent:'탐방 일지'}),el('p',{className:'sub',textContent:`${st.name} · ${area} · 다녀온 곳 ${st.got.length}곳`}));
    const ul=el('ul',{className:'gj'}); for(const p of st.got){ const li=el('li'); li.append(el('small',{textContent:`${p.c} · ${GNAME[grp(p)]}`}),el('b',{textContent:p.n}),document.createTextNode(p.d)); ul.appendChild(li); } if(!st.got.length) ul.appendChild(el('li',{textContent:'아직 도장을 받은 곳이 없어요.'})); es.appendChild(ul);
    const bk=el('button',{className:'btn',textContent:'결과로 돌아가기'}); bk.onclick=()=>{ st.jopen=false; showEnd(); }; es.appendChild(bk); }
  function showEnd(){ es.textContent='';
    es.append(el('h1',{textContent:st.why==='all'?'모두 마쳤어요!':'시간이 끝났어요'}),el('p',{className:'sub',textContent:`${title} · ${area} · ${st.name}`}));
    const sc=el('div',{className:'gsc'}); for(const [k,v] of [['점수',st.final],['걸린 시간',clock(st.time)]].concat(st.parts,st.review?[['복습 퀴즈',st.review]]:[])){ const d=el('div',{textContent:k}); d.appendChild(el('b',{textContent:v})); sc.appendChild(d); } es.appendChild(sc);
    const extra=[st.flags&&`깃발 ${st.flags}개`,st.chests&&`보물 상자 ${st.chests}개`,st.picks&&`특산물 ${st.picks}개`,st.title>=0&&`칭호 ${TITLES[st.title][1]}`].filter(Boolean); if(extra.length) es.appendChild(el('p',{className:'gmsg',textContent:extra.join(' · ')}));
    const box=el('div'); es.appendChild(box);
    if(st.sent){ board(box,st.id); const re=el('button',{className:'gb2',textContent:'순위 새로 고침'}); re.onclick=()=>board(box,st.id); es.appendChild(re); }
    else if(st.fail){ box.appendChild(el('p',{className:'gmsg',textContent:'기록을 올리지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요. 점수는 이 화면에 그대로 남아 있어요.'})); const re=el('button',{className:'gb2',textContent:'다시 올리기'}); re.onclick=()=>{ st.fail=false; showEnd(); upload(); }; es.appendChild(re); }
    else box.appendChild(el('p',{className:'gmsg',textContent:'기록을 올리는 중…'}));
    const jb=el('button',{className:'gb2',textContent:'탐방 일지 보기'}); jb.onclick=journal; es.appendChild(jb);
    const fr=el('button',{className:'btn',textContent:'자유롭게 더 둘러보기'}); fr.onclick=()=>end.style.display='none'; es.appendChild(fr);
    end.style.display='flex'; }

  let evShown=null;
  setInterval(()=>{ if(!st.on) return; if(api_.frozen) return; st.left=Math.max(0,mins*60-(performance.now()-st.t0)/1000); drawBar(); if(pan.style.display==='flex'){ const s=ps.querySelector('.sub'); if(s) s.textContent=subLine(); }
    const ev=evNow(), last=X('d')&&st.left<=60, key=(ev||'')+(last?'d':''); if(key!==evShown){ evShown=key; evb.style.display=key?'block':'none'; evb.textContent=[ev&&`깜짝 임무! 지금 「${GNAME[ev]}」 장소는 점수 두 배`,last&&'마지막 1분! 점수 두 배'].filter(Boolean).join(' · '); if(ev) say(`깜짝 임무: ${GNAME[ev]} 장소 점수 두 배!`); }
    if(st.left<=0) finish('time'); },250);
  drawBar();
  const api_={
    frozen:false,
    async start(){ if(lv===3){ const s=api.regionSpot(regs[0]); const a=Math.random()*6.28; api.goTo(regs[0],s[0]+Math.cos(a)*4,s[1]+Math.sin(a)*4); }
      try{ await api.extra(); }catch(e){ try{ await api.extra(); }catch(e2){ say('자료를 불러오지 못했어요. 새로 고침 해 주세요'); return; } }
      build(); chestBuild(); pickBuild(); st.t0=performance.now(); st.on=true; myLab(); if(st.emoBox) st.emoBox.style.display='flex';
      if(net){ net.on(sync); try{ await net.put('p/'+me,{x:+P.x.toFixed(2),z:+P.z.toFixed(2),y:+P.y.toFixed(2),f:0,n:st.name,c:st.ch,t:-1,e:0,ts:Date.now()}); st.joined=true; }catch(e){} net.put('s/'+me,0).catch(()=>{});
        net.get('t0').then(v=>{ if(v) roomT0=v; else { const now=Date.now(); net.put('t0',now).then(r=>{ if(r.ok) roomT0=roomT0||now; else net.get('t0').then(x=>{ if(x) roomT0=x; }); }).catch(()=>{}); } }).catch(()=>{});
        addEventListener('pagehide',()=>{ net.del('p/'+me); }); }
      drawBar(); drawPanel(); pan.style.display='flex'; },
    stamp(p){ if(!st.on) return; st.stamps++; st.got.push(p); let msg='', show=false, gain=T?100:M?20:0;
      if(M){ const d=mDone(); if(d>st.mdone){ gain+=300*(d-st.mdone); st.mdone=d; msg=d>=missions.length?'미션을 모두 마쳤어요!':`미션 ${d}개 완료!`; } }
      if(H){ if(p===hunt[hi]){ hi++; gain+=300; msg=hi>=hunt.length?'보물을 모두 찾았어요!':'보물 발견! 다음 단서를 확인해요'; show=hi<hunt.length; } else if(!M&&!T) msg='여기는 단서의 그곳이 아니에요'; }
      const k=mult(p); add(gain*k); if(k>1&&gain) msg=(msg?msg+' ':'')+`점수 ${k}배!`; if(msg) say(msg);
      if(net){ net.put('s/'+me,st.stamps).catch(()=>{}); if(X('f')){ const i=POI.indexOf(p); net.put('flags/'+i,{n:st.name,c:st.ch}).then(r=>{ if(r.ok){ st.flags++; add(50,'처음 찾았어요! 깃발을 꽂았어요'); retitle(); } }).catch(()=>{}); } }
      retitle();
      if(!T&&allDone()) setTimeout(()=>finish('all'),1600);
      else if(show) setTimeout(()=>{ if(st.on&&api.isOpen()){ api.closeQ(); } if(st.on){ drawPanel(); pan.style.display='flex'; } },1700);
      drawBar(); },
    wrong(p,box,qm){ if(!st.on) return; st.wrong++; add(T?-30:-10); if(!T) return; st.lock=performance.now()+10000;
      const tick=()=>{ const n=Math.ceil((st.lock-performance.now())/1000); if(n<=0){ if(qm.className==='no') qm.textContent='다시 골라 보세요.'; return; } if(qm.className==='no') qm.textContent=`아쉬워요. ${n}초 뒤에 다시 고를 수 있어요.`; setTimeout(tick,500); }; tick(); },
    canGo:c=>lv===4?c!=='대전광역시':regs.includes(c),
    locked(qm){ const n=Math.ceil(((st.lock||0)-performance.now())/1000); if(!st.on||n<=0) return false; qm.className='no'; qm.textContent=`${n}초 뒤에 다시 고를 수 있어요.`; return true; },
    // every frame while walking: friends glide to where they were last reported, bodies push apart, things nearby are checked
    tick(dt){ const k=Math.min(1,dt*9);
      for(const o of others.values()){ const mv=Math.hypot(o.tx-o.x,o.tz-o.z); if(mv>30){ o.x=o.tx; o.z=o.tz; o.y=o.ty; } else { o.x+=(o.tx-o.x)*k; o.z+=(o.tz-o.z)*k; o.y+=(o.ty-o.y)*k; } let df=o.tf-o.f; df=Math.atan2(Math.sin(df),Math.cos(df)); o.f+=df*k;
        o.w=(o.w||0)+(mv>.08?dt*11:0); o.m.position.set(o.x,o.y+(mv>.08?Math.abs(Math.sin(o.w))*.1:0),o.z); o.m.rotation.y=o.f; place(o.e,o.x,o.y+3.7,o.z);
        // bodies push apart instead of blocking, so nobody can wall a friend in
        if(!P.ride){ const dx=P.x-o.x, dz=P.z-o.z, d=Math.hypot(dx,dz), R=1.15; if(d<R&&Math.abs(P.y-o.y)<2.6){ const nx=d>.01?dx/d:Math.cos(o.w), nz=d>.01?dz/d:Math.sin(o.w), ps=(R-d)*.55, x2=P.x+nx*ps, z2=P.z+nz*ps; if(!api.hits(x2,P.y+.05,z2)){ P.x=x2; P.z=z2; } } } }
      if(st.name&&st.on){ place(mine,P.x,P.y+3.7,P.z); } else mine.style.display='none';
      if(st.on){ push(false); chestTick(); pickTick(); } },
    get state(){ return {st,missions,hunt,hi,score:score(),done:doneN(),total:missions.length+hunt.length,room,gs,lv,regs,others,chests,picks,me,net}; }, finish };
  return api_;
}
