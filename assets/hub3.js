'use strict';
(() => {
 const games=[
 ['reflex-challenge','PULSE GATE','パルス・ゲート','反射','reflex','#c9ff6d','4方向の判断で、ゲートを突破。色・計算・逆転ルールの3ステージ。','↑↓←→ / タップ','速く正確に4方向を選ぶ。3つのステージ、24問を突破。',0],
 ['yokeru','NEON DRIFT','ネオン・ドリフト','アクション','dodge','#70efcf','かすめて、かわして、ボスを越えろ。ダッシュとシールドで90秒の航路へ。','ドラッグ / 矢印・WASD / Spaceでダッシュ','弾をよけて90秒を生き残る。かすりで加点、中央で得点2倍。',1],
 ['high-and-low','ORBIT TOWER','オービット・タワー','クイズ','compare','#ffa283','高い？低い？同じ？知識を積み上げ、12階の空中タワーを登る。','1〜3 / ↑→↓ / タップ','基準と比べて高い・同じ・低いを選ぶ。強気モードは得点も失点も2倍。',2],
 ['true-false-blitz','TRUTH SIGNAL','トゥルース・シグナル','クイズ','truth','#c3a1ff','真偽を見抜き、シグナルを増幅。連続正解でFEVERを起こせ。','← TRUE / → FALSE / タップ','45秒で真偽を判定。正解コンボで増幅、3回ミスで終了。',3],
 ['english-phrase-quiz','WORD ATELIER','ワード・アトリエ','ことば','phrase','#ffc765','表現を集め、ことばの星座を灯す。音声と復習でフレーズを自分のものに。','1〜4 / タップ / 音声','英語に合う日本語を4択から選ぶ。3章12問と、誤答だけの復習。',4],
 ['english-phrase-reverse-quiz','PHRASE VOYAGE','フレーズ・ボヤージュ','ことば','voyage','#74dbe4','空港から街へ。シーンに合う一言で、会話の旅を進める。','1〜4 / タップ / 音声','日本語のシーンに合う英語を選ぶ。3つの旅先、12問を進む。',5],
 ['typing-reflex','KEYSTREAM','キーストリーム','ことば','typing','#8baaff','文字を打って、光の流れに乗れ。英字・かなのレーンでコンボをつなぐ。','キーボード / スマホ入力','表示された単語を入力する45秒のレース。正確さと速さでレーンが輝く。',6],
 ['kids-quiz','FOREST FRIENDS','もりの くらべっこ','キッズ','kids','#9fd0ad','やさしい動物たちと、くらべる冒険。大きさ・数・数字で森を進む。','タップ / 1〜4','えの おおきさ・かず・すうじを くらべて 12もん。じかんぎれは ないよ。',7]
 ].map(([slug,en,name,category,type,color,desc,controls,rule,art])=>({slug,en,name,category,type,color,desc,controls,rule,art}));
 const get=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}},put=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v));return true}catch{return false}};
 const day=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());
 const profile=()=>Object.assign({xp:0,plays:0,clears:0,visited:[],unlocks:[],favorites:[],theme:'aurora',phraseBook:{},streak:0,lastDay:null,daily:{date:day(),plays:0,correct:0,slugs:[],claimed:[]}},get('arcade3:profile',{}));
 const records=()=>get('arcade3:records',[]);
 const achievements=[['first','FIRST CONTACT','最初のプレイを終える'],['trio','EXPLORER','3種類のゲームを遊ぶ'],['all','ALL WORLDS','8種類のゲームを遊ぶ'],['clear','GATE CRASHER','ステージを最後まで突破'],['combo','ON FIRE','8コンボをつなぐ'],['ace','PERFECT RUN','クイズを全問正解で突破'],['boss','DRIFT MASTER','弾よけで90秒を生き残る'],['streak','THREE DAYS','3日連続で遊ぶ']];
 const themes=[{id:'aurora',name:'AURORA',min:1,color:'#c9ff6d'},{id:'sunset',name:'SUNSET',min:3,color:'#ffa283'},{id:'ocean',name:'OCEAN',min:5,color:'#74dbe4'}];
 function level(p){return 1+Math.floor(p.xp/250)}
 function dailyState(p){if(p.daily?.date!==day())p.daily={date:day(),plays:0,correct:0,slugs:[],claimed:[]};return p.daily}
 function missions(p){const d=dailyState(p);return[{id:'plays',name:'3回プレイする',value:d.plays,target:3},{id:'correct',name:'15問正解する',value:d.correct,target:15},{id:'worlds',name:'3つの世界を訪れる',value:d.slugs.length,target:3}]}
 function save(result){
  const p=profile(),today=day(),old=records();let gained=[];
  const yesterday=new Date(Date.now()-86400000);const yesterdayDay=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(yesterday);
  if(p.lastDay!==today){p.streak=p.lastDay===yesterdayDay?p.streak+1:1;p.lastDay=today}
  p.plays++;if(result.cleared)p.clears++;if(!p.visited.includes(result.slug))p.visited.push(result.slug);
  const d=dailyState(p);d.plays++;d.correct+=result.correct||0;if(!d.slugs.includes(result.slug))d.slugs.push(result.slug);
  const conditions={first:true,trio:p.visited.length>=3,all:p.visited.length>=8,clear:result.cleared,combo:result.maxCombo>=8,ace:result.cleared&&result.total>0&&result.correct===result.total,boss:result.slug==='yokeru'&&result.cleared&&result.mode!=='practice',streak:p.streak>=3};
  for(const a of achievements)if(conditions[a[0]]&&!p.unlocks.includes(a[0])){p.unlocks.push(a[0]);gained.push(a)}
  let learnedNew=0;for(const word of result.learned||[]){const oldWord=p.phraseBook[word.phrase];if(!oldWord)learnedNew++;p.phraseBook[word.phrase]={meaning:word.meaning,context:word.context,hits:(oldWord?.hits||0)+1}}
  let xp=30+Math.min(120,Math.floor(result.score/50))+(result.cleared?40:0)+gained.length*30;
  for(const m of missions(p))if(m.value>=m.target&&!d.claimed.includes(m.id)){d.claimed.push(m.id);xp+=80}
  const before=level(p);p.xp+=xp;put('arcade3:profile',p);
  const entry={...result,date:new Date().toISOString(),day:today,xp};old.unshift(entry);put('arcade3:records',old.slice(0,400));
  const similar=old.slice(1).filter(r=>r.slug===result.slug&&r.mode===result.mode&&r.variant===result.variant&&(!result.daily||r.day===today));
  return{xp,learnedNew,unlocks:gained,level:level(p),leveled:level(p)>before,newBest:similar.length===0||result.score>Math.max(...similar.map(r=>r.score))};
 }
 function hash(text){let h=2166136261;for(const ch of text)h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0}
 function rng(seed){let n=hash(String(seed))||1;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296}}
 function shuffle(a,r=Math.random){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function applyTheme(){const p=profile(),t=themes.find(t=>t.id===p.theme&&level(p)>=t.min)||themes[0];document.documentElement.style.setProperty('--accent',t.color)}
 // All sound is synthesized locally. No autoplay or external audio dependency.
 const sound={ctx:null,bus:null,volume:get('arcade3:volume',.35),timer:null,step:0,
  init(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.bus=this.ctx.createGain();this.bus.gain.value=this.volume;this.bus.connect(this.ctx.destination)}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{})},
  tone(freq,when,duration=.15,vol=.15,type='sine'){if(!this.ctx||!this.bus)return;const t=this.ctx.currentTime+(when||0),o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.bus);o.start(t);o.stop(t+duration+.02)},
  cue(kind){this.init();if(kind==='good') [523,659,784].forEach((n,i)=>this.tone(n,i*.045,.18,.12));else if(kind==='bad'){this.tone(155,0,.25,.12,'triangle');this.tone(130,.06,.3,.08,'triangle')}else if(kind==='win')[523,659,784,1047,1319].forEach((n,i)=>this.tone(n,i*.09,.35,.16,'triangle'));else if(kind==='dash')this.tone(1000,0,.12,.10,'sawtooth');else this.tone(440,0,.06,.08)},
  start(type){this.init();this.stop();this.step=0;const base=type==='kids'?261.63:type==='dodge'?146.83:type==='typing'?164.81:174.61;const scale=[0,3,7,10,12,10,7,3];this.timer=setInterval(()=>{const i=this.step++,f=base*2**(scale[i%8]/12);this.tone(f,0,.22,.035,'triangle');if(i%4===0){this.tone(base/2,0,.32,.07,'sine');this.tone(60,0,.06,.10,'sine')}if(i%2===1)this.tone(1200,0,.02,.012,'square')},type==='kids'?330:220)},
  stop(){if(this.timer)clearInterval(this.timer);this.timer=null},
  set(v){this.volume=Math.max(0,Math.min(1,Number(v)||0));put('arcade3:volume',this.volume);if(this.ctx)this.bus.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.03)}
 };
 function speak(text){if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.85;u.volume=sound.volume;const voice=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('en'));if(voice)u.voice=voice;window.speechSynthesis.speak(u)}
 window.Worlds={speak,games,get,put,profile,records,achievements,themes,level,day,missions,save,rng,shuffle,esc,sound,applyTheme};applyTheme();
})();
