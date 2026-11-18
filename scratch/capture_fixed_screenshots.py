import asyncio
import os
import time
from playwright.async_api import async_playwright
from PIL import Image

OUTPUT_DIR = "e:/new_project_main/assets/report_screenshots"
BACKUP_DIR = "e:/new_project_main/assets/report_screenshots_backup"
os.makedirs(BACKUP_DIR, exist_ok=True)

# First backup the old 10 and 11
for fname in ["10_biocompute_direct_search.png", "11_vault_preservation_records.png"]:
    src = os.path.join(OUTPUT_DIR, fname)
    if os.path.exists(src):
        dst = os.path.join(BACKUP_DIR, fname)
        with open(src, "rb") as fsrc, open(dst, "wb") as fdst:
            fdst.write(fsrc.read())
        print(f"Backed up {fname} to backup directory")

async def capture_fixed():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Use standard 1366x768 / 1440x820 viewport
        context = await browser.new_context(viewport={"width": 1366, "height": 768}, device_scale_factor=1.0)
        page = await context.new_page()

        print("1. Logging in...")
        await page.goto("http://localhost:5173/login")
        await page.wait_for_selector("#login-email", timeout=15000)
        await page.fill("#login-email", "nitishpattar7@gmail.com")
        await page.fill("#login-password", "password123")
        await page.click('button[type="submit"]')
        await asyncio.sleep(2)
        print("Logged in, current URL:", page.url)

        # ----------------------------------------------------
        # 10. BioCompute Direct Search
        # ----------------------------------------------------
        print("2. Capturing BioCompute Direct Search...")
        await page.goto("http://localhost:5173/compute")
        await page.wait_for_selector('input[type="text"]', timeout=15000)
        
        # Click on 'GATTACA' chip or type it
        search_input = await page.query_selector('input[type="text"]')
        await search_input.fill("GATTACA")
        await asyncio.sleep(0.5)

        # Click submit button
        submit_btn = await page.query_selector('button[type="submit"]')
        if submit_btn:
            await submit_btn.click()
        else:
            await search_input.press("Enter")

        # Wait for results to render
        print("Waiting for BioCompute results...")
        try:
            await page.wait_for_selector('text=Genetic Signature:', timeout=15000)
            await page.wait_for_selector('text=Archives Scanned:', timeout=10000)
            print("BioCompute results loaded!")
        except Exception as e:
            print("Notice:", e)
        
        await asyncio.sleep(2)
        
        # Scroll slightly to show search bar and top results clearly
        await page.evaluate("window.scrollTo(0, 180)")
        await asyncio.sleep(1)

        raw_10 = "e:/new_project_main/raw_10_compute.png"
        await page.screenshot(path=raw_10)

        # Resize to 760x420 to match 05-09
        im10 = Image.open(raw_10)
        # Crop or resize cleanly
        im10_resized = im10.resize((760, 420), Image.Resampling.LANCZOS)
        out_10 = os.path.join(OUTPUT_DIR, "10_biocompute_direct_search.png")
        im10_resized.save(out_10, "PNG", optimize=True)
        print("Successfully saved 10_biocompute_direct_search.png:", im10_resized.size)

        # ----------------------------------------------------
        # 11. Vault Preservation Records
        # ----------------------------------------------------
        print("3. Capturing Vault Preservation Records...")
        await page.goto("http://localhost:5173/vault")
        
        # Wait for table to load
        print("Waiting for Vault table...")
        await page.wait_for_selector("table tbody tr", timeout=15000)
        print("Vault table rows loaded!")
        await asyncio.sleep(1.5)

        # Scroll slightly down so header, export button, and top records are prominently visible
        await page.evaluate("window.scrollTo(0, 40)")
        await asyncio.sleep(1)

        raw_11 = "e:/new_project_main/raw_11_vault.png"
        await page.screenshot(path=raw_11)

        im11 = Image.open(raw_11)
        im11_resized = im11.resize((760, 420), Image.Resampling.LANCZOS)
        out_11 = os.path.join(OUTPUT_DIR, "11_vault_preservation_records.png")
        im11_resized.save(out_11, "PNG", optimize=True)
        print("Successfully saved 11_vault_preservation_records.png:", im11_resized.size)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_fixed())
