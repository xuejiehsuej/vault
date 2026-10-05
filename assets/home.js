import {$,initChrome,labels} from './ui.js';
import {readStorage,stateKey,cleanState} from './state.js';
import {createRealm} from './realm.js';
import {loadCollection} from './repository.js';
const chrome=initChrome('home');
let visited=false;try{visited=sessionStorage.getItem('vault-entered')==='yes';sessionStorage.setItem('vault-entered','yes');}catch{}
const realm=createRealm($('#realmCanvas'),{mode:chrome.mode,intro:!visited});
addEventListener('vault-motion',e=>realm.setMode(e.detail));
function status(){const mode=document.documentElement.dataset.motion;$('#realmStatus').textContent=!realm.available?'山海静境 · 静观万象':mode==='paused'?'静境模式 · 静观万象':mode==='reduced'?'轻动模式 · 循光而行':'金流不息 · 静观万象';}
addEventListener('realm-state',status);addEventListener('vault-motion',status);
const saved=readStorage(stateKey,null);if(saved){const s=cleanState(saved);$('#continueLink').innerHTML='继续上次浏览 <span>↗</span>';$('#resumeNote').hidden=false;$('#resumeNote').textContent=`上次停留 · ${s.favoritesOnly?'我的珍藏':labels[s.category]||s.category}${s.query?' · '+s.query:''}`;}
loadCollection().then(({items,error})=>{if(!error)$('#entranceCount').textContent=`${String(items.filter(x=>!x.hidden).length).padStart(2,'0')} 件馆藏 / 无垠之境`;});
