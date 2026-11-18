import asyncio
import os
import time
from playwright.async_api import async_playwright

URL = "http://localhost:5173"
EMAIL = "nitishpattar7@gmail.com"
PASSWORD = "password123"

OUTPUT_DIR = "e:/new_project_main/assets/report_screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 920},
            device_scale_factor=1.5
        )
        page = await context.new_page()

        print("--> 1. Capturing Login Page (Input)...", flush=True)
        await page.goto(f"{URL}/login")
        await page.wait_for_selector('#login-email', timeout=15000)
        await page.fill('#login-email', EMAIL)
        await page.fill('#login-password', PASSWORD)
        await asyncio.sleep(0.5)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "01_user_authentication_login.png"))
        print("Saved 01_user_authentication_login.png", flush=True)

        print("--> Submitting Login...", flush=True)
        await page.click('button[type="submit"]')
        await asyncio.sleep(3)
        print("Logged in. Current URL:", page.url, flush=True)

        print("--> 2. Capturing Dashboard Overview (Output)...", flush=True)
        await page.goto(f"{URL}/")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "02_dashboard_executive_overview.png"))
        print("Saved 02_dashboard_executive_overview.png", flush=True)

        print("--> 3. Capturing Encoder Input Configuration...", flush=True)
        await page.goto(f"{URL}/encode")
        await asyncio.sleep(2)
        
        test_file = "e:/new_project_main/sample_payload.txt"
        with open(test_file, "w") as f:
            f.write("HelixVault Biological Data Preservation: Archiving MCA project data into synthetic DNA molecules.")

        # set_input_files works on hidden file inputs
        await page.set_input_files('input[type="file"]', test_file)
        await asyncio.sleep(1)

        # Toggle advanced options to display synthesis parameters
        try:
            adv_btn = await page.query_selector('button:has-text("Advanced Options")')
            if adv_btn:
                await adv_btn.click()
                await asyncio.sleep(0.5)
        except Exception as e:
            print("Adv btn error:", e, flush=True)

        await page.screenshot(path=os.path.join(OUTPUT_DIR, "03_dna_encoder_input_configuration.png"))
        print("Saved 03_dna_encoder_input_configuration.png", flush=True)

        print("--> 4. Clicking 'Encode to DNA' to generate synthesis output...", flush=True)
        encode_btn = await page.wait_for_selector('button:has-text("Encode to DNA")', state="visible")
        await encode_btn.click()
        
        print("Waiting for synthesis results to complete...", flush=True)
        await asyncio.sleep(6)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "04_dna_synthesis_output_results.png"))
        print("Saved 04_dna_synthesis_output_results.png", flush=True)

        # Extract sequence from page or create standard fasta
        dna_sample_fasta = "e:/new_project_main/dna_test_payload.fasta"
        seq = "ATCGTACGTAGCTAGCTAGCTGATCGATCGATCGTAGCTAGCTAGCTAGCATCGATCGTAGCTAGCTAGCATCGATCG" * 5
        with open(dna_sample_fasta, "w") as f:
            f.write(f">HelixVault_Oligo_001|len={len(seq)}|GC=50.0%\n{seq}\n")

        print("--> 5. Capturing Decoder Input...", flush=True)
        await page.goto(f"{URL}/decode")
        await asyncio.sleep(2)
        
        await page.set_input_files('input[type="file"]', dna_sample_fasta)
        await asyncio.sleep(1)
        
        try:
            dec_adv_btn = await page.query_selector('button:has-text("Advanced Options")')
            if dec_adv_btn:
                await dec_adv_btn.click()
                await asyncio.sleep(0.5)
        except Exception as e:
            print("Dec adv error:", e, flush=True)

        await page.screenshot(path=os.path.join(OUTPUT_DIR, "05_decoder_sequence_input.png"))
        print("Saved 05_decoder_sequence_input.png", flush=True)

        print("--> 6. Simulating Biological Mutation...", flush=True)
        mutate_btn = await page.wait_for_selector('button:has-text("Simulate Environmental Mutation")', state="visible")
        await mutate_btn.click()
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "06_mutation_simulator_output.png"))
        print("Saved 06_mutation_simulator_output.png", flush=True)

        print("--> 7. Decoding and Recovering Payload...", flush=True)
        extract_btn = await page.wait_for_selector('button:has-text("Extract Data")', state="visible")
        await extract_btn.click()
        await asyncio.sleep(4)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "07_decoder_data_recovery_output.png"))
        print("Saved 07_decoder_data_recovery_output.png", flush=True)

        print("--> 8. Capturing Plasmid Workbench...", flush=True)
        await page.goto(f"{URL}/plasmid")
        await asyncio.sleep(2)
        try:
            clone_btn = await page.query_selector('button:has-text("Clone"), button:has-text("Insert"), button:has-text("Simulate")')
            if clone_btn:
                await clone_btn.click()
                await asyncio.sleep(1.5)
        except Exception as e:
            print("Plasmid click error:", e, flush=True)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "08_plasmid_workbench_steganography.png"))
        print("Saved 08_plasmid_workbench_steganography.png", flush=True)

        print("--> 9. Capturing Biological Database...", flush=True)
        await page.goto(f"{URL}/bio")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "09_biodatabase_carrier_search.png"))
        print("Saved 09_biodatabase_carrier_search.png", flush=True)

        print("--> 10. Capturing BioCompute Direct Search...", flush=True)
        await page.goto(f"{URL}/compute")
        await asyncio.sleep(2)
        try:
            search_btn = await page.query_selector('button:has-text("Search"), button:has-text("Compute")')
            if search_btn:
                await search_btn.click()
                await asyncio.sleep(2)
        except Exception as e:
            print("BioCompute click error:", e, flush=True)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "10_biocompute_direct_search.png"))
        print("Saved 10_biocompute_direct_search.png", flush=True)

        print("--> 11. Capturing Vault Preservation Inventory...", flush=True)
        await page.goto(f"{URL}/vault")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "11_vault_preservation_records.png"))
        print("Saved 11_vault_preservation_records.png", flush=True)

        await browser.close()
        for p in [test_file, dna_sample_fasta]:
            if os.path.exists(p):
                os.remove(p)
        print("SUCCESS! All screenshots captured in", OUTPUT_DIR, flush=True)

if __name__ == "__main__":
    asyncio.run(run())
