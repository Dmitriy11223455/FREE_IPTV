import fs from 'fs';
import axios from 'axios';

const http = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://drm-play.com',
    'Origin': 'https://drm-play.com',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
  validateStatus: () => true
});

const REPLACEMENT_SOURCES = [
  'https://iptv-org.github.io/iptv/index.m3u',
  'https://drm-play.com/iptv.php?tv=nodrm-1',
  'https://raw.githubusercontent.com/Dmitriy11223455/iptv-autoupdate/refs/heads/main/playlist.m3u'
];

const CHANNEL_SPECIFIC_SOURCES: Record<string, string> = {
  'россия 1': 'https://raw.githubusercontent.com/Dmitriy11223455/iptv-autoupdate/refs/heads/main/playlist.m3u',
  'рен тв': 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/ru_televizor24.m3u',
  'россия 24': 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/ru_televizor24.m3u',
  'спас': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'звезда': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'нтв': 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/ru_televizor24.m3u',
  'стс': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч тв sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч тв': 'https://raw.githubusercontent.com/Dmitriy11223455/iptv-autoupdate/refs/heads/main/playlist.m3u',
  'матч! арена': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! игра': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч тв hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! премьер hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! премьер sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! футбол 1 hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! футбол 1 sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! футбол 2 hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! футбол 2 sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! футбол 3 hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! футбол 3 sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! арена hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! игра hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! боец hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! боец sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! страна hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч! страна sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'кхл тв hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'кхл тв sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'кхл prime hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'кхл prime sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'eurosport 1 hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'eurosport 1 sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'eurosport 2 hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'eurosport 2 sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'viasat sport hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'viasat sport sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'первый канал hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'первый канал sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'россия 1 hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'россия 1 sd': 'https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/ru_televizor24.m3u',
  'нтв sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'стс hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'стс sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'тнт hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'тнт sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'рен тв hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'рен тв sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'домашний hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'домашний sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'пятница! hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'пятница! sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'тв центр hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'тв центр sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'пятый канал hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'пятый канал sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'кинокомедия hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'кинокомедия sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'родное кино hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'родное кино sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'русский иллюзион hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'русский иллюзион sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'иллюзион+ hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'иллюзион+ sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'дом кино hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'дом кино sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'моя планета hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'моя планета sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'живая планета hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'живая планета sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'солнце hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'солнце sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'мульт hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'мульт sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'карусель hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'карусель sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'нтв мир hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'нтв мир sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'ртр планета hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'ртр планета sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'qazaqstan hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'qazaqstan sd': 'https://drm-play.com/iptv.php?tv=nodrm-1'
};

interface SearchResult {
  url: string;
  group?: string;
}

const playlistCache: Record<string, string[]> = {};

async function getCachedPlaylistLines(url: string): Promise<string[]> {
  if (playlistCache[url]) return playlistCache[url];
  try {
    const response = await http.get(url, { timeout: 15000 });
    if (!response.data || typeof response.data !== 'string') return [];
    const lines = response.data.split('\n').map((l: string) => l.trim());
    playlistCache[url] = lines;
    return lines;
  } catch {
    return [];
  }
}

async function searchInUrl(url: string, channelName: string): Promise<SearchResult | null> {
  const lines = await getCachedPlaylistLines(url);
  if (lines.length === 0) return null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && line.includes('#EXTINF') && line.toLowerCase().includes(channelName.toLowerCase())) {
      let foundUrl: string | null = null;
      let foundGroup: string | undefined;

      for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
        const nextLine = lines[j];
        if (nextLine && nextLine.startsWith('#EXTGRP')) {
          foundGroup = nextLine;
        }
        if (nextLine && nextLine.startsWith('http')) {
          foundUrl = nextLine;
          break;
        }
      }
      if (foundUrl) return { url: foundUrl, group: foundGroup };
    }
  }
  return null;
}

async function findReplacement(channelName: string): Promise<SearchResult | null> {
  const normalizedName = channelName.toLowerCase().trim();

  if (CHANNEL_SPECIFIC_SOURCES[normalizedName]) {
    const specificUrl = CHANNEL_SPECIFIC_SOURCES[normalizedName];
    const result = await searchInUrl(specificUrl, channelName);
    if (result) return result;
  }

  for (const url of REPLACEMENT_SOURCES) {
    const result = await searchInUrl(url, channelName);
    if (result) return result;
  }
  
  return null;
}

async function processPlaylists() {
  const files = fs.readdirSync('.').filter((f: string) => f.endsWith('.m3u') || f.endsWith('.m3u8'));

  for (const file of files) {
    console.log(`\n🚀 ОБРАБОТКА ФАЙЛА: ${file}`);
    const content = fs.readFileSync(file, 'utf-8');
    
    const blocks = content.split(/#EXTINF/).filter((b: string) => b.trim().length > 0);
    const linesOfContent = content.split('\n');
    const headerLine = linesOfContent[0] || '';
    const header = headerLine.startsWith('#EXTM3U') ? headerLine + '\n' : '#EXTM3U\n';
    
    let finalChannels: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const blockContent = blocks[i];
      if (!blockContent) continue;
      
      let lines = blockContent.trim().split('\n').map((l: string) => l.trim());
      if (lines.length === 0) continue;
      
      const linkIndex = lines.findLastIndex((l: string) => l.startsWith('http'));
      const percent = (((i + 1) / blocks.length) * 100).toFixed(1);

      const firstLine = lines[0];
      const nameMatch = firstLine ? firstLine.match(/,(.*)$/) : null;
      const name = nameMatch && nameMatch[1] ? nameMatch[1].trim() : 'Unknown';

      let needsReplacement = false;
      let currentLink = linkIndex !== -1 ? lines[linkIndex] : undefined;

      if (!currentLink) {
        process.stdout.write(`[${percent}%] Проверка ${name.padEnd(30)} ⚠️ НЕТ ССЫЛКИ. Поиск...\r`);
        needsReplacement = true;
      } else {
        process.stdout.write(`[${percent}%] Проверка ${name.padEnd(30)}\r`);
        
        const cleanCheckLink = currentLink.split('#')[0]?.trim() || '';

        // Пропускаем проверку для любых ссылок, содержащих слово 'televizor' (televizor24, televizor34 и т.д.)
        if (cleanCheckLink.toLowerCase().includes('televizor')) {
          console.log("Пропускаем...");
          finalChannels.push(lines.join('\n'));
          continue;
        }

        let isAlive = false;
        try {
          const res = await http.get(cleanCheckLink, { responseType: 'stream', timeout: 7000 });
          if (res.status >= 200 && res.status < 400) {
            isAlive = true;
          }
        } catch {
          isAlive = false;
        }

        if (isAlive) {
          finalChannels.push(lines.join('\n'));
        } else {
          needsReplacement = true;
        }
      }

      if (needsReplacement) {
        const result = await findReplacement(name);
        
        if (result) {
          let cleanLines = lines.filter((l: string) => 
            !l.includes('#EXTVLCOPThttp-referrer') && 
            !l.includes('#EXTVLCOPThttp-user-agent') &&
            !l.startsWith('#EXTGRP') &&
            !l.startsWith('http')
          );

          if (result.group) {
            cleanLines.splice(1, 0, result.group);
          }

          const cleanResultUrl = result.url.split('#')[0]?.trim() || '';
          cleanLines.push(cleanResultUrl);
          finalChannels.push(cleanLines.join('\n'));
          console.log(`[${percent}%] ${name.padEnd(30)} ✨ ЗАМЕНА НАЙДЕНА`);
        } else {
          console.log(`[${percent}%] ${name.padEnd(30)} 🗑️ НЕ НАЙДЕНО (Удалено)`);
        }
      }
    }

    fs.writeFileSync(file, header + finalChannels.join('\n\n') + '\n');
    console.log(`✅ Файл ${file} успешно сохранен!`);
  }
}

processPlaylists().catch(console.error);
