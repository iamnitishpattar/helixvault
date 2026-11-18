import asyncio
from playwright.async_api import async_playwright

async def debug_vault():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        page.on('request', lambda req: print('REQ:', req.method, req.url) if 'api' in req.url else None)
        page.on('requestfailed', lambda req: print('REQ FAILED:', req.url, req.failure) if 'api' in req.url else None)
        page.on('response', lambda res: print('RESP:', res.status, res.url) if 'api' in res.url else None)
        page.on('console', lambda msg: print('CONSOLE:', msg.text))
        
        print('1. Login...')
        await page.goto('http://localhost:5173/login')
        await page.fill('#login-email', 'nitishpattar7@gmail.com')
        await page.fill('#login-password', 'password123')
        await page.click('button[type="submit"]')
        await asyncio.sleep(3)
        print('Current URL after login submit:', page.url)
        
        print('2. Goto vault...')
        await page.goto('http://localhost:5173/vault')
        try:
            await page.wait_for_selector('table', timeout=15000)
            print('SUCCESS: Found table element!')
        except Exception as e:
            print('Wait for table exception:', e)
        await asyncio.sleep(2)
        print('Vault current URL:', page.url)
        
        content = await page.content()
        print('Has table tag?', '<table' in content)
        print('Has loading?', 'SkeletonLoader' in content)
        print('Has empty?', 'Enterprise Vault is Empty' in content)
        
        await page.screenshot(path='e:/new_project_main/debug_vault_screen.png')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(debug_vault())
