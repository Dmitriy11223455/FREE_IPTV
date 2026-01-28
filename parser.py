import os
import re
from seleniumwire import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# --- НАСТРОЙКИ ---
PLAYLIST_NAME = "FREE_IPTV.m3u8"
TARGET_MARKER = "РЕН ТВ"  # Текст, который стоит в #EXTINF вашего канала

def get_token_link():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    try:
        driver.get("https://ren.tv")
        # Ожидаем запрос с m3u8 и токеном в сетевом трафике
        request = driver.wait_for_request(r'playlist\.m3u8.*token=', timeout=30)
        return request.url
    except Exception as e:
        print(f"Ошибка поиска: {e}")
        return None
    finally:
        driver.quit()

def update_only_target(new_url):
    if not os.path.exists(PLAYLIST_NAME):
        print("Файл плейлиста не найден!")
        return

    with open(PLAYLIST_NAME, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    with open(PLAYLIST_NAME, 'w', encoding='utf-8') as f:
        skip_next = False
        updated = False
        
        for line in lines:
            if skip_next:
                f.write(new_url + '\n')
                skip_next = False
                updated = True
                continue
            
            f.write(line)
            
            # Если нашли строку с РЕН ТВ, помечаем, что следующую (ссылку) надо заменить
            if TARGET_MARKER in line and "#EXTINF" in line:
                skip_next = True
        
        if updated:
            print(f"Ссылка для {TARGET_MARKER} успешно обновлена.")

# Запуск
new_link = get_token_link()
if new_link:
    update_only_target(new_link)
