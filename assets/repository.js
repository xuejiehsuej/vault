import {normalize} from './model.js';
import {readStorage} from './state.js';
import {persist} from './ui.js';
export async function loadCollection(){let local=readStorage('vault-local-items',[]);if(!Array.isArray(local))local=[];let originals=[],error=false;try{const r=await fetch('./data/items.json');if(!r.ok)throw Error(r.status);const data=await r.json();if(!Array.isArray(data))throw Error('Invalid data');originals=data.map(normalize);}catch{error=true;}return {items:[...local.map(normalize),...originals],local,error};}
export function getFavorites(){const x=readStorage('vault-favorites',[]);return Array.isArray(x)?x:[];}
export function toggleFavorite(id){let x=getFavorites();x=x.includes(id)?x.filter(v=>v!==id):[...x,id];persist('vault-favorites',x);return x;}
