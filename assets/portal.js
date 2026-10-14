'use strict';
(() => {
 const catalog=window.arcadeCatalog;
 let version='new',category='all',query='';
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
 const favorites=new Set(read('arcade:favorites',[]));
 const root=document.getElementById('games');
 const url=g=>(version==='new'?'games/':'archive/')+g.slug+'/';
 function art(g,index){
  const base='<circle cx="140" cy="80" r="52" fill="none" stroke="#1e292b" stroke-opacity=".3"/><path d="M35 80h20m-10-10v20M225 80h20m-10-10v20" stroke="#1e292b" stroke-opacity=".5"/>';
  let shapes='';
  if(index===0)shapes='<path d="M109 98l49-49h-35V31h65v65h-18V62l-48 49z" fill="#294b3e"/>';
  else if(index===1)shapes='<circle cx="140" cy="80" r="24" fill="#294b3e"/><circle cx="140" cy="80" r="8" fill="#92d7ef"/><circle cx="105" cy="40" r="5" fill="#294b3e"/><circle cx="176" cy="35" r="5" fill="#294b3e"/><circle cx="190" cy="110" r="5" fill="#294b3e"/>';
  else if(index===2)shapes='<path d="M115 110V50m-18 18l18-18 18 18M164 50v60m-18-18l18 18 18-18" fill="none" stroke="#294b3e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>';
  else if(index===3)shapes='<circle cx="113" cy="80" r="23" fill="none" stroke="#294b3e" stroke-width="7"/><path d="M160 60l36 40m0-40l-36 40" stroke="#294b3e" stroke-width="7"/>';
  else if(index===4)shapes='<text x="140" y="105" text-anchor="middle" fill="#294b3e" font-family="Georgia,serif" font-size="68" font-weight="bold">Aa</text>';
  else if(index===5)shapes='<path d="M98 92V58h25M182 68v34h-25" stroke="#294b3e" stroke-width="9" fill="none"/><circle cx="140" cy="80" r="9" fill="#294b3e"/>';
  else if(index===6)shapes='<rect x="94" y="51" width="92" height="59" rx="8" fill="#294b3e"/><path d="M108 67h9m7 0h9m7 0h9m7 0h9m-57 14h9m7 0h9m7 0h9m7 0h9m-45 15h33" stroke="#9fc4f4" stroke-width="5"/>';
  else shapes='<path d="M140 34l13 28 31 4-23 23 5 31-26-15-28 15 6-31-23-23 31-4z" fill="#294b3e"/>';
  return '<svg aria-hidden="true" viewBox="0 0 280 160">'+base+shapes+'</svg>';
 }
 function render(){
  root.replaceChildren();const visible=catalog.filter(g=>(category==='all'||category==='favorites'&&favorites.has(g.slug)||g.category===category)&&((g.name+g.en+g.category+g.desc).toLowerCase().includes(query)));
  for(const g of visible){
   const index=catalog.indexOf(g);const card=document.createElement('article');card.className='game-card';card.style.setProperty('--color',g.color);
   const link=document.createElement('a');link.className='game-link';link.href=url(g);link.setAttribute('aria-label',g.name+' '+(version==='new'?'新版':'オリジナル版')+'で遊ぶ');
   const artDiv=document.createElement('div');artDiv.className='game-art';artDiv.innerHTML=art(g,index)+'<span class="edition-badge">'+(version==='new'?'EDITION 02':'ORIGINAL 01')+'</span><span class="art-code">'+String(index+1).padStart(2,'0')+' / '+g.en+'</span>';
   const body=document.createElement('div');body.className='game-body';body.innerHTML='<span class="game-category"></span><h3></h3><p></p><div class="game-bottom"><span class="game-score"></span><span class="play">あそぶ <span>↗</span></span></div>';
   body.querySelector('.game-category').textContent=g.category;body.querySelector('h3').textContent=g.name;body.querySelector('p').textContent=g.desc;
   const history=read('arcade:history:'+g.slug,[]);body.querySelector('.game-score').textContent=version==='new'&&history.length?'BEST '+Math.max(...history.map(r=>r.score)).toLocaleString():'BROWSER GAME';link.append(artDiv,body);card.append(link);
   const fav=document.createElement('button');fav.className='favorite';fav.textContent=favorites.has(g.slug)?'♥':'♡';fav.setAttribute('aria-label',g.name+'をお気に入り'+(favorites.has(g.slug)?'から外す':'に追加'));fav.setAttribute('aria-pressed',String(favorites.has(g.slug)));fav.onclick=()=>{if(favorites.has(g.slug))favorites.delete(g.slug);else favorites.add(g.slug);localStorage.setItem('arcade:favorites',JSON.stringify([...favorites]));render()};card.append(fav);root.append(card);
  }
  document.getElementById('catalog-status').textContent=visible.length+' / '+catalog.length+' GAMES';document.getElementById('empty').hidden=visible.length>0;
 }
 function selectVersion(v){version=v;document.querySelectorAll('[data-version]').forEach(b=>{b.classList.toggle('active',b.dataset.version===v);b.setAttribute('aria-pressed',String(b.dataset.version===v))});document.getElementById('version-note').textContent=v==='new'?'遊びの軸はそのままに。画面、操作、振り返りを新しく。':'制作当時のオリジナル版。新版と切り替えて、いつでも遊べます。';render()}
 function reset(){category='all';query='';document.getElementById('search').value='';updateFilters();render()}
 function updateFilters(){document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b.dataset.category===category);b.setAttribute('aria-pressed',String(b.dataset.category===category))})}
 document.querySelectorAll('[data-version]').forEach(b=>b.onclick=()=>selectVersion(b.dataset.version));
 document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;updateFilters();render()});
 document.getElementById('search').oninput=e=>{query=e.target.value.trim().toLowerCase();render()};document.getElementById('reset-search').onclick=reset;
 function archive(){reset();selectVersion('archive');document.getElementById('library').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
 document.querySelector('[data-archive-link]').onclick=archive;document.getElementById('browse-archive').onclick=archive;
 document.getElementById('random-play').onclick=()=>{location.href='games/'+catalog[Math.floor(Math.random()*catalog.length)].slug+'/'};
 const dialog=document.getElementById('history-dialog');document.getElementById('history-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close()}});
 document.getElementById('history-open').onclick=()=>{const content=document.getElementById('history-content');content.replaceChildren();let any=false;for(const g of catalog){const h=read('arcade:history:'+g.slug,[]);if(!h.length)continue;any=true;const row=document.createElement('div');row.className='history-row';const info=document.createElement('div');const title=document.createElement('h3');title.textContent=g.name;const desc=document.createElement('small');desc.textContent=h.length+'回プレイ · 最終 '+new Date(h[0].date).toLocaleDateString('ja-JP');info.append(title,desc);const score=document.createElement('div');const best=document.createElement('strong');best.textContent=Math.max(...h.map(r=>r.score)).toLocaleString()+' pt';const play=document.createElement('a');play.href='games/'+g.slug+'/';play.textContent='もう一回遊ぶ ↗';score.append(best,play);row.append(info,score);content.append(row)}if(!any){const empty=document.createElement('p');empty.className='no-history';empty.textContent='まだプレイ記録がありません。新版を遊んで、最初の記録を残そう。';content.append(empty)}dialog.showModal()};
 render();
})();
