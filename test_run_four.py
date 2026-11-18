import asyncio
import os
import time
from playwright.async_api import async_playwright
from PIL import Image

URL = "http://localhost:5173"
EMAIL = "nitishpattar7@gmail.com"
PASSWORD = "password123"

OUTPUT_DIR = "e:/new_project_main/assets/report_screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

test_payload_path = "e:/new_project_main/sample_payload.txt"
with open(test_payload_path, "w") as f:
    f.write("HelixVault Biological Data Preservation: Archiving MCA project data into synthetic DNA molecules.")

fasta_test_path = "e:/new_project_main/dna_test_payload.fasta"
seq = "ATCGTACGTAGCTAGCTAGCTGATCGATCGATCGTAGCTAGCTAGCTAGCATCGATCGTAGCTAGCTAGCATCGATCG" * 5
with open(fasta_test_path, "w") as f:
    f.write(f">HelixVault_Oligo_001|len={len(seq)}|GC=50.0%\n{seq}\n")

async def capture_all():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Capture Login
        context = await browser.new_context(viewport={"width": 1024, "height": 620}, device_scale_factor=1.0)
        page = await context.new_page()
        
        print("1. Capturing Login Page...")
        await page.goto(f"{URL}/login")
        await page.wait_for_selector('#login-email', timeout=15000)
        await page.fill('#login-email', EMAIL)
        await page.fill('#login-password', PASSWORD)
        await asyncio.sleep(0.5)
        login_img = os.path.join(OUTPUT_DIR, "01_user_authentication_login.png")
        await page.screenshot(path=login_img)
        print("Captured 01:", Image.open(login_img).size)
        
        # Submit Login
        print("Logging in...")
        await page.click('button[type="submit"]')
        await asyncio.sleep(3)
        print("Logged in. Current URL:", page.url)

        # 2. Capture Dashboard
        print("2. Capturing Dashboard...")
        await page.goto(f"{URL}/")
        # Wait for stats to load completely
        try:
            await page.wait_for_selector('text=Files Encoded', timeout=10000)
        except Exception:
            pass
        await asyncio.sleep(2)
        # Scroll down slightly to center the dashboard content and cards
        await page.evaluate("window.scrollTo(0, 80)")
        await asyncio.sleep(0.5)
        dash_img = os.path.join(OUTPUT_DIR, "02_dashboard_executive_overview.png")
        await page.screenshot(path=dash_img)
        print("Captured 02:", Image.open(dash_img).size)

        # 3. Capture Encoder Input Configuration
        print("3. Capturing Encoder Input...")
        await page.goto(f"{URL}/encode")
        await asyncio.sleep(1.5)
        await page.set_input_files('input[type="file"]', test_payload_path)
        await asyncio.sleep(0.5)
        
        # Expand advanced options to show synthesis method & error correction
        try:
            adv_btn = await page.query_selector('button:has-text("Advanced Options")')
            if adv_btn:
                await adv_btn.click()
                await asyncio.sleep(0.5)
        except Exception as e:
            print("Adv toggle err:", e)

        # Let's capture the entire left card ("1. Select File & Options")
        encoder_input_card = await page.query_selector('div.showcase-card:has-text("1. Select File & Options")')
        enc_in_img = os.path.join(OUTPUT_DIR, "03_dna_encoder_input_configuration.png")
        if encoder_input_card:
            await encoder_input_card.screenshot(path=enc_in_img)
        else:
            await page.screenshot(path=enc_in_img)
        print("Captured 03:", Image.open(enc_in_img).size)

        # 4. Click 'Encode to DNA' and capture Output Results
        print("4. Executing Encode to DNA...")
        encode_btn = await page.wait_for_selector('button:has-text("Encode to DNA")', state="visible")
        await encode_btn.click()
        
        print("Waiting for synthesis results...")
        await page.wait_for_selector('h4:has-text("bp")', timeout=20000)
        await page.wait_for_selector('.sequence-preview', timeout=10000)
        await asyncio.sleep(1)

        encoder_output_card = await page.query_selector('div.showcase-card:has-text("2. Synthesis Result")')
        enc_out_img = os.path.join(OUTPUT_DIR, "04_dna_synthesis_output_results.png")
        if encoder_output_card:
            await encoder_output_card.screenshot(path=enc_out_img)
        else:
            await page.screenshot(path=enc_out_img)
        print("Captured 04:", Image.open(enc_out_img).size)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_all())
