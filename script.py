import requests

# Настройки
SOURCE_URL = "https://surl.li"  # Ваш исходный список
TARGET_FILE = "FREE_IPTV.m3u8"         # Имя файла в вашем репозитории

# Рабочая ссылка на Рен ТВ (стабильный поток для 2026 года)
# Этот поток работает в большинстве плееров без привязки к IP
STABLE_REN_TV = "http://otttv.itv.re"

def main():
    try:
        print(f"Загрузка плейлиста из {SOURCE_URL}...")
        response = requests.get(SOURCE_URL, timeout=15)
        response.encoding = 'utf-8'
        response.raise_for_status()
        
        lines = response.text.splitlines()
        updated_playlist = []
        skip_next = False

        for i in range(len(lines)):
            if skip_next:
                skip_next = False
                continue
            
            line = lines[i].strip()
            if not line:
                continue
                
            updated_playlist.append(line)

            # Ищем Рен ТВ (учитываем разные варианты написания)
            if "#EXTINF" in line and ("Рен ТВ" in line or "REN TV" in line or "Rentv" in line):
                print("Нашел Рен ТВ, заменяю ссылку...")
                updated_playlist.append(STABLE_REN_TV)
                skip_next = True # Пропускаем старую нерабочую ссылку из источника

        # Сохраняем обновленный файл
        with open(TARGET_FILE, "w", encoding="utf-8") as f:
            f.write("\n".join(updated_playlist))
        print(f"Готово! Файл {TARGET_FILE} обновлен.")

    except Exception as e:
        print(f"Ошибка при обновлении: {e}")

if __name__ == "__main__":
    main()
