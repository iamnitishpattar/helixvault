import asyncio
import os
from playwright.async_api import async_playwright

URL = "http://localhost:5173"
EMAIL = "nitishpattar7@gmail.com"
PASSWORD = "password123"

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Viewport: 1024 x 620 is clean, compact, and perfectly proportioned
        context = await browser.new_context(viewport={"width": 1024, "height": 620}, device_scale_factor=1.25)
        page = await context.new_page()

        await page.goto(f"{URL}/login")
        await page.wait_for_selector('#login-email', timeout=10000)
        await page.fill('#login-email', EMAIL)
        await page.fill('#login-password', PASSWORD)
        await asyncio.sleep(0.5)

        # Let's take full page screenshot or right card screenshot
        await page.screenshot(path="e:/new_project_main/test_login_full.png")
        
        # Also let's check right card
        right_panel = await page.query_selector('div[style*="flex: 1"][style*="background-color: rgb(255, 255, 255)"]') or await page.query_selector('div:has(#login-email)')
        if right_panel:
            await right_panel.screenshot(path="e:/new_project_main/test_login_card.png")

        await browser.close()
        print("Done capturing login test")

if __name__ == "__main__":
    asyncio.run(test())
