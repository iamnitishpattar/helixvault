import asyncio
import os
from playwright.async_api import async_playwright

URL = "http://localhost:5173"
EMAIL = "nitishpattar7@gmail.com"
PASSWORD = "14325678"

OUTPUT_DIR = "e:/new_project_main/assets/report_screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def capture_all():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Standard desktop viewport with high device scale for crisp print quality
        context = await browser.new_context(viewport={"width": 1366, "height": 850}, device_scale_factor=1.5)
        page = await context.new_page()

        print("1. Capturing Login Page...")
        await page.goto(f"{URL}/login")
        await page.wait_for_selector('input[type="email"]', timeout=15000)
        await page.fill('input[type="email"]', EMAIL)
        await page.fill('input[type="password"]', PASSWORD)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "01_login_input.png"))
        print("Captured 01_login_input.png")

        print("Submitting login...")
        await page.click('button[type="submit"]')
        # Wait for navigation away from login
        try:
            await page.wait_for_url(lambda u: "/login" not in u, timeout=10000)
            print("Logged in successfully! Current URL:", page.url)
        except Exception as e:
            print("Login wait exception:", e)

        print("2. Capturing Dashboard...")
        await page.goto(f"{URL}/")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "02_dashboard_overview.png"))
        print("Captured 02_dashboard_overview.png")

        print("3. Capturing Encoder Input...")
        await page.goto(f"{URL}/encode")
        await asyncio.sleep(2)
        # Try to type text into payload or upload test file
        test_file_path = "e:/new_project_main/test_report_sample.txt"
        with open(test_file_path, "w") as f:
            f.write("HelixVault Biological Data Storage Architecture v4.0 - Academic Report Demo Payload.")

        try:
            file_input = await page.query_selector('input[type="file"]')
            if file_input:
                await file_input.set_input_files(test_file_path)
                await asyncio.sleep(1)
        except Exception as e:
            print("File input error:", e)

        await page.screenshot(path=os.path.join(OUTPUT_DIR, "03_encoder_input.png"))
        print("Captured 03_encoder_input.png")

        print("4. Executing Encode action for Output...")
        try:
            encode_btn = await page.query_selector('button:has-text("Encode Data"), button:has-text("Encode to DNA"), button:has-text("Generate DNA")')
            if encode_btn:
                await encode_btn.click()
                print("Clicked encode button, waiting for results...")
                await asyncio.sleep(4)
        except Exception as e:
            print("Encode click error:", e)

        await page.screenshot(path=os.path.join(OUTPUT_DIR, "04_encoder_output_synthesis.png"))
        print("Captured 04_encoder_output_synthesis.png")

        print("5. Capturing Decoder & Mutation Simulator Input...")
        await page.goto(f"{URL}/decode")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "05_decoder_mutation_input.png"))
        print("Captured 05_decoder_mutation_input.png")

        print("6. Simulating Mutation and Decoding Output...")
        try:
            mutate_btn = await page.query_selector('button:has-text("Simulate Mutation"), button:has-text("Simulate"), button:has-text("Apply Mutation")')
            if mutate_btn:
                await mutate_btn.click()
                await asyncio.sleep(2)
            decode_btn = await page.query_selector('button:has-text("Decode to Data"), button:has-text("Recover"), button:has-text("Extract Data")')
            if decode_btn:
                await decode_btn.click()
                await asyncio.sleep(3)
        except Exception as e:
            print("Decoder click error:", e)

        await page.screenshot(path=os.path.join(OUTPUT_DIR, "06_decoder_recovery_output.png"))
        print("Captured 06_decoder_recovery_output.png")

        print("7. Capturing Plasmid & Steganography Workbench...")
        await page.goto(f"{URL}/plasmid")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "07_plasmid_steganography.png"))
        print("Captured 07_plasmid_steganography.png")

        print("8. Capturing BioDatabase Repository...")
        await page.goto(f"{URL}/bio")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "08_biodatabase_repository.png"))
        print("Captured 08_biodatabase_repository.png")

        print("9. Capturing BioCompute Simulator...")
        await page.goto(f"{URL}/compute")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "09_biocompute_simulator.png"))
        print("Captured 09_biocompute_simulator.png")

        print("10. Capturing AI CoPilot...")
        await page.goto(f"{URL}/copilot")
        await asyncio.sleep(2)
        # Type a sample query if input is available
        try:
            chat_input = await page.query_selector('input[type="text"], textarea')
            if chat_input:
                await chat_input.fill("Explain how Base-3 encoding prevents homopolymer runs in DNA storage.")
                await asyncio.sleep(0.5)
        except Exception as e:
            print("Chat input error:", e)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "10_ai_copilot_assistant.png"))
        print("Captured 10_ai_copilot_assistant.png")

        print("11. Capturing Vault Records...")
        await page.goto(f"{URL}/vault")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "11_vault_preservation.png"))
        print("Captured 11_vault_preservation.png")

        await browser.close()
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

if __name__ == "__main__":
    asyncio.run(capture_all())
