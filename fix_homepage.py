from playwright.sync_api import sync_playwright

def get_homepage():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("https://helixvault-omega.vercel.app/login")
        page.fill('input[type="email"]', "nitishpattar7@gmail.com")
        page.fill('input[type="password"]', "14325678")
        page.click('button[type="submit"]')
        page.wait_for_selector('text=Encoder', timeout=10000)
        page.wait_for_timeout(2000)
        page.goto("https://helixvault-omega.vercel.app/")
        page.wait_for_timeout(4000)
        page.screenshot(path="e:/new_project_main/assets/homepage.png")
        browser.close()
        print("Successfully captured homepage.png")

get_homepage()
