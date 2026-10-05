import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,selectItems,safeUrl,validateEntry} from '../assets/model.js';
test('legacy collection fields and future types survive normalization',()=>{
 const x=normalize({id:'a',title:'山海',category:'audio',image:'https://a.com/a.jpg',added:'2026-09-05'});
 assert.equal(x.category,'audio'); assert.equal(x.image,'https://a.com/a.jpg'); assert.equal(x.added,'2026-09-05');
});
test('search, category and favorites intersect without exposing hidden records',()=>{
 const items=[{id:'a',title:'月亮',category:'wallpaper',tags:['山海']},{id:'b',title:'月亮',category:'website'},{id:'c',title:'月亮',category:'wallpaper',hidden:true}].map(normalize);
 assert.deepEqual(selectItems(items,{category:'wallpaper',query:'山海',favoritesOnly:true,favorites:['a']}).map(x=>x.id),['a']);
 assert.equal(selectItems(items,{}).length,2);
});
test('newest and oldest sorting uses dates rather than source order',()=>{
 const items=[{id:'a',added:'2024-01-01'},{id:'b',added:'2026-01-01'}].map(normalize);
 assert.equal(selectItems(items,{sort:'new'})[0].id,'b'); assert.equal(selectItems(items,{sort:'old'})[0].id,'a');
});
test('unsafe schemes and malformed links are rejected',()=>{
 for(const x of ['javascript:alert(1)','data:text/html,x','file:///secret','broken']) assert.equal(safeUrl(x),'');
 assert.equal(safeUrl('https://example.com'),'https://example.com/');
});
test('local collection entry requires meaningful title and safe URL',()=>{
 assert.ok(validateEntry({title:' ',url:'https://example.com'}));
 assert.ok(validateEntry({title:'测试',url:'javascript:alert(1)'}));
 assert.equal(validateEntry({title:'测试',url:'https://example.com'}),'');
});
