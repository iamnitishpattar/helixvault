import asyncio
import os
from playwright.async_api import async_playwright
from PIL import Image

OUTPUT_DIR = "e:/new_project_main/assets/report_screenshots"

async def capture_both():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Use 1440x800 for high resolution capture
        context = await browser.new_context(viewport={"width": 1440, "height": 800}, device_scale_factor=1.0)
        page = await context.new_page()

        print("1. Logging in...")
        await page.goto("http://localhost:5173/login")
        await page.wait_for_selector("#login-email")
        await page.fill("#login-email", "nitishpattar7@gmail.com")
        await page.fill("#login-password", "password123")
        await page.click('button[type="submit"]')
        await asyncio.sleep(2)

        # ----------------------------------------------------
        # 10. BioCompute Direct Search
        # ----------------------------------------------------
        print("2. Capturing BioCompute Direct Search...")
        await page.goto("http://localhost:5173/compute")
        await page.wait_for_selector('button:has-text("GATTACA")', timeout=10000)
        
        # Click the GATTACA suggestion chip
        chip = await page.wait_for_selector('button:has-text("GATTACA")')
        await chip.click()
        
        # Wait for search results
        await page.wait_for_selector('text=Archives Scanned:', timeout=10000)
        await asyncio.sleep(1)

        # Scroll down slightly to center the search bar, telemetry bar, and top result cards
        await page.evaluate("window.scrollTo(0, 140)")
        await asyncio.sleep(0.5)

        temp_10 = "e:/new_project_main/scratch/temp_compute.png"
        await page.screenshot(path=temp_10)

        # Resize to (760, 420) to maintain exact folder dimension consistency
        im10 = Image.open(temp_10)
        im10_out = im10.resize((760, 420), Image.Resampling.LANCZOS)
        final_10_path = os.path.join(OUTPUT_DIR, "10_biocompute_direct_search.png")
        im10_out.save(final_10_path, "PNG", optimize=True)
        print("Saved 10_biocompute_direct_search.png successfully, size:", im10_out.size)

        # ----------------------------------------------------
        # 11. Vault Preservation Records
        # ----------------------------------------------------
        print("3. Capturing Vault Preservation Records...")
        await page.goto("http://localhost:5173/vault")
        await page.wait_for_selector("table tbody tr", timeout=15000)
        await asyncio.sleep(1.5)

        # Scroll down slightly to show title, export CSV, and top records
        await page.evaluate("window.scrollTo(0, 30)")
        await asyncio.sleep(0.5)

        temp_11 = "e:/new_project_main/scratch/temp_vault.png"
        await page.screenshot(path=temp_11)

        im11 = Image.open(temp_11)
        im11_out = im11.resize((760, 420), Image.Resampling.LANCZOS)
        final_11_path = os.path.join(OUTPUT_DIR, "11_vault_preservation_records.png")
        im11_out.save(final_11_path, "PNG", optimize=True)
        print("Saved 11_vault_preservation_records.png successfully, size:", im11_out.size)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_both())
