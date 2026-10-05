"""CI-only optimistic retry prevents simultaneous Issue updates losing data."""
import json
import os
import subprocess
import time
from pathlib import Path
from manage_collection import process_event

def git(*args,check=True):return subprocess.run(['git',*args],check=check,capture_output=True,text=True)

def main():
    if os.environ.get('GITHUB_ACTIONS')!='true':raise SystemExit('This helper only runs inside GitHub Actions.')
    event=os.environ['GITHUB_EVENT_PATH'];result_path=Path(os.environ['RESULT_PATH'])
    git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com')
    number=json.loads(Path(event).read_text(encoding='utf-8'))['issue']['number']
    for attempt in range(5):
        git('fetch','origin','main');git('checkout','--detach','origin/main')
        outcome=process_event(event,'data/items.json',result_path)
        if not outcome['ok']:raise SystemExit(1)
        if not outcome['changed']:return
        git('add','data/items.json');git('commit','-m',f'chore: update vault from issue #{number}')
        if git('push','origin','HEAD:main',check=False).returncode==0:return
        time.sleep(attempt+1)
    result_path.write_text(json.dumps({'ok':False,'message':'馆藏提交发生并发冲突，请重新打开 Issue 重试。'},ensure_ascii=False),encoding='utf-8')
    raise SystemExit(1)

if __name__=='__main__':main()
