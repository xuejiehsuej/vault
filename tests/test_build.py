import importlib.util
import re
import tempfile
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('builder',Path(__file__).parents[1]/'scripts/build_site.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)

class BuildTests(unittest.TestCase):
    def test_static_bundle_contains_all_relative_page_style_and_module_dependencies(self):
        with tempfile.TemporaryDirectory() as temp:
            target=builder.build(temp)
            for file in target.rglob('*'):
                if file.suffix not in {'.html','.css','.js'}:continue
                text=file.read_text(encoding='utf-8')
                patterns=[(r'(?:src|href)=[\"\'](\./[^\"\']+)',target),(r'url\([\"\'](\./[^\"\']+)',file.parent),(r'from\s+[\"\'](\./[^\"\']+)',file.parent),(r'new URL\([\"\'](\./[^\"\']+)',file.parent)]
                for pattern,base in patterns:
                    for ref in re.findall(pattern,text):
                        ref=ref.split('?')[0].split('#')[0]
                        self.assertTrue((base/ref).exists(),f'{file.name} references missing {ref}')
            self.assertFalse((target/'assets/app.js').exists())
            self.assertFalse((target/'scripts').exists())

if __name__=='__main__':unittest.main()
