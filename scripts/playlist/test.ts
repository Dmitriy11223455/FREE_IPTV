import fs from 'fs';
import axios from 'axios';
import path from 'path';

const http = axios.create({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  validateStatus: () => true 
});

// 1. СПИСОК ВАШИХ ССЫЛОК ДЛЯ ПОИСКА ЗАМЕН
const REPLACEMENT_SOURCES = [
  'https://github.io', // Рекомендуется (JSON API)
  'https://githubusercontent.com' // Обычный плейлист
];

async function findReplacement(channelName: string) {
  for (const sourceUrl of REPLACEMENT_SOURCES) {
    try {
      const response = await axios.get(sourceUrl, { timeout: 10000 });
      const data = response.data;

      // Если источник — JSON (как iptv-org API)
      if (Array.isArray(data)) {
        const found = data.find((s: any) => 
          s.channel && s.channel.toLowerCase().includes(channelName.toLowerCase()) && s.status === 'online'
        );
        if (found) return found.url;
      } 
      // Если источник — обычный M3U
      else if (typeof data === 'string') {
        const lines = data.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(channelName.toLowerCase())) {
            // Ищем первую строку с http ниже найденного названия
            for (let j = i + 1; j < i + 5; j++) {
              if (lines[j]?.trim().startsWith('http')) return lines[j].trim();
            }
          }
        }
      }
    } catch (e) {
      continue; // Ошибка в одном источнике — идем к следующему
    }
  }
  return null;
}

async function processPlaylists() {
  const rootDir = './';
  const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.m3u') || f.endsWith('.m3u8'));

  for (const file of files) {
    console.log(`\n🚀 ОБРАБОТКА: ${file}`);
    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Сохраняем заголовок файла целиком (со всеми параметрами tvg-url и т.д.)
    const headerMatch = content.match(/#EXTM3U.*\n/);
    const header = headerMatch ? headerMatch[0] : '#EXTM3U\n';

    const blocks = content.split(/#EXTINF/).filter(b => b.trim() !== '' && !b.startsWith('#EXTM3U'));
    let finalChannels = [];
    let seenLinks = new Set();

    for (let i = 0; i < blocks.length; i++) {
      let block = '#EXTINF' + blocks[i];
      const lines = block.split('\n').filter(l => l.trim() !== '');
      
      // Находим ссылку (обычно последняя строка в блоке)
      const linkIndex = lines.findIndex(l => l.trim().startsWith('http'));
      const link = linkIndex !== -1 ? lines[linkIndex].trim() : null;
      
      // Извлекаем чистое название канала для поиска
      const nameMatch = lines[0].match(/,(.*)/);
      const name = nameMatch ? nameMatch[1].trim() : "Unknown";
      const percent = (((i + 1) / blocks.length) * 100).toFixed(1);

      if (link) {
        if (seenLinks.has(link)) continue;

        console.log(`[${percent}%] Проверка: ${name}`);
        const res = await http.head(link).catch(() => ({ status: 500 }));

        if (res.status >= 200 && res.status < 400) {
          console.log(`   ✅ OK`);
          finalChannels.push(block.trim());
          seenLinks.add(link);
        } else {
          console.log(`   ❌ МЕРТВ. Ищем замену...`);
          const replacement = await findReplacement(name);
          if (replacement) {
            console.log(`   ✨ ЗАМЕНА НАЙДЕНА`);
            // Заменяем только ссылку, оставляя все атрибуты (лого, ID) в первой строке
            lines[linkIndex] = replacement;
            finalChannels.push(lines.join('\n').trim());
            seenLinks.add(replacement);
          } else {
            console.log(`   🗑️ Удаляем.`);
          }
        }
      }
    }
    fs.writeFileSync(filePath, header + finalChannels.join('\n\n'));
    console.log(`✅ ${file} готов! Каналов: ${finalChannels.length}`);
  }
}

processPlaylists().catch(console.error);

