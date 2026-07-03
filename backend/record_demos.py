import asyncio
import os
import sys
from playwright.async_api import async_playwright
import imageio
from jose import jwt
from datetime import datetime, timedelta, timezone

# Add the project root to sys.path to import core modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.auth import SECRET_KEY, ALGORITHM

async def record_video(page, url, video_name, actions):
    print(f"Recording {video_name}...")
    await page.goto(url)
    await actions(page)
    # Give it a second to finalize video buffer
    await page.wait_for_timeout(2000)
    
async def run():
    # 1. Generate token
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": "test@test.com", "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # 2. Setup Playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # --- 1. Homepage ---
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir="videos_webm/"
        )
        await context.add_cookies([{
            "name": "access_token",
            "value": f"Bearer {encoded_jwt}", # Fastapi OAuth expects space, but urlencoded might be %20
            "domain": "localhost",
            "path": "/",
            "httpOnly": True,
            "sameSite": "Lax"
        }])
        
        page = await context.new_page()
        
        async def homepage_actions(p):
            await p.wait_for_timeout(1000)
            await p.mouse.wheel(0, 500)
            await p.wait_for_timeout(2000)
            await p.mouse.wheel(0, 500)
            await p.wait_for_timeout(2000)
            
        await record_video(page, "http://localhost:5173/", "homepage", homepage_actions)
        homepage_webm = await page.video.path()
        await context.close()
        
        # --- 2. Encoding ---
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir="videos_webm/"
        )
        await context.add_cookies([{
            "name": "access_token",
            "value": f"Bearer {encoded_jwt}",
            "domain": "localhost",
            "path": "/",
            "httpOnly": True,
            "sameSite": "Lax"
        }])
        
        page = await context.new_page()
        
        async def encoding_actions(p):
            await p.wait_for_timeout(1000)
            # Upload file
            await p.locator("input[type=file]").set_input_files("../test.txt")
            await p.wait_for_timeout(1000)
            
            # Click Advanced
            await p.locator("text=Advanced Security").click()
            await p.wait_for_timeout(500)
            await p.locator("text=Enable Reed-Solomon").click()
            await p.wait_for_timeout(500)
            await p.locator("text=Enable DNA Steganography").click()
            await p.wait_for_timeout(1000)
            
            # Encode
            await p.get_by_role("button", name="Encode to DNA").click()
            await p.wait_for_timeout(1000)
            # Wait for success
            await p.wait_for_selector("text=Synthesis Result", timeout=30000)
            await p.wait_for_timeout(2000)
            
            # Download GenBank
            async with p.expect_download() as download_info:
                await p.locator("button:has-text('GenBank')").click()
            download = await download_info.value
            await download.save_as("test.gb")
            
        await record_video(page, "http://localhost:5173/encode", "encoding", encoding_actions)
        encoding_webm = await page.video.path()
        await context.close()
        
        # --- 3. Mutation ---
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir="videos_webm/"
        )
        await context.add_cookies([{
            "name": "access_token",
            "value": f"Bearer {encoded_jwt}",
            "domain": "localhost",
            "path": "/",
            "httpOnly": True,
            "sameSite": "Lax"
        }])
        
        page = await context.new_page()
        
        async def mutation_actions(p):
            await p.wait_for_timeout(1000)
            await p.get_by_role("button", name="Decode to Data").click()
            await p.wait_for_timeout(1000)
            
            await p.locator("input[type=file]").set_input_files("test.gb")
            await p.wait_for_timeout(1000)
            
            await p.get_by_role("button", name="Simulate Biological Mutation").click()
            await p.wait_for_timeout(2000)
            
        await record_video(page, "http://localhost:5173/encode", "mutation", mutation_actions)
        mutation_webm = await page.video.path()
        await context.close()
        
        # --- 4. Recovery ---
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir="videos_webm/"
        )
        await context.add_cookies([{
            "name": "access_token",
            "value": f"Bearer {encoded_jwt}",
            "domain": "localhost",
            "path": "/",
            "httpOnly": True,
            "sameSite": "Lax"
        }])
        
        page = await context.new_page()
        
        async def recovery_actions(p):
            await p.wait_for_timeout(1000)
            await p.get_by_role("button", name="Decode to Data").click()
            await p.wait_for_timeout(1000)
            
            # Since mutation.mp4 ended, we just do it again here, then extract
            await p.locator("input[type=file]").set_input_files("test.gb")
            await p.wait_for_timeout(500)
            
            # Open advanced to check options
            await p.locator("text=Decoding Options").click()
            await p.wait_for_timeout(500)
            await p.locator("text=Use Error Correction").click()
            await p.wait_for_timeout(500)
            await p.locator("text=Extract from Steganography").click()
            await p.wait_for_timeout(500)
            
            await p.get_by_role("button", name="Simulate Biological Mutation").click()
            await p.wait_for_timeout(1000)
            
            await p.get_by_role("button", name="Extract Data").click()
            await p.wait_for_timeout(1000)
            await p.wait_for_selector("text=Successfully Decoded", timeout=30000)
            await p.wait_for_timeout(3000)
            
        await record_video(page, "http://localhost:5173/encode", "recovery", recovery_actions)
        recovery_webm = await page.video.path()
        await context.close()
        
        await browser.close()
        
        # Convert WebM to MP4
        print("Converting to MP4...")
        os.makedirs("../assets", exist_ok=True)
        
        videos = {
            "homepage": homepage_webm,
            "encoding": encoding_webm,
            "mutation": mutation_webm,
            "recovery": recovery_webm
        }
        
        for name, webm_path in videos.items():
            print(f"Converting {name}.webm to {name}.mp4")
            reader = imageio.get_reader(webm_path)
            fps = reader.get_meta_data()['fps']
            writer = imageio.get_writer(f"../assets/{name}.mp4", fps=fps, codec="libx264")
            for frame in reader:
                writer.append_data(frame)
            writer.close()
            reader.close()
            
        print("Done!")

if __name__ == "__main__":
    asyncio.run(run())
