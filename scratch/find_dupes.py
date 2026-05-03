import re

def find_duplicates(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    blocks = {
        'en': re.search(r'en: \{(.*?)\n  es: \{', content, re.DOTALL).group(1),
        'es': re.search(r'es: \{(.*?)\n  it: \{', content, re.DOTALL).group(1),
        'it': re.search(r'it: \{(.*?)\n\};', content, re.DOTALL).group(1)
    }

    for lang, block in blocks.items():
        print(f"--- Duplicates in {lang} ---")
        keys = re.findall(r'^\s+([a-zA-Z0-9_]+):', block, re.MULTILINE)
        seen = set()
        dupes = set()
        for k in keys:
            if k in seen:
                dupes.add(k)
            seen.add(k)
        for d in sorted(dupes):
            print(f"  {d}")

find_duplicates(r'd:\proyectos\SaaS\src\lib\i18n.ts')
