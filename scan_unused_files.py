import pathlib
import re
root = pathlib.Path('.')
text_ext = {'.html', '.css', '.js', '.md'}
all_files = sorted([str(p).replace('\\', '/') for p in root.rglob('*') if p.is_file()])
pattern = re.compile(r'([\\w\\-./]+\\.(?:png|jpg|jpeg|svg|gif|webp|pdf|js|css|html))', re.IGNORECASE)
refs = set()
for p in root.rglob('*'):
    if p.is_file() and p.suffix.lower() in text_ext:
        try:
            text = p.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        refs.update(pattern.findall(text))
        for m in re.findall(r'url\(["\']?([^"\')]+)["\']?\)', text):
            if any(m.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.pdf', '.js', '.css', '.html']):
                refs.add(m)
normalized = set(r.lstrip('./').replace('\\', '/') for r in refs)
unused = []
for f in all_files:
    fn = f.lstrip('./')
    if fn.startswith('.git/'):
        continue
    if fn.endswith('.py'):
        continue
    if fn in normalized:
        continue
    basename = pathlib.Path(fn).name
    if any(basename == pathlib.Path(r).name for r in normalized):
        continue
    unused.append(fn)
print('TOTAL_FILES', len(all_files))
print('REFERENCES_FOUND', len(normalized))
print('UNUSED_CANDIDATES', len(unused))
for u in unused:
    print(u)
