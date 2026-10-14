'use strict';
// One output bus per audio context. The original music and effects retain their character.
const arcadeAudioBuses = new WeakMap();
let arcadeVolume = Number(localStorage.getItem('arcade:volume') ?? .55);
if (!Number.isFinite(arcadeVolume)) arcadeVolume=.55;
function arcadeAudioDestination(ctx) {
  let bus=arcadeAudioBuses.get(ctx);
  if(!bus){bus=ctx.createGain();bus.gain.value=arcadeVolume;bus.connect(ctx.destination);arcadeAudioBuses.set(ctx,bus);}
  return bus;
}
(() => {
 const meta=window.arcadeMeta, slug=meta.slug, key='arcade:history:'+slug;
 const readHistory=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}};
 let review=[], sessionRecorded=false,started=0;
 const bar=document.querySelector('.arcade-bar');
 const audioBtn=document.createElement('button'); audioBtn.id='arcade-audio';audioBtn.textContent=arcadeVolume===0?'音 OFF':'音量 ♫';audioBtn.setAttribute('aria-expanded','false');bar.insertBefore(audioBtn,document.getElementById('arcade-fullscreen'));
 const audioPanel=document.createElement('div');audioPanel.id='arcade-audio-settings';audioPanel.hidden=true;audioPanel.innerHTML='<label>音量 <input type="range" min="0" max="100" aria-label="BGMと効果音の音量"></label><p>BGM・効果音に適用。設定は保存されます。</p>';document.body.append(audioPanel);
 audioPanel.querySelector('input').value=Math.round(arcadeVolume*100);
 audioBtn.onclick=()=>{audioPanel.hidden=!audioPanel.hidden;audioBtn.setAttribute('aria-expanded',String(!audioPanel.hidden))};
 audioPanel.querySelector('input').oninput=e=>{arcadeVolume=Number(e.target.value)/100;localStorage.setItem('arcade:volume',String(arcadeVolume));audioBtn.textContent=arcadeVolume===0?'音 OFF':'音量 ♫';const ctx=typeof audioCtx!=='undefined'?audioCtx:typeof AC!=='undefined'?AC:null;if(ctx)arcadeAudioDestination(ctx).gain.setTargetAtTime(arcadeVolume,ctx.currentTime,.02)};
 document.addEventListener('pointerdown',e=>{if(!audioPanel.hidden&&!audioPanel.contains(e.target)&&e.target!==audioBtn){audioPanel.hidden=true;audioBtn.setAttribute('aria-expanded','false')}});
 document.getElementById('arcade-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{document.getElementById('arcade-fullscreen').textContent='全画面非対応'}};
 document.addEventListener('fullscreenchange',()=>document.getElementById('arcade-fullscreen').textContent=document.fullscreenElement?'全画面を終了 ↙':'全画面 ↗');
 const title=document.getElementById('title-screen');
 if(title){const intro=document.createElement('div');intro.className='arcade-intro';intro.innerHTML='<strong></strong><br><span></span>';intro.querySelector('strong').textContent=meta.rule;intro.querySelector('span').textContent=meta.keys;title.append(intro);const rec=document.createElement('div');rec.id='arcade-title-record';rec.className='arcade-record';title.append(rec);updateTitleRecord()}
 function updateTitleRecord(){const rec=document.getElementById('arcade-title-record');if(!rec)return;const h=readHistory();rec.textContent=h.length?'新版の自己ベスト '+Math.max(...h.map(r=>r.score)).toLocaleString()+' pt · '+h.length+' 回プレイ':'新版の記録は、この端末に自動で保存されます。'}
 function hook(name,before,after){const original=window[name];if(typeof original!=='function')return;window[name]=function(...args){if(before)before(...args);const result=original.apply(this,args);if(after)after(...args);return result}}
 function addReview(question,answer,explanation=''){if(!question)return;review.push({question:String(question),answer:String(answer),explanation:String(explanation)})}
 hook('startGame',()=>{review=[];sessionRecorded=false;started=performance.now();audioPanel.hidden=true;document.querySelector('.arcade-result')?.remove();localStorage.setItem('arcade:last',slug)});
 hook('showTitle',null,updateTitleRecord);
 // Every question type uses its original answer guard before capturing a mistake.
 if(slug.startsWith('english-phrase')){
  function captureEnglish(){const q=currentQuestions[currentQ];addReview(q.situation||q.phrase,q.correct||q.phrase,q.hint||'')}
  hook('handleAnswer',(_,ok)=>{if(!answered&&!ok)captureEnglish()});hook('handleTimeout',()=>{if(!answered)captureEnglish()});
 }
 if(slug==='true-false-blitz')hook('answer',answer=>{if(gameActive&&!arcadeAnswerLocked&&currentQuestion&&answer!==currentQuestion.answer)addReview(currentQuestion.statement,currentQuestion.answer?'TRUE':'FALSE')});
 if(slug==='reflex-challenge'){
  function captureReflex(){if(!currentAnswer)return;addReview(document.getElementById('q-label').textContent+' '+(document.getElementById('q-text').textContent||document.getElementById('q-emoji').textContent),document.getElementById('btn-'+currentAnswer).querySelector('.choice-content').textContent)}
  hook('handleAnswer',dir=>{if(gameActive&&currentAnswer&&dir!==currentAnswer)captureReflex()});hook('onTimeout',captureReflex);
 }
 if(slug==='high-and-low'){
  function captureHighLow(){if(!currentQuestion||!currentCorrectAnswer)return;const q=currentQuestion;addReview(q.question,q.askLabel+': '+q.askValue+(q.unit||''),q.refName+': '+q.refValue+(q.unit||''))}
  hook('handleAnswer',a=>{if(gameActive&&currentCorrectAnswer&&a!==currentCorrectAnswer)captureHighLow()});hook('onTimeout',captureHighLow);
 }
 if(slug==='kids-quiz')hook('handleAnswer',idx=>{if(!isAnswering){const q=gameQuestions[currentQuestion];if(idx!==q.answer)addReview(questions[q.type].text,q.choices[q.answer].l||q.choices[q.answer].e)}});
 if(slug==='typing-reflex')hook('handleTypedChar',ch=>{if(gameActive&&!arcadeTypingLocked&&currentTarget&&ch.toLowerCase()!==currentTarget[typedSoFar.length])addReview(currentQuestion.text,currentTarget)});
 function recordSession(){
  if(sessionRecorded)return;sessionRecorded=true;
  const points=typeof score==='number'?Math.floor(score):0;
  const mode=typeof gameMode!=='undefined'?gameMode:typeof currentDifficulty!=='undefined'?currentDifficulty:'standard';
  const h=readHistory();const peers=h.filter(r=>r.mode===mode),best=peers.length?Math.max(...peers.map(r=>r.score)):0;
  const entry={score:points,mode,date:new Date().toISOString(),duration:Math.round((performance.now()-started)/1000),mistakes:review.length};h.unshift(entry);localStorage.setItem(key,JSON.stringify(h.slice(0,100)));localStorage.setItem('arcade:last',slug);
  const panel=document.createElement('section');panel.className='arcade-result';
  const head=document.createElement('h2');head.textContent=points>best?'自己ベスト更新！':'今回のプレイ記録';panel.append(head);
  const stats=document.createElement('div');stats.className='arcade-metrics';stats.innerHTML='<span><b></b>今回のスコア</span><span><b></b>同じモードのベスト</span>';stats.querySelectorAll('b')[0].textContent=points.toLocaleString();stats.querySelectorAll('b')[1].textContent=Math.max(best,points).toLocaleString();panel.append(stats);
  const note=document.createElement('p');note.textContent='記録をこの端末に自動保存しました。旧版と新版の記録は分けて保存します。';panel.append(note);
  if(review.length){const details=document.createElement('details');details.className='arcade-review';const summary=document.createElement('summary');summary.textContent='間違えた問題を振り返る（'+review.length+'）';details.append(summary);const list=document.createElement('ol');for(const r of review){const li=document.createElement('li');const q=document.createElement('span');q.textContent=r.question;const a=document.createElement('strong');a.textContent='正解：'+r.answer;const e=document.createElement('span');e.textContent=r.explanation;li.append(q,a,e);list.append(li)}details.append(list);panel.append(details);
   if(slug.startsWith('english-phrase')){const button=document.createElement('button');button.className='arcade-review-button';button.textContent='間違えた問題だけ練習する';button.onclick=()=>startReviewPractice(review.slice());panel.append(button)}
  }
  const result=document.getElementById('result-screen')||document.getElementById('overlay');result.append(panel);
 }
 if(slug==='true-false-blitz')hook('endGame',null,recordSession);
 else if(slug==='yokeru'){hook('gameOver',null,()=>setTimeout(recordSession,450));const oldResize=resize;window.resize=()=>{oldResize();const max=Math.max(180,window.innerHeight-126),ratio=420/680;const h=Math.min(max,(window.innerWidth-16)/ratio,680);cv.style.height=h+'px';cv.style.width=h*ratio+'px'};window.addEventListener('resize',resize);resize();window.addEventListener('blur',()=>{if(running&&!paused)togglePause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused)togglePause()});}
 else hook('showResult',null,recordSession);
 // Offline, untimed review is outside the scored match and never alters rankings.
 function startReviewPractice(items){
  const result=document.getElementById('result-screen');const panel=result.querySelector('.arcade-result');panel.replaceChildren();let i=0;
  function draw(){panel.replaceChildren();const heading=document.createElement('h2');heading.textContent='復習 '+(i+1)+' / '+items.length;const q=document.createElement('p');q.textContent=items[i].question;const a=document.createElement('strong');a.hidden=true;a.textContent=items[i].answer;const b=document.createElement('button');b.className='arcade-review-button';b.textContent='答えを見る';b.onclick=()=>{if(a.hidden){a.hidden=false;b.textContent=i<items.length-1?'次の問題へ':'復習を終える'}else if(i<items.length-1){i++;draw()}else{panel.replaceChildren();const text=document.createElement('p');text.textContent='復習完了。もう一回の対戦で確かめよう！';panel.append(text)}};panel.append(heading,q,a,b)}draw();panel.scrollIntoView({block:'nearest'});
 }
 // Keyboard support mirrors the visible options, with no hidden answer shortcuts.
 document.addEventListener('keydown',e=>{
  if(/INPUT|TEXTAREA/.test(e.target.tagName)||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  const active=document.getElementById('game-screen')?.classList.contains('active');if(!active)return;
  if(slug.startsWith('english-phrase')||slug==='kids-quiz'){const i='1234'.indexOf(e.key)>=0?'1234'.indexOf(e.key):'abcd'.indexOf(e.key.toLowerCase());if(i>=0){const btns=document.querySelectorAll('#game-screen .choice-btn');if(btns[i]&&!btns[i].classList.contains('disabled')){e.preventDefault();btns[i].click()}}}
  if(slug==='high-and-low'&&['ArrowUp','ArrowRight','ArrowDown'].includes(e.key)){e.preventDefault();document.getElementById({ArrowUp:'btn-high',ArrowRight:'btn-same',ArrowDown:'btn-low'}[e.key]).click()}
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button]')){e.preventDefault();e.target.click()}
 });
 // Public API is useful for diagnostics without exposing the current answer.
 window.arcade={history:readHistory,get reviewCount(){return review.length}};
})();
