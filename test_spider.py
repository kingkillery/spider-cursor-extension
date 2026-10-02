"""Real Edge integration tests; no user browser profile is opened."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
results = []
def check(name, condition):
    assert condition, name
    results.append({'test': name, 'passed': True})

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto((ROOT/'index.html').as_uri())
    page.wait_for_function('window.__neonSpiderCursorExtensionV1 && window.__neonSpiderCursorExtensionV1.running')
    check('overlay attached', page.locator('#neon-spider-overlay').count() == 1)
    original = page.locator('a').evaluate_all('(els)=>els.map(e=>[e.textContent,e.href])')
    page.mouse.move(500, 650)
    page.wait_for_timeout(800)
    check('canvas draws nonempty pixels', page.evaluate('''() => {
        const c=document.querySelector('#neon-spider-overlay').shadowRoot.querySelector('canvas');
        return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0);
    }'''))
    page.mouse.click(510, 625)
    page.screenshot(path=str(ROOT/'screenshot.png'))
    check('underlying links unmodified', original == page.locator('a').evaluate_all('(els)=>els.map(e=>[e.textContent,e.href])'))
    # Overlay must not intercept clicks to webpage links.
    link = page.locator('a').first
    check('page link receives pointer hit', link.evaluate('e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+5,r.y+5)===e;}'))
    page.get_by_role('button', name='Pause', exact=True).click()
    check('pause control', page.evaluate('!window.__neonSpiderCursorExtensionV1.running'))
    page.keyboard.press('Alt+Shift+s')
    check('keyboard resumes', page.evaluate('window.__neonSpiderCursorExtensionV1.running'))
    page.get_by_role('slider', name='Glitch intensity').fill('90')
    page.evaluate('window.scrollTo(0,1000)')
    page.mouse.move(380, 350)
    page.wait_for_timeout(600)
    page.set_viewport_size({'width':900,'height':650})
    check('canvas follows resize', page.evaluate("document.querySelector('#neon-spider-overlay').shadowRoot.querySelector('canvas').width === 900"))
    page.add_script_tag(path=str(ROOT/'spider.js'))
    check('reinjection toggles without duplicate overlay', page.locator('#neon-spider-overlay').count()==1 and page.evaluate('!window.__neonSpiderCursorExtensionV1.running'))
    page.get_by_role('button', name='Remove Neon Spider').click()
    check('cleanup removes host and API', page.locator('#neon-spider-overlay').count()==0 and page.evaluate('!window.__neonSpiderCursorExtensionV1'))
    page.emulate_media(reduced_motion='reduce')
    page.add_script_tag(path=str(ROOT/'spider.js'))
    check('reduced motion starts paused', page.evaluate('!window.__neonSpiderCursorExtensionV1.running'))
    page.get_by_role('button', name='Resume', exact=True).click()
    check('reduced motion can explicitly opt in', page.evaluate('window.__neonSpiderCursorExtensionV1.running'))
    check('no browser runtime errors', not errors)
    browser.close()
(ROOT/'test-results.json').write_text(json.dumps(results, indent=2))
print(json.dumps(results, indent=2))
