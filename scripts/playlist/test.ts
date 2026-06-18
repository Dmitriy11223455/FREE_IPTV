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
  'https://drm-play.com/iptv.php?tv=nodrm-1',
  'https://raw.githubusercontent.com/Dmitriy11223455/iptv-autoupdate/refs/heads/main/playlist.m3u'
];

// СЛОВАРЬ ДЛЯ КОНКРЕТНЫХ КАНАЛОВ
// Название канала пишите строго МАЛЕНЬКИМИ буквами
const CHANNEL_SPECIFIC_SOURCES: Record<string, string> = {
  'россия 1': 'https://raw.githubusercontent.com/Dmitriy11223455/iptv-autoupdate/refs/heads/main/playlist.m3u',
  'рен тв': 'https://raw.githubusercontent.com/Dmitriy11223455/iptv-autoupdate/refs/heads/main/playlist.m3u',
  'россия' : 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'спас' : 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'звезда' : 'https://raw.githubusercontent.com/Dmitriy11223455/iptv-autoupdate/refs/heads/main/playlist.m3u',
  'нтв hd' : 'https://raw.githubusercontent.com/Dmitriy11223455/iptv-autoupdate/refs/heads/main/playlist.m3u',
  'стс' : 'https://raw.githubusercontent.com/Dmitriy11223455/iptv-autoupdate/refs/heads/main/playlist.m3u',
  'матч тв sd' : 'https://drm-play.com/iptv.php?tv=nodrm-1',
  'матч тв' : 'https://raw.githubusercontent.com/Dmitriy11223455/iptv-autoupdate/refs/heads/main/playlist.m3u',
  'матч! арена' : 'https://drm-play.com/iptv.php?tv=nodrm-1'
  'матч! игра' : 'https://drm-play.com/iptv.php?tv=nodrm-1',
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
  'россия 1 sd': 'https://drm-play.com/iptv.php?tv=nodrm-1',
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

      const nameMatch = lines[0].match(/,(.*)$/);
      const name = nameMatch ? nameMatch[1].trim() : "Unknown";

      let needsReplacement = false;

      if (linkIndex === -1) {
        process.stdout.write(`[${percent}%] Проверка: ${name.padEnd(30)} ⚠️ НЕТ ССЫЛКИ. Поиск...`);
        needsReplacement = true;
      } else {
        const currentLink = lines[linkIndex];
        process.stdout.write(`[${percent}%] Проверка: ${name.padEnd(30)}`);
        
        // 🛠️ ИЗМЕНЕНИЕ ДЛЯ МЕДИАВИТРИНЫ №1: Очищаем текущую ссылку от хвоста '|', чтобы axios не выдавал ошибку 500
        const cleanCheckLink = currentLink.split('|')[0].trim();
        
        const res = await http.get(cleanCheckLink, { responseType: 'stream' }).catch(() => ({ status: 500 }));
        
        if (res.status >= 200 && res.status < 400) {
          console.log(` ✅ OK`);
          finalChannels.push(lines.join('\n'));
        } else {
          console.log(` ❌ МЕРТВ. Поиск...`);
          needsReplacement = true;
        }
      }

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

          // 🛠️ ИЗМЕНЕНИЕ ДЛЯ МЕДИАВИТРИНЫ №2: Очищаем найденную ссылку-замену от любого хвоста с '|' перед записью
          const cleanResultUrl = result.url.split('|')[0].trim();

          cleanLines.push(cleanResultUrl);
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
