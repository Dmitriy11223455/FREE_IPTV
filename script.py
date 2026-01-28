import os
import sys
import time

# Принудительный вывод логов в консоль GitHub
def log(message):
    print(f"LOG: {message}")
    sys.stdout.flush()

log("--- ЗАПУСК СКРИПТА ---")

try:
    from seleniumwire import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from webdriver_manager.chrome import ChromeDriverManager
except ImportError as e:
    log(f"Ошибка импорта: {e}. Проверьте установку библиотек в YAML.")
    sys.exit(1)

# --- НАСТРОЙКИ ---
PLAYLIST_FILE = "FREE_IPTV.m3u8"
TARGET_MARKER = "РЕН ТВ"
SOURCE_URL = "https://smotrettv.com/tv/public/316-ren-tv.html"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

def get_link():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(f"user-agent={UA}")
    
    log(f"Установка драйвера Chrome...")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    
    try:
        log(f"Открываю страницу: {SOURCE_URL}")
        driver.get(SOURCE_URL)
        time.sleep(15) # Ждем загрузку страницы и рекламы

        log("Сканирую сетевые запросы...")
        found_url = None
        for request in driver.requests:
            if '.m3u8' in request.url and 'token=' in request.url:
                log(f"НАЙДЕНО: {request.url[:50]}...")
                found_url = request.url
                break # Берем первую подходящую ссылку
        
        if not found_url:
            log("M3U8 с токеном не найден в трафике.")
        return found_url
        
    except Exception as e:
        log(f"Произошла ошибка: {e}")
        return None
    finally:
        driver.quit()

def update_playlist(new_url):
    if not os.path.exists(PLAYLIST_FILE):
        log(f"Файл {PLAYLIST_FILE} не найден!")
        return

    with open(PLAYLIST_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    skip_next = False
    updated = False

    for line in lines:
        if skip_next:
            new_lines.append(f'#EXTVLCOPT:http-user-agent={UA}\n')
            new_lines.append(f'#EXTVLCOPT:http-referrer=https://smotrettv.com\n')
            new_lines.append(new_url + '\n')
            skip_next = False
            updated = True
            continue
        
        # Удаляем старые параметры, если они были, чтобы не дублировать
        if "#EXTVLCOPT" in line:
            continue
            
        new_lines.append(line)
        if TARGET_MARKER in line:
            skip_next = True

    with open(PLAYLIST_FILE, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    if updated:
        log("Плейлист успешно обновлен.")
    else:
        log(f"Маркер '{TARGET_MARKER}' не найден в файле.")

# Основной процесс
token_link = get_link()
if token_link:
    update_playlist(token_link)
else:
    log("Завершение без обновлений.")

