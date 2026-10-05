import {$,esc,art,bindImages,bindDialog,openDialog,closeDialog,repo,labels,persist,toast} from './ui.js';
import {getFavorites,toggleFavorite} from './repository.js';
export function createDetails({getItems,getLocal,onChange}){
 const dialog=$('#detailDialog');bindDialog(dialog);
 return function show(id){
  const x=getItems().find(x=>x.id===id);if(!x)return;const isLocal=getLocal().some(y=>y.id===id);
  $('#detailContent').innerHTML=`${x.image?`<div class="detail-image-wrap"><img class="detail-visual" src="${esc(x.image)}" alt="${esc(x.title)}" referrerpolicy="no-referrer"></div>`:`<div class="detail-art">${art(x)}</div>`}<div class="detail-copy"><p class="eyebrow">${esc(labels[x.category]||x.category)} / ${esc(x.added.slice(0,10))}</p><h2 id="detailTitle">${esc(x.title)}</h2><p>${esc(x.note||'暂无收藏札记。')}</p><div class="tag-list">${x.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="detail-actions">${x.url?`<a class="primary" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${['bilibili','xiaohongshu'].includes(x.category)?'前往观看':'访问原链接'} ↗</a>`:''}<button id="detailFavorite" class="secondary">${getFavorites().includes(id)?'取消珍藏 ◆':'加入珍藏 ◇'}</button>${isLocal?'<button id="removeLocal" class="secondary">移除本地收录</button>':`<a class="secondary" href="https://github.com/${esc(repo)}/issues/new?template=remove-item.yml&title=${encodeURIComponent('[REMOVE] '+x.id)}&body=${encodeURIComponent('### 条目 ID\n\n'+x.id)}" target="_blank" rel="noopener noreferrer">GitHub 管理 ↗</a>`}</div></div>`;
  bindImages($('#detailContent'));
  $('#detailFavorite').onclick=()=>{const f=toggleFavorite(id);$('#detailFavorite').textContent=f.includes(id)?'取消珍藏 ◆':'加入珍藏 ◇';onChange();};
  if(isLocal)$('#removeLocal').onclick=()=>{persist('vault-local-items',getLocal().filter(y=>y.id!==id));closeDialog(dialog);onChange(true);toast('已移除本地收录');};
  openDialog(dialog);
 };
}
