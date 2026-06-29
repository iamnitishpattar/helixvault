import asyncio
from playwright.async_api import async_playwright
import imageio.v2 as imageio
import os
import time
from PIL import Image
import numpy as np

URL = "http://localhost:5173"
EMAIL = "nitishpattar7@gmail.com"
PASSWORD = "14325678"

ASSETS_DIR = "e:/new_project_main/assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

async def capture_gif(page, name, action_func, duration=5, interval=0.5):
    frames = []
    print(f"Starting action for {name}...")
    await action_func(page)
    print(f"Recording {name} for {duration} seconds...")
    end_time = time.time() + duration
    
    i = 0
    while time.time() < end_time:
        path = f"temp_{name}_{i}.png"
        await page.screenshot(path=path)
        im = Image.open(path)
        im = im.resize((800, 500), Image.Resampling.LANCZOS)
        frames.append(np.array(im))
        os.remove(path)
        await asyncio.sleep(interval)
        i += 1
        
    out_path = os.path.join(ASSETS_DIR, f"{name}.gif")
    imageio.mimsave(out_path, frames, format='GIF', duration=interval * 1000)
    print(f"Saved {out_path}")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()
        
        print("Navigating to login...")
        await page.goto(f"{URL}/login")
        await page.wait_for_selector('input[type="email"]', timeout=30000)
        
        print("Filling login form...")
        await page.fill('input[type="email"]', EMAIL)
        await page.fill('input[type="password"]', PASSWORD)
        await page.click('button[type="submit"]')
        
        print("Waiting for dashboard...")
        await page.wait_for_selector('text=Encoder', timeout=30000)
        await asyncio.sleep(2)
        
        print("Capturing homepage...")
        await page.goto(f"{URL}/")
        await asyncio.sleep(2)
        await page.screenshot(path=os.path.join(ASSETS_DIR, "homepage.png"))
        
        async def encode_action(p):
            await p.goto(f"{URL}/encode")
            await asyncio.sleep(2)
            try:
                await p.click('button:has-text("Encode to DNA")')
                await asyncio.sleep(1)
            except:
                pass
            with open("test.txt", "w") as f:
                f.write("This is a test file for HelixVault encoding.")
            try:
                await p.set_input_files('input[type="file"]', 'test.txt')
            except Exception as e:
                print("Failed to set input file:", e)
            try:
                await p.click('button:has-text("Encode Data")')
            except:
                try:
                    await p.click('button:has-text("Encode")')
                except: pass
            
        await capture_gif(page, "encoding", encode_action, duration=6, interval=0.5)
        
        async def mutate_action(p):
            await p.goto(f"{URL}/encode")
            await asyncio.sleep(2)
            try:
                await p.click('button:has-text("Decode to Data")')
                await asyncio.sleep(1)
            except:
                pass
            try:
                await p.click('button:has-text("Simulate Mutation")')
            except:
                try:
                    await p.click('button:has-text("Simulate Biological")')
                except: pass
            
        await capture_gif(page, "mutation", mutate_action, duration=6, interval=0.5)
        
        async def recover_action(p):
            await p.goto(f"{URL}/encode")
            await asyncio.sleep(2)
            try:
                await p.click('button:has-text("Decode to Data")')
                await asyncio.sleep(1)
            except:
                pass
            try:
                await p.click('button:has-text("Extract Data")')
            except:
                try:
                    await p.click('button:has-text("Extract")')
                except: pass
            
        await capture_gif(page, "recovery", recover_action, duration=6, interval=0.5)
        
        await browser.close()
        if os.path.exists("test.txt"):
            os.remove("test.txt")

if __name__ == "__main__":
    asyncio.run(main())
