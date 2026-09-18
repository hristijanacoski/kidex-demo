"""Browser regression checks. Start python -m http.server 4173 before running."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:4173/'
ARTIFACTS=Path(__file__).resolve().parents[1]/'.audit'
ARTIFACTS.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch()
    context=browser.new_context()
    page=context.new_page()
    errors=[]
    accessibility={}
    page.on('pageerror',lambda error: errors.append(str(error)))
    page.on('response',lambda response: errors.append(f'HTTP {response.status}: {response.url}') if response.status>=400 and response.url.startswith(BASE) else None)
    results=[]
    for width in (360,390,768,1024,1440):
        page.set_viewport_size({'width':width,'height':900})
        for lang in ('','mk/'):
            for filename in ('index.html','about.html','services.html','contact.html'):
                page.goto(BASE+lang+filename)
                page.locator('img[loading="lazy"]').evaluate_all("images => images.forEach(i => i.loading = 'eager')")
                page.wait_for_function('Array.from(document.images).every(i => i.complete)')
                page.evaluate('Promise.all(Array.from(document.images).map(i => i.decode()))')
                assert page.locator('h1').count()==1
                assert page.locator('html').get_attribute('lang')==('mk' if lang else 'en')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Horizontal overflow: {lang}{filename} at {width}'
                assert page.evaluate('Array.from(document.images).every(i => i.naturalWidth > 0)'), f'Broken image: {filename}'
                assert page.locator('.reveal').first.evaluate('e => getComputedStyle(e).opacity')=='1'
                if width in (390,1440):
                    page.screenshot(path=str(ARTIFACTS/f'{lang.replace("/", "-")}{filename[:-5]}-{width}.png'),full_page=True)
                    if (ARTIFACTS/'axe.min.js').exists():
                        page.add_script_tag(path=str(ARTIFACTS/'axe.min.js'))
                        violations=page.evaluate("async () => (await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','best-practice']}})).violations")
                        accessibility[f'{lang}{filename}:{width}']=[{'id':v['id'],'nodes':[n['target'] for n in v['nodes']]} for v in violations]
                results.append(f'{lang}{filename}: {width}px OK')
    page.set_viewport_size({'width':390,'height':844})
    page.goto(BASE+'mk/services.html#laboratory-equipment')
    page.locator('.language-switch a[lang="en"]').click()
    page.wait_for_url('**/services.html#laboratory-equipment')
    assert '/mk/' not in page.url
    page.locator('.language-switch a[lang="mk"]').click()
    page.wait_for_url('**/mk/services.html#laboratory-equipment')
    page.locator('.hamburger').click()
    assert page.locator('.hamburger').get_attribute('aria-expanded')=='true'
    assert page.locator('main').evaluate('e => e.inert')
    assert page.locator('.mobile-panel a').first.evaluate('e => e === document.activeElement')
    page.keyboard.press('Escape')
    assert page.locator('.hamburger').get_attribute('aria-expanded')=='false'
    assert page.locator('.hamburger').evaluate('e => e === document.activeElement')
    page.locator('.hamburger').click()
    page.set_viewport_size({'width':1440,'height':900})
    page.wait_for_function('!document.querySelector("main").inert')
    assert not page.locator('main').evaluate('e => e.inert')
    assert 'menu-open' not in (page.locator('body').get_attribute('class') or '')
    page.set_viewport_size({'width':390,'height':844})
    page.locator('.hamburger').click()
    page.locator('.mobile-panel nav a[href="contact.html"]').click()
    page.wait_for_url('**/mk/contact.html')
    # Form validation must block bad input; mailto creates a draft, never sends mail.
    page.locator('#cf-name').fill('Test User')
    page.locator('#cf-email').fill('invalid')
    page.locator('#cf-message').fill('Test message & special characters: + % ?')
    page.locator('button[type="submit"]').click()
    assert not page.locator('#cf-email').evaluate('e => e.validity.valid')
    assert page.locator('.form-status').inner_text()==''
    page.locator('#cf-email').fill('test@example.com')
    page.locator('#cf-name').fill('   ')
    page.locator('button[type="submit"]').click()
    assert 'Внесете' in page.locator('.form-status').inner_text()
    page.locator('#cf-name').fill('Test User')
    # Stub clipboard only; do not open an external email application during checks.
    page.evaluate("Object.defineProperty(navigator, 'clipboard', { value: {writeText: async text => {window.copiedText=text;}}, configurable: true })")
    page.locator('.copy-message').click()
    page.wait_for_function('window.copiedText !== undefined')
    assert 'Test User' in page.evaluate('window.copiedText')
    assert 'test@example.com' in page.evaluate('window.copiedText')
    assert 'копирана' in page.locator('.form-status').inner_text()
    page.evaluate("Object.defineProperty(navigator, 'clipboard', { value: {writeText: async () => {throw Error('Denied')}}, configurable: true })")
    page.locator('.copy-message').click()
    assert 'не е достапно' in page.locator('.form-status').inner_text()
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    static=nojs.new_page()
    for lang in ('','mk/'):
        static.goto(BASE+lang+'index.html')
        assert static.locator('.main-nav').is_visible()
        assert static.locator('.reveal').first.is_visible()
        assert static.locator('.reveal').first.evaluate('e => getComputedStyle(e).opacity')=='1'
        static.locator('.language-switch a:not([aria-current])').click()
        assert static.locator('html').get_attribute('lang')==('en' if lang else 'mk')
    assert not errors, errors
    if accessibility:
        (ARTIFACTS/'accessibility.json').write_text(json.dumps(accessibility,indent=2),encoding='utf-8')
        assert not any(accessibility.values()), accessibility
    (ARTIFACTS/'checks.json').write_text(json.dumps({'layouts':results,'functional':'Passed language/anchor switching, mobile menu/Escape/resize, form validation, clipboard/fallback and no-JS navigation','errors':errors},indent=2),encoding='utf-8')
    browser.close()
    print(f'PASS: {len(results)} page/viewport combinations; functional and no-JS checks; no runtime errors.')
