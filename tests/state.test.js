import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanState,resolveState} from '../assets/state.js';
test('restores the entire last browsing context with future categories',()=>{
 assert.deepEqual(resolveState({category:'audio',query:'山海',sort:'old',favoritesOnly:true,scroll:740},''),{category:'audio',query:'山海',sort:'old',favoritesOnly:true,scroll:740});
});
test('new search URL overrides previous filters and old scroll',()=>{
 assert.deepEqual(resolveState({category:'cos',query:'old',sort:'old',favoritesOnly:true,scroll:900},'?q=月亮'),{category:'all',query:'月亮',sort:'new',favoritesOnly:false,scroll:0});
});
test('explicit browse-all query does not restore old search',()=>{
 assert.equal(resolveState({query:'old',scroll:30},'?view=all').query,'');
 assert.equal(resolveState({query:'old',scroll:30},'?view=all').scroll,0);
});
test('corrupt storage is bounded and cannot create invalid scroll or sort state',()=>{
 assert.deepEqual(cleanState({category:null,query:[],sort:'bogus',favoritesOnly:'false',scroll:-4}),{category:'all',query:'',sort:'new',favoritesOnly:false,scroll:0});
 assert.equal(cleanState(null).category,'all');
});

test('favorites URL reload preserves matching context and sort',()=>{
 const saved={category:'all',query:'',sort:'old',favoritesOnly:true,scroll:922};
 assert.deepEqual(resolveState(saved,'?view=favorites&sort=old'),saved);
});
test('all navigation leaves favorites and its scroll behind',()=>{
 const next=resolveState({favoritesOnly:true,scroll:922},'?view=all');
 assert.equal(next.favoritesOnly,false);assert.equal(next.scroll,0);
});
