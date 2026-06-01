import fs from 'fs';
import axios from 'axios';
import path from 'path';

// Настройки: таймаут 5 секунд, имитация браузера
const http = axios.create({
  timeout: 5000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  validateStatus: () => true 
});

async function cleanPlaylists() {
  const rootDir = './';
  const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.m3u') || f.endsWith('.m3u8'));

  for (const file of files) {
    console.log(`\n=======================================`);
    console.log(`🚀 НАЧИНАЕМ ОЧИСТКУ: ${file}`);
    console.log(`=======================================`);

    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const channels = content.split(/#EXTINF/).filter(c => c.trim() !== '' && !c.startsWith('#EXTM3U'));
    const header = content.startsWith('#EXTM3U') ? '#EXTM3U\n' : '';
    
    let activeChannels = [];
    const total = channels.length;

    for (let i = 0; i < total; i++) {
      const fullChannel = '#EXTINF' + channels[i];
      const streamLink = fullChannel.split('\n').find(l => l.trim().startsWith('http'));
      
      // Считаем прогресс
      const percent = (((i + 1) / total) * 100).toFixed(1);
      
      if (streamLink) {
        const link = streamLink.trim();

        // 1. Пропускаем картинки, чтобы не зависать
        if (link.match(/\.(png|jpg|jpeg|svg|gif|ico)$/i)) {
          continue;
        }

        try {
          // 2. HEAD запрос — самый быстрый способ проверки
          const response = await http.head(link);
          
          if (response.status >= 200 && response.status < 400) {
            console.log(`[${percent}%] ✅ OK: ${link}`);
            activeChannels.push(fullChannel.trim());
          } else {
            console.log(`[${percent}%] ❌ МЕРТВ (${response.status}): ${link}`);
          }
        } catch (error: any) {
          console.log(`[${percent}%] ❌ ТАЙМАУТ: ${link}`);
        }
      }
    }

    // 3. Сохраняем результат
    fs.writeFileSync(filePath, header + activeChannels.join('\n\n'));
    console.log(`\n✅ ГОТОВО! Файл ${file} обновлен.`);
    console.log(`📊 Статистика: было ${total}, осталось ${activeChannels.length}`);
  }
}

cleanPlaylists().catch(err => console.error("Критическая ошибка:", err));

