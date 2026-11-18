import asyncio
from playwright.async_api import async_playwright
import os

OUTPUT_DIR = "e:/new_project_main/assets/report_screenshots"

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        
        print("1. Logging in...")
        await page.goto("http://localhost:5173/login")
        await page.wait_for_selector("#login-email", timeout=10000)
        await page.fill("#login-email", "nitishpattar7@gmail.com")
        await page.fill("#login-password", "password123")
        await page.click('button[type="submit"]')
        await asyncio.sleep(2)
        print("Logged in, current URL:", page.url)
        
        # Test compute
        print("2. Opening /compute...")
        await page.goto("http://localhost:5173/compute")
        await asyncio.sleep(2)
        
        # Let's see what buttons/inputs exist
        print("Finding search button on compute...")
        search_input = await page.query_selector('input[type="text"]')
        if search_input:
            print("Found input, typing GATTACA...")
            await search_input.fill("GATTACA")
            # Click form submit or press enter
            await search_input.press("Enter")
            print("Waiting for search response...")
            await asyncio.sleep(3)
        
        await page.screenshot(path="e:/new_project_main/test_compute.png")
        print("Saved test_compute.png")
        
        # Test vault
        print("3. Opening /vault...")
        await page.goto("http://localhost:5173/vault")
        await asyncio.sleep(3)
        await page.screenshot(path="e:/new_project_main/test_vault.png")
        print("Saved test_vault.png")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test())
