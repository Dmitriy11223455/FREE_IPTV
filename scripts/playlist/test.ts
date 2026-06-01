import fs from 'fs';
import axios from 'axios';
import path from 'path';

async function runTest() {
  // 1. Ищем все файлы плейлистов в корне репозитория
  const rootDir = './';
  const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.m3u') || f.endsWith('.m3u8'));

  if (files.length === 0) {
    console.log("❌ Плейлисты (.m3u/.m3u8) не найдены в корне проекта.");
    return;
  }

  for (const file of files) {
    console.log(`\n--- Проверка файла: ${file} ---`);
    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Регулярное выражение для поиска ссылок
    const links = content.match(/https?:\/\/[^\s"']+/g) || [];
    console.log(`Найдено ссылок: ${links.length}`);

    for (const link of links) {
      try {
        // Проверяем статус ссылки (таймаут 5 секунд)
        const response = await axios.get(link.trim(), { 
          timeout: 5000, 
          headers: { 'User-Agent': 'Mozilla/5.0' },
          validateStatus: () => true 
        });

        if (response.status >= 200 && response.status < 400) {
          console.log(`✅ [${response.status}] РАБОТАЕТ: ${link}`);
        } else {
          console.log(`⚠️ [${response.status}] ОШИБКА: ${link}`);
        }
      } catch (error: any) {
        console.log(`❌ [DOWN] НЕ ДОСТУПЕН: ${link} (${error.message})`);
      }
    }
  }
}

runTest().catch(err => console.error("Критическая ошибка:", err));

