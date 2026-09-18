"""Generate the Macedonian pages and an upload-ready static site. No server runtime needed."""
from pathlib import Path
from urllib.parse import urlsplit
from bs4 import BeautifulSoup, Comment, Doctype
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('index.html', 'about.html', 'services.html', 'contact.html')
BASE = 'https://kidex.mk/'
catalog = json.loads((ROOT / 'translations/mk.json').read_text(encoding='utf-8'))

def translate(value):
    key = value.strip()
    if not key:
        return value
    if key not in catalog:
        raise ValueError(f'Missing Macedonian translation: {key}')
    return value.replace(key, catalog[key], 1)

def seo(soup, filename, lang):
    for tag in soup.select('link[rel="canonical"],link[hreflang],meta[property="og:locale"],meta[property="og:locale:alternate"]'):
        tag.decompose()
    suffix = '' if filename == 'index.html' else filename
    url = BASE + ('mk/' if lang == 'mk' else '') + suffix
    soup.head.append(soup.new_tag('link', rel='canonical', href=url))
    for locale, prefix in [('en',''), ('mk','mk/'), ('x-default','')]:
        soup.head.append(soup.new_tag('link', rel='alternate', hreflang=locale, href=BASE+prefix+suffix))
    soup.select_one('meta[property="og:url"]')['content'] = url
    soup.select_one('meta[property="og:image"]')['content'] = BASE + 'images/kidex-logo-horizontal.png'
    soup.head.append(soup.new_tag('meta', property='og:locale', content='mk_MK' if lang=='mk' else 'en_GB'))
    soup.head.append(soup.new_tag('meta', property='og:locale:alternate', content='en_GB' if lang=='mk' else 'mk_MK'))

(ROOT / 'mk').mkdir(exist_ok=True)
for filename in PAGES:
    source = ROOT / filename
    en = BeautifulSoup(source.read_text(encoding='utf-8'), 'html.parser')
    seo(en, filename, 'en')
    source.write_text(str(en).rstrip()+'\n', encoding='utf-8')
    mk = BeautifulSoup(str(en), 'html.parser')
    mk.html['lang'] = 'mk'
    for node in list(mk.find_all(string=True)):
        if isinstance(node, (Comment, Doctype)) or node.parent.name in ('script','style') or node.find_parent('svg'):
            continue
        node.replace_with(translate(str(node)))
    for tag in mk.select('[alt],[aria-label],meta[name="description"],meta[property="og:title"],meta[property="og:description"]'):
        for attr in ('alt', 'aria-label', 'content'):
            if tag.has_attr(attr): tag[attr] = translate(tag[attr])
    for tag in mk.select('[src],[href]'):
        for attr in ('src','href'):
            url = tag.get(attr, '')
            if url.startswith(('images/','css/','js/','favicon/')):
                tag[attr] = '../'+url
    links = mk.select('.language-switch a')
    links[0]['href'] = '../'+filename
    links[0].attrs.pop('aria-current',None)
    links[1]['href'] = filename
    links[1]['aria-current'] = 'true'
    seo(mk, filename, 'mk')
    (ROOT / 'mk' / filename).write_text(str(mk).rstrip()+'\n',encoding='utf-8')

# Validate actual internal resources and anchor destinations before packaging.
for page in [ROOT / p for p in PAGES]+[ROOT/'mk'/p for p in PAGES]:
    soup=BeautifulSoup(page.read_text(encoding='utf-8'),'html.parser')
    ids=[t['id'] for t in soup.select('[id]')]
    if len(ids) != len(set(ids)): raise ValueError(f'Duplicate IDs: {page}')
    for tag in soup.select('[href],[src]'):
        for attr in ('href','src'):
            url=urlsplit(tag.get(attr,''))
            if url.scheme or url.netloc: continue
            target=(page.parent/url.path) if url.path else page
            if not target.exists(): raise ValueError(f'Broken resource {page}: {url.geturl()}')
            if url.fragment and target.suffix=='.html':
                linked=BeautifulSoup(target.read_text(encoding='utf-8'),'html.parser')
                if not linked.find(id=url.fragment): raise ValueError(f'Broken anchor {page}: {url.geturl()}')

urls=[BASE+prefix+('' if f=='index.html' else f) for prefix in ('','mk/') for f in PAGES]
sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls)+'</urlset>\n'
(ROOT/'sitemap.xml').write_text(sitemap,encoding='utf-8')
dist=ROOT/'dist'
dist.mkdir(exist_ok=True)
with zipfile.ZipFile(dist/'kidex-hosting.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name in (*PAGES,'mk','css','js','images','favicon','.htaccess','_redirects','robots.txt','sitemap.xml'):
        path=ROOT/name
        files=path.rglob('*') if path.is_dir() else [path]
        for file in files:
            if file.is_file(): archive.write(file,file.relative_to(ROOT))
print('Built and validated 8 bilingual pages. Upload package: dist/kidex-hosting.zip')
