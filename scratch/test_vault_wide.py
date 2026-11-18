import asyncio
from playwright.async_api import async_playwright

async def test_vault():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1680, "height": 950})
        page = await context.new_page()
        
        await page.goto("http://localhost:5173/login")
        await page.fill("#login-email", "nitishpattar7@gmail.com")
        await page.fill("#login-password", "password123")
        await page.click('button[type="submit"]')
        await asyncio.sleep(2)
        
        await page.goto("http://localhost:5173/vault")
        await page.wait_for_selector("table", timeout=15000)
        await asyncio.sleep(1)
        
        await page.screenshot(path="e:/new_project_main/debug_vault_wide.png")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_vault())
