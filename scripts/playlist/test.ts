import fs from 'fs';
import axios from 'axios';
import path from 'path';

const http = axios.create({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  validateStatus: () => true 
});

// ВАШИ ССЫЛКИ ДЛЯ ПОИСКА (опечатка в iptv-org исправлена)
const REPLACEMENT_SOURCES = [
  'https://iptv-org.github.io/iptv/index.m3u',
  'https://drm-play.com/iptv.php?tv=nodrm-1'
];

async function findReplacement(channelName: string) {
  for (const url of REPLACEMENT_SOURCES) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const lines = response.data.split('\n').map((l: string) => l.trim());
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('#EXTINF') && lines[i].toLowerCase().includes(channelName.toLowerCase())) {
          let foundUrl = null;
          let foundGroup = null;

          // Ищем URL и группу (в радиусе 6 строк под #EXTINF)
          for (let j = i + 1; j < i + 7; j++) {
            if (lines[j]?.startsWith('#EXTGRP:')) {
              foundGroup = lines[j]; // Копируем строку группы целиком
            }
            if (lines[j]?.startsWith('http')) {
              foundUrl = lines[j];
              break; 
            }
          }
          if (foundUrl) return { url: foundUrl, group: foundGroup };
        }
      }
    } catch { continue; }
  }
  return null;
}

async function processPlaylists() {
  // Ищем все m3u файлы в текущей папке
  const files = fs.readdirSync('./').filter(f => f.endsWith('.m3u') || f.endsWith('.m3u8'));

  for (const file of files) {
    console.log(`\n🚀 ОБРАБОТКА: ${file}`);
    const content = fs.readFileSync(file, 'utf-8');
    
    const blocks = content.split(/(?=#EXTINF)/).filter(b => b.includes('#EXTINF'));
    const headerLine = content.split('\n')[0];
    const header = headerLine.startsWith('#EXTM3U') ? headerLine + '\n' : '#EXTM3U\n';
    
    let finalChannels = [];

    for (let i = 0; i < blocks.length; i++) {
      let lines = blocks[i].trim().split('\n').map(l => l.trim());
      const linkIndex = lines.findLastIndex(l => l.startsWith('http'));
      
      // Расчет процента выполнения
      const percent = (((i + 1) / blocks.length) * 100).toFixed(1);

      if (linkIndex === -1) continue;

      const currentLink = lines[linkIndex];
      const nameMatch = lines[0].match(/,(.*)$/);
      const name = nameMatch ? nameMatch[1].trim() : "Unknown";

      process.stdout.write(`[${percent}%] Проверка: ${name.padEnd(30)}`);
      
      // Проверка текущей ссылки (используем stream для стабильности)
      const res = await http.get(currentLink, { responseType: 'stream' }).catch(() => ({ status: 500 }));

      if (res.status >= 200 && res.status < 400) {
        console.log(` ✅ OK`);
        finalChannels.push(lines.join('\n'));
      } else {
        console.log(` ❌ МЕРТВ. Поиск...`);
        const result = await findReplacement(name);
        
        if (result) {
          console.log(`   ✨ ЗАМЕНА НАЙДЕНА`);
          
          // Удаляем старые заголовки (Referer/UA) и старую группу
          let cleanLines = lines.filter(l => 
            !l.includes('#EXTVLCOPT:http-referrer') && 
            !l.includes('#EXTVLCOPT:http-user-agent') &&
            !l.startsWith('#EXTGRP:')
          );

          // Если в источнике была группа — вставляем её сразу под #EXTINF
          if (result.group) {
            cleanLines.splice(1, 0, result.group);
          }

          // Обновляем ссылку в последней строке
          cleanLines[cleanLines.length - 1] = result.url;
          finalChannels.push(cleanLines.join('\n'));
        } else {
          console.log(`   🗑️ Удалено.`);
        }
      }
    }
    fs.writeFileSync(file, header + finalChannels.join('\n\n'));
    console.log(`✅ Файл ${file} завершен!`);
  }
}

processPlaylists().catch(console.error);


