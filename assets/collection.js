import {normalize,selectItems,validateEntry} from './model.js';
import {readStorage,writeStorage,stateKey,resolveState} from './state.js';
import {$,esc,art,bindImages,bindDialog,openDialog,closeDialog,initChrome,labels,persist,toast,repo} from './ui.js';
import {loadCollection,getFavorites,toggleFavorite} from './repository.js';
import {createDetails} from './details.js';
initChrome('collection');
const initialSearch=location.search,initialParams=new URLSearchParams(initialSearch);
const state=resolveState(readStorage(stateKey,null),initialSearch);let data={items:[],local:[],error:false},ready=false;
// Once explicit navigation was applied, future reload/back uses the saved browsing context.
history.scrollRestoration='manual';
const saveView=()=>{if(!ready)return;state.scroll=scrollY;writeStorage(stateKey,state);};
const detail=createDetails({getItems:()=>data.items,getLocal:()=>data.local,onChange:async(reload=false)=>{if(reload)data=await loadCollection();render();}});
function renderFilters(){const cats=['all',...Object.keys(labels).filter(x=>x!=='all'),...new Set(data.items.filter(x=>!x.hidden).map(x=>x.category).filter(x=>!labels[x]))];$('#filters').innerHTML=cats.map(c=>`<button data-category="${esc(c)}" class="${state.category===c?'active':''}" aria-pressed="${state.category===c}">${esc(labels[c]||c)}<span>${data.items.filter(x=>!x.hidden&&(c==='all'||x.category===c)).length}</span></button>`).join('');}
function render(){
 const favoriteView=state.favoritesOnly;
 document.body.classList.toggle('favorites-view',favoriteView);
 document.title=(favoriteView?'我的珍藏':'万象馆藏')+' · SOVUE VAULT';
 $('#collectionTitle').firstChild.textContent=favoriteView?'我的珍藏':'万象馆藏';
 document.querySelectorAll('.header nav a').forEach(a=>{const active=favoriteView?a.href.includes('view=favorites'):a.href.includes('view=all');a.classList.toggle('nav-active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 const params=new URLSearchParams();params.set('view',favoriteView?'favorites':'all');if(state.category!=='all')params.set('category',state.category);if(state.query)params.set('q',state.query);if(state.sort!=='new')params.set('sort',state.sort);
 history.replaceState(null,'',location.pathname+'?'+params);
 const favorites=getFavorites(),arr=selectItems(data.items,{...state,favorites});renderFilters();$('#totalCount').textContent=String(data.items.filter(x=>!x.hidden&&(!state.favoritesOnly||favorites.includes(x.id))).length).padStart(2,'0');$('#resultCount').textContent=`${state.favoritesOnly?'我的珍藏':'展出'} ${String(arr.length).padStart(2,'0')} 件${state.query?' · 搜索结果':''}`;$('#favoritesFilter').setAttribute('aria-pressed',String(state.favoritesOnly));$('#grid').innerHTML=arr.map((x,i)=>`<article class="card"><button class="cover-button" data-open="${esc(x.id)}" aria-label="查看 ${esc(x.title)}">${x.image?`<img src="${esc(x.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:art(x)}<span class="cover-label">${String(i+1).padStart(2,'0')} / ${esc(labels[x.category]||x.category)}</span><span class="cover-arrow">↗</span></button><div class="card-info"><div class="card-heading"><button class="card-title" data-open="${esc(x.id)}">${esc(x.title)}</button><button class="favorite ${favorites.includes(x.id)?'selected':''}" data-favorite="${esc(x.id)}" aria-label="${favorites.includes(x.id)?'取消珍藏':'珍藏'} ${esc(x.title)}" aria-pressed="${favorites.includes(x.id)}">${favorites.includes(x.id)?'◆':'◇'}</button></div><p class="card-note">${esc(x.note||'一份值得留下的发现。')}</p><div class="card-bottom"><div class="tag-list">${x.tags.slice(0,3).map(t=>`<span>${esc(t)}</span>`).join('')}</div><time>${esc(x.added.slice(0,10).replaceAll('-','.'))}</time></div></div></article>`).join('');$('#empty').hidden=arr.length!==0;$('#loadError').hidden=!data.error;bindImages($('#grid'));}
function update(){state.scroll=0;render();writeStorage(stateKey,state);}
$('#grid').onclick=e=>{const o=e.target.closest('[data-open]'),f=e.target.closest('[data-favorite]');if(o)detail(o.dataset.open);if(f){const id=f.dataset.favorite;toggleFavorite(id);render();$('#grid').querySelector(`[data-favorite="${CSS.escape(id)}"]`)?.focus({preventScroll:true});}};
$('#filters').onclick=e=>{const b=e.target.closest('[data-category]');if(!b)return;state.category=b.dataset.category;update();$('#filters').querySelector(`[data-category="${CSS.escape(state.category)}"]`)?.focus({preventScroll:true});};
$('#searchInput').value=state.query;$('#searchInput').oninput=e=>{state.query=e.target.value;update();};$('#sortSelect').value=state.sort;$('#sortSelect').onchange=e=>{state.sort=e.target.value;update();};
$('#favoritesFilter').onclick=()=>{state.favoritesOnly=!state.favoritesOnly;update();};$('#clearBtn').onclick=()=>{state.category='all';state.query='';state.favoritesOnly=false;$('#searchInput').value='';update();};
$('#exportBtn').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data.items,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='sovue-vault-collection.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出全部馆藏 JSON');};
bindDialog($('#localDialog'));$('#issueLink').href=`https://github.com/${repo}/issues/new?template=add-item.yml`;
$('#addForm').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,x=Object.fromEntries(new FormData(form)),error=validateEntry(x);$('#formError').textContent=error;if(error)return;const item=normalize({...x,id:'local-'+crypto.randomUUID(),title:x.title.trim(),tags:x.tags.split(/[,，]/).map(t=>t.trim()).filter(Boolean),added:new Date().toISOString().slice(0,10)});persist('vault-local-items',[item,...data.local]);data=await loadCollection();state.category='all';state.query='';state.favoritesOnly=false;$('#searchInput').value='';update();closeDialog($('#localDialog'));form.reset();toast('已收入本地馆藏，请导出备份');};
let scrollTimer;addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(saveView,180);},{passive:true});addEventListener('pagehide',saveView);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveView();});
data=await loadCollection();render();
// Fixed card aspect ratios stabilize restoration even before lazy images have loaded.
requestAnimationFrame(()=>requestAnimationFrame(()=>{scrollTo({top:state.scroll,behavior:'instant'});ready=true;saveView();if(initialParams.get('local')==='1')openDialog($('#localDialog'));}));
