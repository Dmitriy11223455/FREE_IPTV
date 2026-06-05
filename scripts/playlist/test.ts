import fs from 'fs';
import axios from 'axios';
import path from 'path';

const http = axios.create({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  validateStatus: () => true 
});

// ВАШИ ССЫЛКИ ДЛЯ ПОИСКА (из первого сообщения)
const REPLACEMENT_SOURCES = [
  'https://iptv-org.github.io/iptv/index.m3u',
  'https://drm-play.com/iptv.php?tv=nodrm-1'
];

// СЛОВАРЬ ДЛЯ КОНКРЕТНЫХ КАНАЛОВ
// Название канала пишите строго МАЛЕНЬКИМИ буквами
const CHANNEL_SPECIFIC_SOURCES: Record<string, string> = {
  'россия 1': 'https://iptv-org.github.io/iptv/raw/ru_televizor24.m3u',
  'рен тв hd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'россия' : 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'спас' : 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'звезда' : 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'нтв hd' : 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'стс' : 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'rt' : 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч тв' : 'https://drm-play.com/iptv.php?tv=nodrm-1'
};

// Функция поиска канала внутри конкретного плейлиста
async function searchInUrl(url: string, channelName: string) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const lines = response.data.split('\n').map((l: string) => l.trim());
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('#EXTINF') && lines[i].toLowerCase().includes(channelName.toLowerCase())) {
        let foundUrl = null;
        let foundGroup = null;

        for (let j = i + 1; j < i + 7; j++) {
          if (lines[j]?.startsWith('#EXTGRP:')) {
            foundGroup = lines[j]; 
          }
          if (lines[j]?.startsWith('http')) {
            foundUrl = lines[j];
            break; 
          }
        }
        if (foundUrl) return { url: foundUrl, group: foundGroup };
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function findReplacement(channelName: string) {
  const normalizedName = channelName.toLowerCase().trim();

  // 1. Проверяем персональную ссылку из словаря
  if (CHANNEL_SPECIFIC_SOURCES[normalizedName]) {
    const specificUrl = CHANNEL_SPECIFIC_SOURCES[normalizedName];
    console.log(`   🔍 Поиск в персональном источнике для "${channelName}"...`);
    const result = await searchInUrl(specificUrl, channelName);
    if (result) return result; 
    console.log(`   ⚠️ В персональном источнике не найдено. Переходим к общему поиску...`);
  }

  // 2. Если в словаре нет или там не нашлось — ищем по вашим общим ссылкам
  for (const url of REPLACEMENT_SOURCES) {
    const result = await searchInUrl(url, channelName);
    if (result) return result;
  }
  
  return null;
}

async function processPlaylists() {
  const files = fs.readdirSync('./').filter(f => f.endsWith('.m3u') || f.endsWith('.m3u8'));

  for (const file of files) {
    console.log(`\n🚀 ОБРАБОТКА: ${file}`);
    const content = fs.readFileSync(file, 'utf-8');
    
    const blocks = content.split(/(?=#EXTINF)/).filter(b => b.includes('#EXTINF'));
    const linesOfContent = content.split('\n');
    const headerLine = linesOfContent[0];
    const header = headerLine.startsWith('#EXTM3U') ? headerLine + '\n' : '#EXTM3U\n';
    
    let finalChannels = [];

    for (let i = 0; i < blocks.length; i++) {
      let lines = blocks[i].trim().split('\n').map(l => l.trim());
      const linkIndex = lines.findLastIndex(l => l.startsWith('http'));
      
      const percent = (((i + 1) / blocks.length) * 100).toFixed(1);

      // Корректно берем первую строку блока для поиска имени канала
      const nameMatch = lines[0].match(/,(.*)$/);
      const name = nameMatch ? nameMatch[1].trim() : "Unknown";

      let needsReplacement = false;

      // Если ссылки в блоке вообще нет (просто написано extinf)
      if (linkIndex === -1) {
        process.stdout.write(`[${percent}%] Проверка: ${name.padEnd(30)} ⚠️ НЕТ ССЫЛКИ. Поиск...`);
        needsReplacement = true;
      } else {
        // Если ссылка есть — проверяем её доступность
        const currentLink = lines[linkIndex];
        process.stdout.write(`[${percent}%] Проверка: ${name.padEnd(30)}`);
        
        const res = await http.get(currentLink, { responseType: 'stream' }).catch(() => ({ status: 500 }));
        
        if (res.status >= 200 && res.status < 400) {
          console.log(` ✅ OK`);
          finalChannels.push(lines.join('\n'));
        } else {
          console.log(` ❌ МЕРТВ. Поиск...`);
          needsReplacement = true;
        }
      }

      // Блок поиска замены (для битых ссылок и для extinf без ссылок)
      if (needsReplacement) {
        const result = await findReplacement(name);
        
        if (result) {
          console.log(`   ✨ ЗАМЕНА НАЙДЕНА`);
          
          let cleanLines = lines.filter(l => 
            !l.includes('#EXTVLCOPT:http-referrer') && 
            !l.includes('#EXTVLCOPT:http-user-agent') &&
            !l.startsWith('#EXTGRP:') &&
            !l.startsWith('http')
          );

          if (result.group) {
            cleanLines.splice(1, 0, result.group);
          }

          cleanLines.push(result.url);
          finalChannels.push(cleanLines.join('\n'));
        } else {
          console.log(`   🗑️ Не найдено. Удалено.`);
        }
      }
    }
    fs.writeFileSync(file, header + finalChannels.join('\n\n'));
    console.log(`✅ Файл ${file} завершен!`);
  }
}

processPlaylists().catch(console.error);
