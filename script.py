import os
import time
from seleniumwire import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# --- НАСТРОЙКИ ---
PLAYLIST_FILE = "FREE_IPTV.m3u8"
TARGET_MARKER = "РЕН ТВ"
SOURCE_URL = "https://smotrettv.com/tv/public/316-ren-tv.html"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def get_link():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument(f"user-agent={UA}")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    
    try:
        driver.get(SOURCE_URL)
        time.sleep(20) # Ждем загрузку плеера
        
        for request in driver.requests:
            if '.m3u8' in request.url:
                return request.url
        return None
    finally:
        driver.quit()

def update_playlist(new_url):
    if not os.path.exists(PLAYLIST_FILE): return

    with open(PLAYLIST_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    with open(PLAYLIST_FILE, 'w', encoding='utf-8') as f:
        skip_next = False
        for line in lines:
            if skip_next:
                # Вставляем ссылку с параметрами для плеера (VLC / OTT Navigator style)
                f.write(f'#EXTVLCOPT:http-user-agent={UA}\n')
                f.write(f'#EXTVLCOPT:http-referrer={SOURCE_URL}\n')
                f.write(new_url + '\n')
                skip_next = False
                continue
            
            # Очищаем старые опции этого канала, чтобы они не дублировались
            if "#EXTVLCOPT" in line:
                continue
                
            f.write(line)
            if TARGET_MARKER in line:
                skip_next = True

link = get_link()
if link:
    update_playlist(link)
    print("Плейлист успешно пропатчен с заголовками!")

