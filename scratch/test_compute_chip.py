import asyncio
from playwright.async_api import async_playwright

async def debug_compute():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1366, "height": 800})
        page = await context.new_page()
        
        page.on('console', lambda msg: print('CONSOLE:', msg.text))
        page.on('response', lambda res: print('RESP:', res.status, res.url) if 'api' in res.url else None)
        
        await page.goto('http://localhost:5173/login')
        await page.fill('#login-email', 'nitishpattar7@gmail.com')
        await page.fill('#login-password', 'password123')
        await page.click('button[type="submit"]')
        await asyncio.sleep(2)
        
        await page.goto('http://localhost:5173/compute')
        await asyncio.sleep(2)
        
        print('Clicking GATTACA chip...')
        # Click button containing exact text GATTACA
        chip = await page.wait_for_selector('button:has-text("GATTACA")')
        await chip.click()
        
        try:
            await page.wait_for_selector('text=Archives Scanned:', timeout=10000)
            print('SUCCESS: Found Archives Scanned!')
        except Exception as e:
            print('Wait for Archives Scanned exception:', e)
            
        await asyncio.sleep(2)
        await page.screenshot(path='e:/new_project_main/debug_compute_screen.png')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(debug_compute())
