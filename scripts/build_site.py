"""Build a small, explicit static Pages artifact; no server or bundler required."""
import json
import shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PAGES=['index.html','collection.html','config.js','.nojekyll']
ASSETS=['style.css','pages.css','home.js','collection.js','details.js','ui.js','state.js','repository.js','model.js','realm.js','realm-ink-v3.png','forge-v1.png','valley-v3.png','immersion.css']

def build(destination=None):
    target=Path(destination) if destination else ROOT/'dist'
    target.mkdir(parents=True,exist_ok=True)
    for name in PAGES:shutil.copy2(ROOT/name,target/name)
    (target/'assets').mkdir(exist_ok=True)
    for name in ASSETS:shutil.copy2(ROOT/'assets'/name,target/'assets'/name)
    (target/'data').mkdir(exist_ok=True)
    items=json.loads((ROOT/'data/items.json').read_text(encoding='utf-8'))
    if not isinstance(items,list):raise ValueError('Invalid collection')
    ids=[x['id'] for x in items]
    if len(ids)!=len(set(ids)):raise ValueError('Duplicate collection IDs')
    shutil.copy2(ROOT/'data/items.json',target/'data/items.json')
    print(f'Built {len(PAGES)} entry files, {len(ASSETS)} assets, {len(items)} collection items.')
    return target

if __name__=='__main__':build()


