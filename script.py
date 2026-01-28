import os
import sys
import time

# Принудительный вывод логов для GitHub Actions
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
    log(f"Ошибка импорта: {e}. Проверьте зависимости в YAML файле.")
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
    options.add_argument("--window-size=1920,1080")

    log("Установка и запуск Chrome...")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    
    try:
        log(f"Открываю страницу: {SOURCE_URL}")
        driver.get(SOURCE_URL)
        time.sleep(10)

        # Эмуляция активности для запуска плеера
        log("Эмуляция клика по плееру...")
        try:
            # Кликаем в центр страницы, где обычно находится плеер
            driver.execute_script("window.scrollTo(0, 400);")
            body = driver.find_element(By.TAG_NAME, "body")
            body.click()
        except:
            log("Не удалось кликнуть по странице.")

        log("Ожидание сетевых запросов (25 сек)...")
        time.sleep(25)

        log("Анализ трафика...")
        found_url = None
        
        # Ищем любую ссылку m3u8, исключая мелкие фрагменты
        for request in driver.requests:
            url = request.url
            if '.m3u8' in url.lower():
                if 'chunklist' not in url.lower() and 'fragment' not in url.lower():
                    log(f"НАЙДЕН ПОТОК: {url[:80]}...")
                    found_url = url
                    # Если нашли ссылку с токеном — это приоритет
                    if 'token=' in url.lower() or 'hash=' in url.lower():
                        break
        
        if not found_url:
            log("M3U8 не найден. Попробуйте увеличить время ожидания.")
            
        return found_url
        
    except Exception as e:
        log(f"Ошибка в get_link: {e}")
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
        # Пропускаем старую ссылку и старые настройки плеера для этого канала
        if skip_next:
            new_lines.append(f'#EXTVLCOPT:http-user-agent={UA}\n')
            new_lines.append(f'#EXTVLCOPT:http-referrer=https://smotrettv.com\n')
            new_lines.append(new_url + '\n')
            skip_next = False
            updated = True
            continue
        
        if "#EXTVLCOPT" in line:
            # Временный пропуск, чтобы не дублировать настройки
            continue
            
        new_lines.append(line)
        
        # Если нашли строку с названием канала, следующая замена активна
        if TARGET_MARKER in line:
            skip_next = True

    with open(PLAYLIST_FILE, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    if updated:
        log(f"Канал '{TARGET_MARKER}' успешно обновлен.")
    else:
        log(f"Маркер '{TARGET_MARKER}' не найден в плейлисте.")

# Точка входа
actual_url = get_link()
if actual_url:
    update_playlist(actual_url)
else:
    log("Работа завершена без изменений в файле.")

