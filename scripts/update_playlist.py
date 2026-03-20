import re
import requests

PLAYLIST_FILE = "playlist.m3u"

# Словарь каналов: название в #EXTINF → URL страницы на smotrim.ru
CHANNELS = {
    "РТР-Планета USA": "https://smotrim.ru/live/planeta_rtr_usa",
    "РТР-Планета Азия": "https://smotrim.ru/live/planeta_rtr_asia",
    "РТР-Планета СНГ": "https://smotrim.ru/live/planeta_rtr_sng",
    "РТР-Планета Европа": "https://smotrim.ru/live/planeta_rtr_euro"
}

def get_new_url(page_url):
    html = requests.get(page_url).text
    match = re.search(r'https://vgtrksmotrim\.cdnvideo\.ru/hls/[^"]+\.m3u8[^"]*', html)
    return match.group(0) if match else None

def update_playlist():
    with open(PLAYLIST_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    skip_next = False
    for i, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue

        new_lines.append(line)
        if line.startswith("#EXTINF"):
            for channel_name, page_url in CHANNELS.items():
                if channel_name in line:
                    new_url = get_new_url(page_url)
                    if new_url:
                        print(f"Обновляем ссылку для {channel_name}: {new_url}")
                        new_lines.append(new_url + "\n")
                        if i+1 < len(lines) and lines[i+1].startswith("http"):
                            skip_next = True
                    break

    with open(PLAYLIST_FILE, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    update_playlist()
