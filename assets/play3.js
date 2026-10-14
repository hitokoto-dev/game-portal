'use strict';
(() => {
 const W=Worlds,C=WorldsContent,$=id=>document.getElementById(id),esc=W.esc;
 const meta=W.games.find(g=>g.slug===document.body.dataset.game);if(!meta)return;
 document.body.style.setProperty('--world',meta.color);
 document.body.dataset.world=meta.type;
 const scenery=document.createElement('div');scenery.className='world-scenery';scenery.setAttribute('aria-hidden','true');scenery.innerHTML='<div class="scene-art" style="background-position:'+(meta.art%2*100)+'% 0%;background-image:url(../../assets/art/play-worlds-'+(Math.floor(meta.art/2)+1)+'.jpg)"></div><div class="scene-vignette"></div><div class="ambient-motes">'+Array.from({length:12},(_,i)=>'<i style="--i:'+i+'"></i>').join('')+'</div>';$('play-view').prepend(scenery);
 const scenePreload=new Image();scenePreload.src='../../assets/art/play-worlds-'+(Math.floor(meta.art/2)+1)+'.jpg';
 const artSprites=new Image();if(['dodge','truth','kids'].includes(meta.type))artSprites.src='../../assets/art/play-sprites.png';const playerArt=new Image();if(['dodge','typing'].includes(meta.type))playerArt.src='../../assets/art/player-ship.png';
 function ornament(kind,extra=''){return '<span aria-hidden="true" class="art-object art-'+kind+' '+extra+'"></span>'}
 function visualHit(ok){const stage=$('play-stage');stage.classList.remove('impact-good','impact-bad');void stage.offsetWidth;stage.classList.add(ok?'impact-good':'impact-bad');let fx=$('hit-sparks');if(fx)fx.remove();fx=document.createElement('div');fx.id='hit-sparks';fx.className='hit-sparks';fx.setAttribute('aria-hidden','true');fx.innerHTML=Array.from({length:reduced?0:14},(_,i)=>'<i style="--angle:'+i*360/14+'deg;--distance:'+(90+i%4*35)+'px"></i>').join('');stage.append(fx)}
 const variants={reflex:[['standard','3ステージの冒険'],['chaos','最初からルール混合']],dodge:[['route','90秒のボス航路'],['endless','エンドレス航路']],compare:[['mix','映画・高さ・数字'],['number','数字と計算に集中']],truth:[['mixed','科学・ことば・論理'],['logic','数字のロジック']],phrase:[['mix','日常→慣用句→旅行'],['basic','日常の表現'],['idiom','慣用句'],['travel','旅行の表現']],voyage:[['travel','空港→ホテル→街'],['mix','日常の会話も混ぜる']],typing:[['english','英字のレーン'],['kana','かなのレーン']],kids:[['adventure','絵・数・数字をくらべる'],['count','かずをくらべる']]}[meta.type];
 $('variant-select').innerHTML=variants.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('');
 let mode=new URLSearchParams(location.search).get('mode')==='daily'?'daily':'normal',variant=variants[0][0],practicePool=null;
 const state={phase:'lobby',paused:false,score:0,correct:0,answered:0,combo:0,maxCombo:0,lives:3,elapsed:0,qElapsed:0,q:null,locked:false,feedbackUntil:0,goal:12,remaining:0,mistakes:[],rng:Math.random,cleared:false,stake:1,sessionId:0,wordIndex:0,typedKeys:0,wrongKeys:0,learned:[]};
 let lastFrame=performance.now(),raf=0,dodge=null,dodgeResizeObserver=null;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function view(id){document.querySelectorAll('.play-view').forEach(v=>v.classList.toggle('active',v.id===id))}
 function updateLobby(){document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode))});$('variant-select').disabled=mode==='daily';if(mode==='daily'){variant=variants[0][0];$('variant-select').value=variant}
  const practiceInfo=meta.type==='dodge'?'60秒、体力が減らない練習航路。ボスの弾も試せます。':meta.type==='typing'?'制限時間なしで12単語。英字・かなの入力を練習。':'時間制限・体力切れなしで'+(meta.type==='reflex'?'24':'12')+'問。答えの説明を見ながら練習。';
  $('mode-info').textContent=mode==='daily'?W.day()+' / JST の同じ出題・同じ弾パターン。何度でも挑戦できます。':mode==='practice'?practiceInfo:'ステージを進み、記録・経験値・実績を集める。';const records=W.records().filter(r=>r.slug===meta.slug&&r.mode===mode&&r.variant===variant&& (mode!=='daily'||r.day===W.day()));$('lobby-record').textContent=records.length?'BEST '+Math.max(...records.map(r=>r.score)).toLocaleString()+' · '+records.length+' RUNS':'新しい世界へ。プレイ結果は自動保存されます。';
 }
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;practicePool=null;updateLobby()});$('variant-select').onchange=e=>{variant=e.target.value;updateLobby()};updateLobby();
 function start(pool=null){
  if(state.phase==='countdown'||state.phase==='playing')return;
  W.sound.init();if(pool){mode='practice';practicePool=pool.slice()}else practicePool=null;
  Object.assign(state,{phase:'countdown',paused:false,score:0,correct:0,answered:0,combo:0,maxCombo:0,lives:3,elapsed:0,qElapsed:0,q:null,locked:false,feedbackUntil:0,goal:meta.type==='reflex'?24:12,remaining:meta.type==='truth'||meta.type==='typing'?45:0,mistakes:[],cleared:false,stake:1,wordIndex:0,typedKeys:0,wrongKeys:0,learned:[]});
  state.sessionId++;state.rng=W.rng(mode==='daily'?W.day()+meta.slug+variant:Date.now()+':'+Math.random());state.poolIndex=0;
  if(practicePool)state.goal=practicePool.length;
  if(meta.type==='truth')state.truthDeck=W.shuffle(C.truths,state.rng);
  if(meta.type==='phrase'||meta.type==='voyage')state.phraseDecks=[0,1,2].map(n=>W.shuffle(C.phrases.filter(p=>p[3]===n),state.rng));
  if(meta.type==='voyage')state.voyageDecks=['airport','hotel','city'].map(zone=>W.shuffle(C.phrases.filter(p=>p[4]===zone),state.rng));
  if(meta.type==='typing')state.words=Array.from({length:200},(_,i)=>{const pool=variant==='kana'?C.kana:C.words[Math.min(1,Math.floor(i/8))];return pool[Math.floor(state.rng()*pool.length)]});
  $('countdown-label').textContent=mode.toUpperCase()+' / '+meta.en;$('countdown-hint').textContent=meta.controls;$('countdown-number').textContent='3';$('pause-button').disabled=false;$('sound-panel').hidden=true;
  if(meta.type==='typing'){buildTyping();const input=$('typing-input');input.focus({preventScroll:true})}
  view('countdown-view');lastFrame=performance.now();W.sound.cue('tick');
 }
 $('start-button').onclick=()=>start();$('retry-button').onclick=()=>{practicePool=null;start()};$('lobby-button').onclick=()=>{state.phase='lobby';state.paused=false;W.sound.stop();$('pause-button').disabled=true;view('lobby-view');updateLobby()};
 function play(){state.phase='playing';state.elapsed=0;state.qElapsed=0;view('play-view');W.sound.start(meta.type);if(meta.type==='dodge')buildDodge();else if(meta.type==='typing'){view('play-view');setWord();$('typing-input').focus({preventScroll:true})}else nextQuestion();hud()}
 function rand(n){return Math.floor(state.rng()*n)}
 function choiceQuestion(title,options,correct,reason,kind='plain',extra={}){return{title,options,correct,reason,kind,limit:15,...extra}}
 function reflexQuestion(){
  const stage=Math.min(2,Math.floor(state.answered/8)),dirs=['↑','→','↓','←'],names=['上','右','下','左'];let kind=stage===0?'direction':stage===1?['color','math'][rand(2)]:['reverse','sequence'][rand(2)];if(variant==='chaos')kind=['direction','color','math','reverse','sequence'][rand(5)];
  const limit=Math.max(1.7,4.4-state.answered*.10)*(variant==='chaos'?.87:1);
  if(kind==='direction'||kind==='reverse'){const d=rand(4),opposite=kind==='reverse';return choiceQuestion(opposite?'矢印と反対の方向へ':'矢印が指す方向へ',dirs,opposite?(d+2)%4:d,opposite?dirs[d]+' の反対は '+dirs[(d+2)%4]:dirs[d]+' が指すのは '+names[d], 'direction',{stim:dirs[d],limit,tag:opposite?'REVERSE GATE':'DIRECTION GATE'})}
  if(kind==='math'){const a=2+rand(15),b=1+rand(9),answer=a+b;const nums=W.shuffle([answer,answer+1,answer-2,answer+3],state.rng);return choiceQuestion('計算の答えを選ぶ',nums.map(String),nums.indexOf(answer),a+' + '+b+' = '+answer,'direction',{stim:a+' + '+b,limit:limit+.8,tag:'NUMBER GATE'})}
  if(kind==='sequence'){const step=1+rand(5),first=rand(12),correct=first+step*3;const nums=W.shuffle([correct,correct+step,correct-step,correct+2*step],state.rng);return choiceQuestion('次にくる数は？',nums.map(String),nums.indexOf(correct),step+' ずつ増えるので次は '+correct,'direction',{stim:[first,first+step,first+step*2,'?'].join(' · '),limit:limit+1.2,tag:'SEQUENCE GATE'})}
  const palette=[['LIME','#c9ff6d'],['CORAL','#ffa283'],['CYAN','#74dbe4'],['VIOLET','#c3a1ff']],ink=rand(4),word=rand(4);return choiceQuestion('文字の「色」を選ぶ',palette.map(p=>p[0]),ink,'書かれている単語ではなく、文字の色は '+palette[ink][0],'direction',{stim:palette[word][0],ink:palette[ink][1],limit:limit+.5,tag:'COLOR GATE'});
 }
 function compareQuestion(){
  let category=variant==='number'?'number':['film','tower','number','film'][rand(4)],q;
  if(category==='film'){const a=C.films[rand(C.films.length)],b=C.films.filter(x=>x!==a)[rand(C.films.length-1)];q={title:'「'+a[0]+'」の公開年は？',ask:a[1],ref:b[1],askName:a[0],refName:b[0],unit:'年',label:'CINEMA ARCHIVE',source:C.sources.ghibli,options:['新しい ↑','同じ →','古い ↓']}}
  else if(category==='tower'){const a=rand(2)===0?['東京スカイツリー',634,C.sources.skytree]:['東京タワー',333,C.sources.tower];const ref=[300,333,500,634,700][rand(5)];q={title:a[0]+'の高さは？',ask:a[1],ref,askName:a[0],refName:'基準の高さ',unit:'m',label:'CITY LANDMARK',source:a[2],options:['高い ↑','同じ →','低い ↓']}}
  else{const a=10+rand(40),b=2+rand(14),product=state.rng()>.5,answer=product?a*b:a+b,ref=answer+[-10,0,5,15][rand(4)];q={title:a+(product?' × ':' + ')+b+' の答えは？',ask:answer,ref,askName:'計算の答え',refName:'基準の数',unit:'',label:'NUMBER ORBIT',options:['大きい ↑','同じ →','小さい ↓']}}
  return choiceQuestion(q.title,q.options,q.ask>q.ref?0:q.ask===q.ref?1:2,q.askName+'：'+q.ask+q.unit+' / '+q.refName+'：'+q.ref+q.unit,'compare',{...q,limit:Math.max(6,15-state.answered*.45)});
 }
 function truthQuestion(){
  let row;if(variant==='logic'||state.rng()<.35){const a=2+rand(40),b=1+rand(25),right=state.rng()<.5,c=a+b+(right?0:1+rand(5));row=[a+' + '+b+' = '+c,right,'ロジック','正しい計算は '+a+' + '+b+' = '+(a+b)+'。']}
  else{row=state.truthDeck[state.answered%state.truthDeck.length]}
  return choiceQuestion(row[0],['○ TRUE','× FALSE'],row[1]?0:1,row[3],'truth',{label:row[2],limit:Infinity});
 }
 function phraseQuestion(){
  const voyage=meta.type==='voyage';let chapter=Math.min(2,Math.floor(state.answered/4)),group;
  if(voyage)group=variant==='mix'?chapter:2;else group=variant==='basic'?0:variant==='idiom'?1:variant==='travel'?2:chapter;
  const deck=voyage&&variant==='travel'?state.voyageDecks[chapter]:state.phraseDecks[group],row=deck[(!voyage&&variant!=='mix'?state.answered:state.answered%4)%deck.length];const wrong=W.shuffle(C.phrases.filter(p=>(voyage&&variant==='travel'?p[4]===row[4]:p[3]===group)&&p[0]!==row[0]),state.rng).slice(0,3);const correctText=voyage?row[0]:row[1],choices=W.shuffle([correctText,...wrong.map(p=>voyage?p[0]:p[1])],state.rng);
  return choiceQuestion(voyage?row[2]:row[0],choices,choices.indexOf(correctText),row[0]+'：'+row[1]+'。'+row[2]+'ときに使う。',voyage?'voyage':'phrase',{spoken:row[0],meaning:row[1],context:row[2],label:voyage?['DEPARTURE / AIRPORT','CHECK-IN / HOTEL','DISCOVERY / CITY'][chapter]:['CHAPTER 01 / EVERYDAY','CHAPTER 02 / IDIOMS','CHAPTER 03 / TRAVEL'][chapter],limit:18,sceneIcon:voyage?['✈','⌂','✦'][chapter]:null});
 }
 function kidsQuestion(){
  const stage=Math.min(2,Math.floor(state.answered/4)),kind=variant==='count'?'count':['size','count','number'][stage];const largest=state.rng()>.25;const values=W.shuffle(kind==='size'?[.40,.58,.76,.96]:[1+rand(2),3+rand(2),5+rand(2),7+rand(2)],state.rng);const max=largest?Math.max(...values):Math.min(...values),answer=values.indexOf(max);const sameSprite=rand(8);const sprites=values.map(()=>kind==='size'?sameSprite:8+rand(4));
  const title=kind==='size'?(largest?'いちばん おおきい えは？':'いちばん ちいさい えは？'):kind==='count'?(largest?'いちばん かずが おおいのは？':'いちばん かずが すくないのは？'):(largest?'いちばん おおきい すうじは？':'いちばん ちいさい すうじは？');
  return choiceQuestion(title,values.map((v,i)=>kind==='size'?(i+1)+'ばんの '+C.objects[sprites[i]]:kind==='count'?C.objects[sprites[i]]+' '+v+'こ':String(v)),answer,kind==='size'?'えの おおきさを くらべよう。':max+' が いちばん '+(largest?'おおい':'すくない')+'ね。','kids',{values,sprites,kidKind:kind,limit:Infinity,label:['もりの いりぐち','くだもの ひろば','すうじの おか'][stage]});
 }
 function makeQuestion(){if(practicePool&&state.poolIndex<practicePool.length)return{...practicePool[state.poolIndex++],limit:Infinity};return meta.type==='reflex'?reflexQuestion():meta.type==='compare'?compareQuestion():meta.type==='truth'?truthQuestion():meta.type==='kids'?kidsQuestion():phraseQuestion()}
 function nextQuestion(){if(state.phase!=='playing')return;if(state.answered>=state.goal&&meta.type!=='truth'){finish(true);return}if(mode==='practice'&&state.answered>=state.goal){finish(true);return}state.q=makeQuestion();state.qElapsed=0;state.locked=false;state.stake=1;$('feedback').className='answer-feedback';renderQuestion();hud()}
 function sprite(index,size=100){return'<span class="object-sprite" style="width:'+size+'%;background-position:'+(index%4*100/3)+'% '+(Math.floor(index/4)*100/3)+'%"></span>'}
 function renderQuestion(){
  const q=state.q;let content='<span class="stage-label">'+esc(q.tag||q.label||'WORLD '+(meta.art+1))+'</span>';
  if(q.kind==='direction')content+='<h2 class="question-title instruction">'+esc(q.title)+'</h2><div class="pulse-console"><div class="pulse-ring ring-outer"></div><div class="pulse-ring ring-inner"></div><div class="pulse-traces"></div><div class="pulse-display"><span class="instrument-label">INCOMING SIGNAL</span><div class="stimulus" '+(q.ink?'style="color:'+q.ink+'"':'')+'>'+esc(q.stim)+'</div><span class="instrument-label">SELECT GATE / ↑ → ↓ ←</span></div>';
  else if(q.kind==='compare')content+='<div class="tower-scene"><div class="tower-shaft">'+Array.from({length:12},(_,i)=>'<i class="'+(i<state.answered?'lit':'')+'" style="--floor:'+i+'"></i>').join('')+'</div><div class="tower-readout"><span>REFERENCE</span><b>'+esc(q.ref+q.unit)+'</b><small>'+esc(q.refName)+'</small></div><div class="tower-readout mystery"><span>UNKNOWN</span><b>?</b><small>'+esc(q.askName)+'</small></div><div class="tower-altitude">'+String(state.answered+1).padStart(2,'0')+'<small>FLOOR</small></div></div><div class="question-panel"><h2 class="question-title">'+esc(q.title)+'</h2><div class="tower-reference">'+esc(q.refName)+' <b>'+esc(q.ref+q.unit)+'</b> とくらべて…</div></div><div class="confidence-toggle"><span>リスクを選ぶ</span><button id="confidence-button">通常 ×1</button></div>';
  else if(q.kind==='truth')content+='<div class="reactor-stage"><div class="reactor-orbit"></div><div class="reactor-orbit second"></div><div class="signal-core '+(state.combo>=5?'fever':'')+'">'+ornament('crystal')+'</div><div class="reactor-base"></div><span class="reactor-caption">'+(state.combo>=5?'FEVER / ENERGY ×2':'SIGNAL REACTOR')+'</span></div><div class="question-panel"><h2 class="question-title">'+esc(q.title)+'</h2><small>この信号は正しい？</small></div>';
  else if(q.kind==='phrase')content+='<div class="phrase-scene"><div class="book-spine"></div><div class="book-page left-page"><span class="book-chapter">THE PHRASE ATLAS</span><span class="book-illustration" aria-hidden="true">✧</span><small>WORDS OPEN WORLDS</small><span class="page-number">'+String(state.answered+1).padStart(2,'0')+'</span></div><div class="book-page right-page"><span class="book-chapter">READ THE EXPRESSION</span><h2 class="question-title">'+esc(q.title)+'</h2><button class="speak-button" id="speak-button">♫ 発音を聞く</button><small>どんな意味の表現？</small></div></div>';
  else if(q.kind==='voyage')content+='<div class="travel-route"><span class="'+(state.answered<4?'current':'')+'">01 AIRPORT</span><i></i><span class="'+(state.answered>=4&&state.answered<8?'current':'')+'">02 HOTEL</span><i></i><span class="'+(state.answered>=8?'current':'')+'">03 CITY</span></div><div class="voyage-scene"><div class="ticket-stub"><span>ARCADE EXPRESS</span><b>'+['AIR','HTL','CTY'][Math.min(2,Math.floor(state.answered/4))]+'</b><small>BOARDING PASS</small><div class="ticket-barcode"></div></div><div class="ticket-body"><span class="ticket-caption">SCENE '+String(state.answered+1).padStart(2,'0')+' / YOUR NEXT LINE</span><h2 class="question-title">'+esc(q.title)+'</h2><div class="voyage-ticket">この場面で、どの一言が合う？</div></div><div class="ticket-stamp">READY<br>TO GO</div></div>';
  else if(q.kind==='kids')content+='<div class="forest-path">'+Array.from({length:12},(_,i)=>'<span class="forest-node '+(i<state.answered?'done':i===state.answered?'current':'')+'">'+(i<state.answered?'✓':i+1)+'</span>').join('')+'</div><div class="forest-guide">'+ornament('fox')+'<div class="forest-sign"><small>もりの ともだちと あそぼう</small><h2 class="question-title">'+esc(q.title)+'</h2></div></div>';
  let grid=q.kind==='direction'?'direction-grid':q.kind==='truth'?'truth-buttons':q.kind==='compare'?'compare-choices':q.kind==='kids'?'forest-choices':'';
  content+='<div class="choice-grid '+grid+'">'+q.options.map((option,i)=>{let body;
   if(q.kind==='kids'){body=q.kidKind==='size'?'<div class="object-frame">'+sprite(q.sprites[i],q.values[i]*100)+'</div><span>'+esc(option)+'</span>':q.kidKind==='count'?'<div class="fruit-count">'+Array.from({length:q.values[i]},()=>sprite(q.sprites[i],100).replace('width:100%;','')).join('')+'</div><span>'+esc(C.objects[q.sprites[i]])+'</span>':'<span class="forest-number">'+q.values[i]+'</span>';body+='<span class="forest-key">'+(i+1)+'</span>'}
   else if(q.kind==='truth')body='<span class="gate-symbol">'+(i===0?'○':'×')+'</span><span class="gate-word">'+(i===0?'TRUE':'FALSE')+'<small>'+(i===0?'正しい信号':'間違った信号')+'</small></span><span class="answer-key">'+(i+1)+'</span>';
   else if(q.kind==='compare')body='<span class="lever-icon">'+['↑','＝','↓'][i]+'</span><span>'+esc(option)+'</span><span class="answer-key">'+(i+1)+'</span>';
   else body='<span class="answer-key">'+(q.kind==='direction'?['↑','→','↓','←'][i]:i+1)+'</span><span>'+esc(option)+'</span>';
   return'<button class="answer-button" data-answer="'+i+'">'+body+'</button>'}).join('')+'</div>';
  if(q.kind==='direction')content+='</div>';
  if(Number.isFinite(q.limit)&&mode!=='practice')content+='<div class="question-timer"><i id="question-fill" style="width:100%"></i></div>';
  $('play-stage').classList.remove('impact-good','impact-bad');$('play-stage').innerHTML='<div class="quiz-stage scene-'+q.kind+' '+(q.kind==='kids'?'forest-stage':'')+'">'+content+'</div>';
  document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.answer)));
  if($('confidence-button'))$('confidence-button').onclick=()=>{if(state.locked)return;state.stake=state.stake===1?2:1;$('confidence-button').textContent=state.stake===1?'通常 ×1':'強気 ×2 / ミスも2';$('confidence-button').classList.toggle('active',state.stake===2)};
  if($('speak-button')){$('speak-button').disabled=!('speechSynthesis' in window);$('speak-button').onclick=()=>speak(q.spoken)}
 }
 function speak(text){if(!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.85;u.volume=W.sound.volume;const voice=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('en'));if(voice)u.voice=voice;window.speechSynthesis.speak(u)}
 function answer(index,timeout=false){
  if(state.phase!=='playing'||state.paused||state.locked||!state.q)return;const q=state.q;state.locked=true;state.answered++;
  const correct=!timeout&&index===q.correct;const speed=Number.isFinite(q.limit)?Math.max(0,1-state.qElapsed/(q.limit*1000)):.5;
  if(correct){state.correct++;if(q.spoken)state.learned.push({phrase:q.spoken,meaning:q.meaning,context:q.context});state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);let points=Math.round((100+speed*100+Math.min(150,state.combo*12))*state.stake);if(state.combo>=5&&meta.type==='truth')points*=2;state.score+=points;W.sound.cue('good')}
  else{state.combo=0;if(mode!=='practice'&&meta.type!=='kids'&&meta.type!=='phrase'&&meta.type!=='voyage')state.lives-=state.stake;state.mistakes.push({...q,selected:timeout?'TIME UP':q.options[index]});W.sound.cue('bad')}
  document.querySelectorAll('[data-answer]').forEach(b=>{const value=Number(b.dataset.answer);b.disabled=true;b.classList.toggle('correct',value===q.correct);b.classList.toggle('wrong',!correct&&value===index)});
  visualHit(correct);const kid=meta.type==='kids';$('feedback').textContent=kid?(correct?'せいかい！ '+q.reason:'だいじょうぶ。 '+q.reason):(correct?'PERFECT SIGNAL +'+Math.round((100+speed*100+Math.min(150,state.combo*12))*state.stake):'正解：'+q.options[q.correct]);$('feedback').className='answer-feedback visible '+(correct?'good':'bad');
  state.feedbackUntil=state.elapsed+(meta.type==='truth'?420:meta.type==='reflex'?450:kid?1150:1250);hud();
 }
 function hud(){
  $('hud-score').textContent=Math.floor(state.score).toLocaleString();$('hud-combo').textContent=state.combo>1?(state.combo>=5?'FEVER · ':'')+state.combo+' COMBO':'';
  $('hud-lives').textContent=mode==='practice'?'∞':meta.type==='typing'?'⌨':meta.type==='kids'?'✦ '.repeat(Math.min(3,1+Math.floor(state.correct/4))):meta.type==='phrase'||meta.type==='voyage'?'✦ '.repeat(3):'♥ '.repeat(Math.max(0,state.lives))+'♡ '.repeat(Math.max(0,3-state.lives));
  if(meta.type==='dodge'){$('hud-stage').textContent=['STARDUST ROUTE','AURORA SEA','CORE GATE / BOSS'][dodge.lastStage<0?0:dodge.lastStage];$('hud-time').textContent=variant==='endless'&&mode!=='practice'?dodge.time.toFixed(1)+'s':Math.max(0,dodge.duration-dodge.time).toFixed(1)+'s';$('run-progress').style.width=Math.min(100,dodge.time/dodge.duration*100)+'%'}
  else if(meta.type==='typing'){$('hud-stage').textContent=variant==='kana'?'KANA STREAM':'KEYSTREAM / '+(1+Math.floor(state.correct/8));$('hud-time').textContent=mode==='practice'?'PRACTICE':Math.max(0,45-state.elapsed/1000).toFixed(1)+'s';$('run-progress').style.width=(mode==='practice'?state.correct/12*100:Math.max(0,100-state.elapsed/45000*100))+'%'}
  else if(meta.type==='truth'){$('hud-stage').textContent=state.combo>=5?'FEVER SIGNAL ×2':'SIGNAL '+(1+Math.floor(state.correct/5));$('hud-time').textContent=mode==='practice'?(state.answered+1)+' / '+state.goal:Math.max(0,45-state.elapsed/1000).toFixed(1)+'s';$('run-progress').style.width=(mode==='practice'?state.answered/state.goal*100:Math.max(0,100-state.elapsed/45000*100))+'%'}
  else{$('hud-stage').textContent=meta.type==='compare'?'FLOOR '+Math.min(12,state.answered+1)+' / 12':meta.type==='kids'?'もりの たび '+Math.min(12,state.answered+1)+' / 12':'STAGE '+(Math.min(2,Math.floor(state.answered/(meta.type==='reflex'?8:4)))+1)+' / 3';$('hud-time').textContent=Math.min(state.answered+1,state.goal)+' / '+state.goal;$('run-progress').style.width=state.answered/state.goal*100+'%'}
  if($('question-fill')&&state.q&&!state.locked)$('question-fill').style.width=Math.max(0,100-state.qElapsed/(state.q.limit*1000)*100)+'%';
 }
 function finish(cleared=false,quit=false){
  if(state.phase==='result'||state.phase==='lobby')return;
  state.phase='result';state.paused=false;state.cleared=cleared;W.sound.stop();if('speechSynthesis' in window)window.speechSynthesis.cancel();$('pause-overlay').hidden=true;$('pause-button').disabled=true;
  const accuracy=state.answered?Math.round(state.correct/state.answered*100):0;
  const grade=meta.type==='dodge'?(cleared?'S':dodge.time>=60?'A':dodge.time>=30?'B':'C'):accuracy>=95&&cleared?'S':accuracy>=80?'A':accuracy>=60?'B':'C';
  const result={slug:meta.slug,mode,variant,score:Math.floor(state.score),correct:state.correct,total:state.answered,maxCombo:state.maxCombo,cleared,accuracy,duration:Math.round(state.elapsed/1000),daily:mode==='daily',learned:state.learned,mistakes:state.mistakes.map(q=>({title:q.title,answer:q.options[q.correct],reason:q.reason,source:q.source||null})),quit};
  const rewards=W.save(result);$('result-rank').textContent=grade;$('result-tag').textContent=rewards.newBest?'NEW PERSONAL BEST / '+mode.toUpperCase():'RUN COMPLETE / '+mode.toUpperCase();$('result-title').textContent=meta.type==='kids'?'もりの ぼうけん、おつかれさま！':cleared?'WORLD CLEARED!':quit?'また、次の冒険へ。':'次の挑戦で、もう一歩先へ。';$('result-score').textContent=result.score.toLocaleString();
  const metrics=meta.type==='dodge'?[[dodge.time.toFixed(1)+'s','生存時間'],[dodge.grazes,'GRAZE'],[dodge.dashes,'DASH']]:meta.type==='typing'?[[state.correct,'WORDS'],[state.typedKeys?Math.max(0,Math.round((state.typedKeys-state.wrongKeys)/state.typedKeys*100))+'%':'—','KEY ACCURACY'],[state.maxCombo,'MAX COMBO']]:[[state.correct+' / '+state.answered,'正解'],[accuracy+'%','正解率'],[state.maxCombo,'MAX COMBO']];
  $('result-metrics').innerHTML=metrics.map(([v,l])=>'<div><b>'+esc(v)+'</b><span>'+l+'</span></div>').join('');$('result-rewards').innerHTML='<strong>+'+rewards.xp+' XP · LV. '+rewards.level+'</strong>'+(rewards.leveled?'<b>LEVEL UP! 新しいカラーをコレクションで確認。</b><br>':'')+(rewards.learnedNew?'<span class="unlock">PHRASE BOOK +'+rewards.learnedNew+'</span>':'')+rewards.unlocks.map(a=>'<span class="unlock">✦ '+a[1]+'</span>').join('');
  $('review-list').hidden=!state.mistakes.length;$('review-list').open=false;$('review-list').querySelector('div').innerHTML=state.mistakes.map((q,i)=>'<div class="review-item"><b>'+esc(q.title)+'</b><strong>正解：'+esc(q.options[q.correct])+'</strong><span>'+esc(q.reason)+'</span>'+(q.spoken?'<br><button class="speak-button" data-review-speak="'+i+'">正解の発音を聞く ♫</button>':'')+(q.source?'<br><a href="'+q.source+'" target="_blank" rel="noopener">出典を読む ↗</a>':'')+'</div>').join('');
  document.querySelectorAll('[data-review-speak]').forEach(b=>{b.disabled=!('speechSynthesis' in window);b.onclick=()=>W.speak(state.mistakes[Number(b.dataset.reviewSpeak)].spoken)});
  $('review-button').hidden=!state.mistakes.length||meta.type==='typing';$('review-button').onclick=()=>{const mistakes=state.mistakes.slice();state.phase='result';start(mistakes)};view('result-view');$('result-view').scrollTop=0;W.sound.cue(cleared?'win':'tick');
 }
 function pause(value=!state.paused){if(!['countdown','playing'].includes(state.phase))return;state.paused=value;if(value&&dodge){dodge.keys.clear();dodge.pointer=null}$('pause-overlay').hidden=!value;lastFrame=performance.now();if(value){W.sound.stop();if('speechSynthesis' in window)window.speechSynthesis.cancel();$('resume-button').focus()}else{if(state.phase==='playing')W.sound.start(meta.type);if(meta.type==='typing')$('typing-input').focus({preventScroll:true})}}
 $('pause-button').onclick=()=>pause();$('resume-button').onclick=()=>pause(false);$('quit-button').onclick=()=>finish(false,true);
 $('sound-button').onclick=()=>{$('sound-panel').hidden=!$('sound-panel').hidden;$('sound-button').setAttribute('aria-expanded',String(!$('sound-panel').hidden))};$('volume-range').value=Math.round(W.sound.volume*100);$('volume-range').oninput=e=>{W.sound.set(Number(e.target.value)/100);$('sound-button').textContent=Number(e.target.value)===0?'♪̸':'♫'};
 document.addEventListener('pointerdown',e=>{if(!$('sound-panel').hidden&&!$('sound-panel').contains(e.target)&&e.target!==$('sound-button')){$('sound-panel').hidden=true;$('sound-button').setAttribute('aria-expanded','false')}});
 $('fullscreen-button').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('fullscreen-button').textContent='—';$('fullscreen-button').title='このブラウザは全画面非対応です'}};
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true)});window.addEventListener('blur',()=>{if(meta.type==='dodge')pause(true)});
 // Full input strings support mobile keyboards and IME; only completed compositions are judged.
 function buildTyping(){
  $('play-stage').innerHTML='<div class="typing-stage"><span class="stage-label">'+(variant==='kana'?'ことばの レーン':'RIDE THE KEYSTREAM')+'</span><div class="typing-lanes"><span class="lane-preview" id="preview-1"></span><span class="lane-preview" id="preview-2"></span><span class="lane-preview" id="preview-3"></span><span class="typing-star" id="typing-star">'+ornament('ship')+'</span><div class="typing-target" id="typing-target"></div></div><div class="physical-keyboard" aria-hidden="true">'+['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].map(row=>'<div>'+[...row].map(k=>'<span data-visual-key="'+k.toLowerCase()+'">'+k+'</span>').join('')+'</div>').join('')+'</div><input id="typing-input" class="typing-input" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="表示された単語を入力" placeholder="ここをタップして入力" '+(variant==='english'?'inputmode="text"':'')+'><div class="typing-meter"><span id="typing-accuracy">KEY ACCURACY 100%</span><span id="typing-speed">0.0 KEYS / SEC</span></div><p class="typing-help">'+(variant==='kana'?'ひらがなで入力。変換が終わったら判定します。':'英字で入力。間違えた文字は消して直せます。')+'</p></div>';
  const input=$('typing-input');let composing=false;input.addEventListener('compositionstart',()=>composing=true);input.addEventListener('compositionend',()=>{composing=false;typed(input.value)});input.addEventListener('input',e=>{if(!composing&&!e.isComposing)typed(input.value)});
 }
 function normalize(t){return t.normalize('NFKC').toLowerCase()}
 function setWord(){if(state.phase!=='playing')return;state.target=normalize(state.words[state.wordIndex]);state.typed='';state.lastInput='';state.typingLocked=false;state.wordStarted=state.elapsed;$('typing-input').value='';$('typing-input').classList.remove('miss');renderWord();for(let i=1;i<=3;i++)$('preview-'+i).textContent=state.words[state.wordIndex+i]||'';if(mode==='practice'&&state.correct>=12)finish(true)}
 function renderWord(){const n=state.typed.length;document.querySelectorAll('[data-visual-key]').forEach(k=>k.classList.toggle('key-lit',k.dataset.visualKey===state.target[n-1]));$('typing-target').innerHTML='<span class="typed">'+esc(state.target.slice(0,n))+'</span><span class="untyped">'+esc(state.target.slice(n))+'</span>';if($('typing-star'))$('typing-star').style.left=(16.6+33.3*(state.wordIndex%3))+'%'}
 function typed(value){
  if(state.phase!=='playing'||state.paused||state.typingLocked)return;const current=normalize(value);if(current===state.lastInput)return;const added=Math.max(0,current.length-state.lastInput.length);state.typedKeys+=added;state.lastInput=current;
  if(state.target.startsWith(current)){state.typed=current;$('typing-input').classList.remove('miss');renderWord();if(added)W.sound.cue('tick');if(current===state.target){state.typingLocked=true;visualHit(true);state.correct++;state.answered++;state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);const time=state.elapsed-state.wordStarted;state.score+=state.target.length*40+Math.max(0,Math.round(150-time/25))+Math.min(200,state.combo*20);W.sound.cue('good');state.feedbackUntil=state.elapsed+150;hud()}}
  else{visualHit(false);state.wrongKeys+=Math.max(1,added);state.combo=0;$('typing-input').classList.add('miss');W.sound.cue('bad')}
  $('typing-accuracy').textContent='KEY ACCURACY '+(state.typedKeys?Math.max(0,Math.round((state.typedKeys-state.wrongKeys)/state.typedKeys*100)):100)+'%';$('typing-speed').textContent=(state.typedKeys/Math.max(.5,state.elapsed/1000)).toFixed(1)+' KEYS / SEC';
 }
 // The bullet engine uses its own seeded spawn schedule; decorative randomness cannot change the daily patterns.
 function buildDodge(){
  $('play-stage').innerHTML='<div class="dodge-stage"><div class="dodge-board" id="dodge-board"><canvas id="dodge-canvas" width="480" height="680" aria-label="弾よけのプレイ領域"></canvas><div class="dodge-help"><span>白点を守れ / 中央 ×2 / SAFE 低得点</span><span id="dash-ready">DASH READY</span></div><div class="boss-bar" id="boss-bar" hidden><i></i></div><button class="dash-button" id="dash-button" aria-label="無敵ダッシュ">DASH<br>SPACE</button></div><aside class="dodge-side"><h3>NEON DRIFT</h3><p>弾をかすめると GRAZE。<br>シールドは自動で身を守る。<br>機体の白い光点を弾から守ろう。</p><p>3つの航路を突破するとボスゲートへ。</p><p>ドラッグ / 矢印 / WASD<br>SPACE：無敵ダッシュ<br>ESC：一時停止</p></aside></div>';
  dodge={time:0,duration:mode==='practice'?60:90,player:{x:240,y:560},bullets:[],pickups:[],particles:[],keys:new Set(),pointer:null,invulnerable:0,cooldown:0,shield:0,grazes:0,dashes:0,nextSpawn:0,nextPickup:7,spawnIndex:0,lastStage:-1};
  const board=$('dodge-canvas');const holder=document.querySelector('.dodge-stage');const fit=()=>{const aside=document.querySelector('.dodge-side');const extra=aside&&getComputedStyle(aside).display!=='none'?180:0;const width=Math.min(holder.clientWidth-extra,holder.clientHeight*480/680,480);if(width>0){$('dodge-board').style.width=width+'px';$('dodge-board').style.height=width*680/480+'px'}};if(dodgeResizeObserver)dodgeResizeObserver.disconnect();if(typeof ResizeObserver!=='undefined'){dodgeResizeObserver=new ResizeObserver(fit);dodgeResizeObserver.observe(holder)}fit();function point(e){const r=board.getBoundingClientRect();return{x:Math.max(8,Math.min(472,(e.clientX-r.left)/r.width*480)),y:Math.max(55,Math.min(670,(e.clientY-r.top)/r.height*680))}}
  board.onpointerdown=e=>{dodge.pointer=point(e);board.setPointerCapture(e.pointerId)};board.onpointermove=e=>{if(dodge.pointer)dodge.pointer=point(e)};board.onpointerup=()=>dodge.pointer=null;board.onpointercancel=()=>dodge.pointer=null;$('dash-button').onclick=dash;
 }
 function dash(){if(state.phase!=='playing'||state.paused||!dodge||dodge.cooldown>0)return;const p=dodge.player,dx=(dodge.pointer?.x||p.x)-p.x,dy=(dodge.pointer?.y||p.y-120)-p.y;const length=Math.hypot(dx,dy)||1;p.x=Math.max(10,Math.min(470,p.x+dx/length*85));p.y=Math.max(65,Math.min(670,p.y+dy/length*85));dodge.invulnerable=.65;dodge.cooldown=5;dodge.dashes++;burst(p.x,p.y,meta.color,12);visualHit(true);W.sound.cue('dash')}
 function bullet(x,y,vx,vy,r=4,color='#ce8dff'){dodge.bullets.push({x,y,vx,vy,r,color,grazed:false})}
 function spawn(){const stage=Math.min(2,Math.floor((variant==='endless'&&mode!=='practice'?dodge.time%dodge.duration:dodge.time)/(dodge.duration/3))),n=dodge.spawnIndex++,progress=dodge.time/dodge.duration;
  if(stage===0){for(let i=0;i<4;i++)bullet(18+state.rng()*444,-12,(state.rng()-.5)*20,125+progress*90,4,n%2?'#b2ebfa':'#f3abd8')}
  else if(stage===1){if(n%3===0){const side=n%2;for(let i=0;i<5;i++)bullet(side?490:-10,70+i*76,side?-135:135,40+i*7,4,'#82efdc')}else{const center=40+state.rng()*400;for(let i=0;i<7;i++)bullet(center,-10,(i-3)*22,165,4,'#c9a0ff')}}
  else{const cx=240,cy=105,count=14;const turn=n*.22;for(let i=0;i<count;i++){const angle=Math.PI*2*i/count+turn;bullet(cx,cy,Math.cos(angle)*145,Math.sin(angle)*145,4,'#f29dda')}if(n%3===0){const angle=Math.atan2(dodge.player.y-cy,dodge.player.x-cx);[-.14,0,.14].forEach(a=>bullet(cx,cy,Math.cos(angle+a)*210,Math.sin(angle+a)*210,5,'#e4ff8c'))}}
 }
 function burst(x,y,color,count){for(let i=0;i<(reduced?3:count);i++){const a=Math.PI*2*i/count;dodge.particles.push({x,y,vx:Math.cos(a)*90,vy:Math.sin(a)*90,life:.7,color})}}
 function updateDodge(dt,raw){
  const d=dodge,p=d.player;d.time+=raw/1000;d.invulnerable=Math.max(0,d.invulnerable-dt);d.cooldown=Math.max(0,d.cooldown-dt);const cycleTime=variant==='endless'&&mode!=='practice'?d.time%d.duration:d.time;const stage=Math.min(2,Math.floor(cycleTime/(d.duration/3)));if(stage!==d.lastStage){d.lastStage=stage;burst(p.x,p.y,meta.color,18)}
  let dx=(d.keys.has('ArrowRight')||d.keys.has('d')?1:0)-(d.keys.has('ArrowLeft')||d.keys.has('a')?1:0),dy=(d.keys.has('ArrowDown')||d.keys.has('s')?1:0)-(d.keys.has('ArrowUp')||d.keys.has('w')?1:0);if(dx||dy){const len=Math.hypot(dx,dy);p.x+=dx/len*270*dt;p.y+=dy/len*270*dt}
  if(d.pointer){const x=d.pointer.x-p.x,y=d.pointer.y-p.y,length=Math.hypot(x,y);const step=Math.min(length,490*dt);if(length){p.x+=x/length*step;p.y+=y/length*step}}
  p.x=Math.max(8,Math.min(472,p.x));p.y=Math.max(58,Math.min(672,p.y));const safe=p.y>535&&(p.x<75||p.x>405),bonus=p.x>150&&p.x<330&&p.y>230&&p.y<520;state.score+=dt*(safe?9:bonus?80:40);
  let catchup=0;while(d.time>=d.nextSpawn&&catchup++<8){spawn();d.nextSpawn+=stage===0?.66:stage===1?.78:.83}if(d.time>=d.nextPickup){d.pickups.push({x:40+state.rng()*400,y:-20});d.nextPickup+=10}
  for(const b of d.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;const dist=Math.hypot(b.x-p.x,b.y-p.y);if(dist<25&&!b.grazed&&!safe){b.grazed=true;d.grazes++;state.score+=35;state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);burst(p.x,p.y,'#8ef8d8',4)}if(dist<b.r+5&&!safe&&d.invulnerable<=0&&mode!=='practice'){b.y=999;if(d.shield){d.shield=0;d.invulnerable=1.5}else{state.lives--;d.invulnerable=1.8;state.combo=0;W.sound.cue('bad');visualHit(false);burst(p.x,p.y,'#ff899b',16)}}}
  d.bullets=d.bullets.filter(b=>b.y<710&&b.y>-120&&b.x>-90&&b.x<570);
  for(const item of d.pickups){item.y+=90*dt;if(Math.hypot(item.x-p.x,item.y-p.y)<24){d.shield=1;item.y=999;state.score+=80;W.sound.cue('good');burst(p.x,p.y,'#a2edcb',10)}}d.pickups=d.pickups.filter(item=>item.y<710);
  for(const t of d.particles){t.x+=t.vx*dt;t.y+=t.vy*dt;t.life-=dt}d.particles=d.particles.filter(t=>t.life>0);
  $('dash-ready').textContent=d.cooldown>0?'DASH '+d.cooldown.toFixed(1)+'s':'DASH READY';$('dash-button').disabled=d.cooldown>0;$('boss-bar').hidden=stage<2;$('boss-bar').querySelector('i').style.width=Math.max(0,(d.duration-cycleTime)/(d.duration/3)*100)+'%';
  if(state.lives<=0)finish(false);else if(d.time>=d.duration&&(variant!=='endless'||mode==='practice'))finish(true);drawDodge();
 }
 function drawDodge(){
  const ctx=$('dodge-canvas')?.getContext('2d');if(!ctx||!dodge)return;const d=dodge,p=d.player,t=d.time;
  ctx.clearRect(0,0,480,680);
  const backdrop=ctx.createLinearGradient(0,0,0,680);backdrop.addColorStop(0,'#020a1820');backdrop.addColorStop(1,'#02091ec0');ctx.fillStyle=backdrop;ctx.fillRect(0,0,480,680);
  for(let i=0;i<65;i++){const x=i*149%480,y=(i*73+(reduced?0:t*(12+i%4*15)))%680;ctx.fillStyle=i%4?'#daeaff80':'#a7ffd8';ctx.fillRect(x,y,1.3,i%4===0?4:1.3)}
  ctx.save();ctx.globalAlpha=.14;ctx.strokeStyle='#8bf7dd';ctx.lineWidth=1;for(let i=-4;i<6;i++){ctx.beginPath();ctx.moveTo(240+i*28,0);ctx.lineTo(240+i*180,680);ctx.stroke()}for(let i=0;i<10;i++){const y=(i*90+t*35)%800;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(480,y);ctx.stroke()}ctx.restore();
  ctx.fillStyle='#83e8b416';ctx.fillRect(0,535,75,145);ctx.fillRect(405,535,75,145);ctx.strokeStyle='#a6f8b850';ctx.strokeRect(1,536,74,143);ctx.strokeRect(405,536,74,143);ctx.fillStyle='#d5fff6c0';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('SAFE',38,567);ctx.fillText('SAFE',443,567);
  ctx.strokeStyle='#a9c4ff28';ctx.setLineDash([6,12]);ctx.strokeRect(150,230,180,290);ctx.setLineDash([]);ctx.fillStyle='#c4e7f790';ctx.fillText('SCORE ×2',240,252);
  function asset(col,row,x,y,w,h){if(col===0&&row===0){if(playerArt.complete&&playerArt.naturalWidth){ctx.drawImage(playerArt,x-w/2,y-h/2,w,h);return true}return false}if(artSprites.complete&&artSprites.naturalWidth){const sw=artSprites.naturalWidth/2,sh=artSprites.naturalHeight/2;ctx.drawImage(artSprites,col*sw,row*sh,sw,sh,x-w/2,y-h/2,w,h);return true}return false}
  if(d.lastStage===2){ctx.save();const bob=reduced?0:Math.sin(t*2)*4;ctx.shadowColor='#d783ff';ctx.shadowBlur=18;const pulse=ctx.createRadialGradient(240,105,8,240,105,105);pulse.addColorStop(0,'#db66ff70');pulse.addColorStop(1,'#bd37ff00');ctx.fillStyle=pulse;ctx.fillRect(135,0,210,210);asset(1,0,240,105+bob,190,155);ctx.restore()}
  for(const b of d.bullets){ctx.save();ctx.strokeStyle=b.color+'90';ctx.lineWidth=b.r*.8;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.055,b.y-b.vy*.055);ctx.stroke();ctx.shadowColor=b.color;ctx.shadowBlur=reduced?0:10;ctx.beginPath();ctx.fillStyle=b.color;ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,b.r*.42,0,Math.PI*2);ctx.fill();ctx.restore()}
  for(const item of d.pickups){ctx.save();ctx.translate(item.x,item.y);ctx.rotate(reduced?0:t);ctx.shadowColor='#a8fabc';ctx.shadowBlur=14;ctx.strokeStyle='#a8fabc';ctx.lineWidth=2;ctx.strokeRect(-10,-10,20,20);ctx.fillStyle='#bcffda';ctx.fillRect(-3,-6,6,12);ctx.fillRect(-6,-3,12,6);ctx.restore()}
  for(const particle of d.particles){ctx.globalAlpha=Math.max(0,particle.life/.7);ctx.fillStyle=particle.color;ctx.fillRect(particle.x,particle.y,3,3)}ctx.globalAlpha=1;
  ctx.save();ctx.translate(p.x,p.y);if(d.invulnerable>0&&Math.floor(t*15)%2)ctx.globalAlpha=.45;
  const exhaust=ctx.createLinearGradient(0,10,0,55);exhaust.addColorStop(0,'#98fffbe0');exhaust.addColorStop(1,'#43d9ff00');ctx.fillStyle=exhaust;[-10,10].forEach(x=>{ctx.beginPath();ctx.moveTo(x-3,10);ctx.lineTo(x+3,10);ctx.lineTo(x,45+(reduced?0:Math.sin(t*40)*9));ctx.closePath();ctx.fill()});
  if(!asset(0,0,0,0,56,58)){ctx.fillStyle=meta.color;ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(20,14);ctx.lineTo(0,7);ctx.lineTo(-20,14);ctx.closePath();ctx.fill()}
  if(d.shield||d.invulnerable>0){ctx.strokeStyle=d.shield?'#b5ffd6':'#86dfff';ctx.lineWidth=1.6;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=15;ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.stroke()}
  ctx.restore();ctx.fillStyle='#fff';ctx.shadowColor='#6affda';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 }
 function tick(raw){
  if(state.paused||!['countdown','playing'].includes(state.phase))return;state.elapsed+=raw;
  if(state.phase==='countdown'){const n=Math.max(0,3-Math.floor(state.elapsed/800));$('countdown-number').textContent=n||'GO';if(state.elapsed>=2700)play();return}
  if(meta.type==='dodge'){updateDodge(Math.min(.05,raw/1000),raw);hud();return}
  if(meta.type==='typing'){if(state.typingLocked&&state.elapsed>=state.feedbackUntil){state.wordIndex++;setWord()}if(mode!=='practice'&&state.elapsed>=45000)finish(true);hud();return}
  if(meta.type==='truth'&&mode!=='practice'&&state.elapsed>=45000){finish(state.lives>0);return}
  if(state.locked){if(state.elapsed>=state.feedbackUntil){if(state.lives<=0&&mode!=='practice')finish(false);else nextQuestion()}}
  else{state.qElapsed+=raw;if(state.q&&Number.isFinite(state.q.limit)&&mode!=='practice'&&state.qElapsed>=state.q.limit*1000)answer(-1,true)}hud();
 }
 function frame(now){const dt=Math.max(0,now-lastFrame);lastFrame=now;tick(dt);raf=requestAnimationFrame(frame)}raf=requestAnimationFrame(frame);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(!$('sound-panel').hidden){$('sound-panel').hidden=true;return}pause();return}
  if(state.paused||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(state.phase==='lobby'&&e.key==='Enter'){e.preventDefault();start();return}if(state.phase!=='playing')return;
  if(meta.type==='dodge'){if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','w','a','s','d'].includes(e.key)){e.preventDefault();dodge.keys.add(e.key)}if(e.key===' '){e.preventDefault();dash()}return}
  if(meta.type==='typing')return;let index=-1;if(meta.type==='reflex')index=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].indexOf(e.key);else if(meta.type==='compare')index=['ArrowUp','ArrowRight','ArrowDown'].indexOf(e.key);else if(meta.type==='truth')index=['ArrowLeft','ArrowRight'].indexOf(e.key);
  if(index<0&&'1234'.includes(e.key)&&e.key.length===1)index=Number(e.key)-1;
  if(index>=0&&state.q&&index<state.q.options.length){e.preventDefault();answer(index)}
 });document.addEventListener('keyup',e=>{if(dodge)dodge.keys.delete(e.key)});window.addEventListener('blur',()=>{if(dodge)dodge.keys.clear()});
 // Non-answer diagnostics for verifying play progression.
 window.WorldsGame={start,pause,finish,get snapshot(){return{phase:state.phase,paused:state.paused,score:state.score,correct:state.correct,answered:state.answered,mode,variant,stage:Math.min(3,1+Math.floor(state.answered/4))}}};
})();
