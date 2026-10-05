"""Pure Issue -> collection transformation, plus CLI for GitHub Actions."""
import argparse
import copy
import json
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

CATEGORIES={'auto','wallpaper','cos','bilibili','xiaohongshu','website','other'}

def field(body,name):
    match=re.search(rf'(?ms)^###\s+{re.escape(name)}\s*\n+(.*?)(?=\n###\s+|\Z)',body)
    value=match.group(1).strip() if match else ''
    return '' if value in {'_No response_','No response'} else value

def valid_url(value,optional=False):
    if not value and optional:return ''
    try:
        parsed=urlsplit(value.strip())
        if parsed.scheme not in {'http','https'} or not parsed.hostname or parsed.username or parsed.password:raise ValueError()
        if any(c.isspace() for c in value) or parsed.port==0:raise ValueError()
        return urlunsplit((parsed.scheme,parsed.netloc.lower(),parsed.path or '/',parsed.query,parsed.fragment))
    except (ValueError,AttributeError):raise ValueError('链接须为有效的 http(s) URL，且不能含账号密码或空白字符。') from None

def classify(url,category):
    if category not in CATEGORIES:raise ValueError('分类不受支持，请从表单选项中选择。')
    if category!='auto':return category
    p=urlsplit(url);host=(p.hostname or '').lower()
    def domain(value):return host==value or host.endswith('.'+value)
    if domain('bilibili.com') or domain('b23.tv'):return 'bilibili'
    if any(domain(d) for d in ('xiaohongshu.com','xhslink.com','xhslink.cn')):return 'xiaohongshu'
    if re.search(r'\.(?:png|jpe?g|webp|gif|avif)$',p.path,re.I):return 'wallpaper'
    return 'website'

def identity(url):
    try:
        p=urlsplit(valid_url(url));return urlunsplit((p.scheme,p.netloc,p.path,p.query,''))
    except ValueError:return url

def apply_issue(items,number,title,body,today=None):
    if not isinstance(items,list):raise ValueError('馆藏数据必须为数组。')
    if not isinstance(number,int) or number<1:raise ValueError('缺少有效 Issue 编号。')
    result=copy.deepcopy(items)
    if title.startswith('[REMOVE]'):
        item_id=field(body,'条目 ID') or title.removeprefix('[REMOVE]').strip()
        if not item_id:raise ValueError('请填写条目 ID。')
        result=[x for x in result if x.get('id')!=item_id]
        return result,{'changed':len(result)!=len(items),'action':'removed','id':item_id,'message':'条目已移除。' if len(result)!=len(items) else '条目已不存在，无需重复移除。'}
    if not title.startswith('[ADD]'):raise ValueError('仅支持 [ADD] 或 [REMOVE] 管理 Issue。')
    name=field(body,'名称')
    if not name or len(name)>160:raise ValueError('名称须为 1–160 个字符。')
    url=valid_url(field(body,'链接'));image=valid_url(field(body,'图片 URL'),optional=True)
    category=classify(url,field(body,'分类') or 'auto')
    if not image and category in {'wallpaper','cos'} and re.search(r'\.(?:png|jpe?g|webp|gif|avif)$',urlsplit(url).path,re.I):image=url
    tags=list(dict.fromkeys(x.strip()[:60] for x in re.split(r'[,，、;；]+',field(body,'标签')) if x.strip()))[:12]
    old=next((x for x in result if x.get('sourceIssue')==number),None)
    duplicate=next((x for x in result if identity(x.get('url',''))==identity(url) and x is not old),None)
    if duplicate:
        if old:raise ValueError('更新后的链接已属于另一件藏品，请检查重复记录。')
        return result,{'changed':False,'action':'duplicate','id':duplicate['id'],'category':duplicate.get('category','other'),'message':'相同链接已在馆藏中，未重复添加。'}
    added=old.get('added') if old else (today or datetime.now(timezone(timedelta(hours=8))).strftime('%Y-%m-%d'))
    layout=field(body,'展示尺寸') or 'auto'
    if layout not in {'auto','normal','wide','tall','large'}:layout='auto'
    entry={**(old or {}),'id':old['id'] if old else f'issue-{number}','sourceIssue':number,'title':name,'category':category,'url':url,'image':image,'note':field(body,'备注')[:20000],'tags':tags,'layout':layout,'added':added}
    if old:result[result.index(old)]=entry
    else:result.insert(0,entry)
    changed=result!=items
    return result,{'changed':changed,'action':'updated' if old else 'added','id':entry['id'],'category':category,'message':'馆藏数据已更新。' if changed else '本次内容与馆藏一致，无需重复更新。'}

def process_event(event_path,data_path,result_path):
    event=json.loads(Path(event_path).read_text(encoding='utf-8'));issue=event['issue']
    items=json.loads(Path(data_path).read_text(encoding='utf-8'))
    try:
        updated,result=apply_issue(items,issue['number'],issue.get('title',''),issue.get('body') or '')
        if result['changed']:
            path=Path(data_path);temp=path.with_suffix('.json.tmp');temp.write_text(json.dumps(updated,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');temp.replace(path)
        result['ok']=True
    except ValueError as error:
        result={'ok':False,'changed':False,'message':str(error)}
    Path(result_path).write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--event',required=True);parser.add_argument('--data',default='data/items.json');parser.add_argument('--result',required=True);args=parser.parse_args()
    outcome=process_event(args.event,args.data,args.result)
    print(outcome['message'])
    raise SystemExit(0 if outcome['ok'] else 1)
