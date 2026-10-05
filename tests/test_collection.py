import importlib.util
import unittest
import json
import tempfile
from pathlib import Path

spec=importlib.util.spec_from_file_location('manager',Path(__file__).parents[1]/'scripts/manage_collection.py')
manager=importlib.util.module_from_spec(spec)
spec.loader.exec_module(manager)

def body(url='https://www.bilibili.com/video/BV1abc',category='auto',name='测试收藏'):
    return f'### 名称\n\n{name}\n\n### 分类\n\n{category}\n\n### 链接\n\n{url}\n\n### 图片 URL\n\n_No response_\n\n### 标签\n\n山海，设计,山海\n\n### 备注\n\n收藏备注'

class CollectionTests(unittest.TestCase):
    def test_detect_domains_and_image_links(self):
        for url,expected in [('https://b23.tv/abc','bilibili'),('https://m.bilibili.com/video/a','bilibili'),('https://xhslink.com/a','xiaohongshu'),('https://www.xiaohongshu.com/explore/a','xiaohongshu'),('https://example.com/art.JPG?x=1','wallpaper'),('https://bilibili.com.evil.test/a','website'),('https://example.com/','website')]:
            self.assertEqual(manager.classify(url,'auto'),expected)
        self.assertEqual(manager.classify('https://example.com/cos.jpg','cos'),'cos')

    def test_issue_retry_is_idempotent(self):
        first,result=manager.apply_issue([],42,'[ADD] 测试',body(),today='2026-09-11')
        again,result2=manager.apply_issue(first,42,'[ADD] 测试',body(),today='2026-09-12')
        self.assertEqual(first,again)
        self.assertFalse(result2['changed'])
        self.assertEqual(first[0]['category'],'bilibili')
        self.assertEqual(first[0]['tags'],['山海','设计'])

    def test_issue_edit_updates_same_item_without_changing_id_or_added(self):
        first,_=manager.apply_issue([],42,'[ADD]',body(),today='2026-09-11')
        updated,_=manager.apply_issue(first,42,'[ADD]',body(name='新标题'),today='2026-09-12')
        self.assertEqual(len(updated),1)
        self.assertEqual(updated[0]['id'],first[0]['id'])
        self.assertEqual(updated[0]['added'],'2026-09-11')
        self.assertEqual(updated[0]['title'],'新标题')

    def test_duplicate_existing_url_does_not_overwrite_existing_record(self):
        old=[{'id':'legacy','url':'https://www.bilibili.com/video/BV1abc','title':'原记录'}]
        new,result=manager.apply_issue(old,9,'[ADD]',body())
        self.assertEqual(new,old)
        self.assertFalse(result['changed'])

    def test_invalid_links_leave_input_untouched(self):
        old=[{'id':'a','title':'keep'}]
        for url in ['https://','javascript:alert(1)','http://user:secret@example.com/','not a link']:
            with self.assertRaises(ValueError): manager.apply_issue(old,42,'[ADD]',body(url=url))
        self.assertEqual(old,[{'id':'a','title':'keep'}])

    def test_remove_can_safely_repeat(self):
        items=[{'id':'a','title':'A'}]
        first,_=manager.apply_issue(items,4,'[REMOVE] a','### 条目 ID\n\na')
        again,result=manager.apply_issue(first,4,'[REMOVE] a','### 条目 ID\n\na')
        self.assertEqual(first,[])
        self.assertEqual(again,[])
        self.assertFalse(result['changed'])

    def test_event_file_updates_data_and_writes_machine_readable_result(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);event=root/'event.json';data=root/'items.json';result=root/'result.json'
            event.write_text(json.dumps({'issue':{'number':57,'title':'[ADD]','body':body('https://example.com/art.png')}}),encoding='utf-8')
            data.write_text('[]',encoding='utf-8')
            manager.process_event(event,data,result)
            self.assertTrue(json.loads(result.read_text(encoding='utf-8'))['ok'])
            item=json.loads(data.read_text(encoding='utf-8'))[0]
            self.assertEqual(item['category'],'wallpaper')
            self.assertEqual(item['image'],item['url'])
            event.write_text(json.dumps({'issue':{'number':58,'title':'[ADD]','body':body('javascript:alert(1)')}}),encoding='utf-8')
            previous=data.read_bytes();manager.process_event(event,data,result)
            self.assertFalse(json.loads(result.read_text(encoding='utf-8'))['ok'])
            self.assertEqual(data.read_bytes(),previous)

if __name__=='__main__':unittest.main()
