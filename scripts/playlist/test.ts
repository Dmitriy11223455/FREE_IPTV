import fs from 'fs';
import axios from 'axios';
import path from 'path';

const http = axios.create({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  validateStatus: () => true 
});

async function findReplacement(channelName: string) {
  try {
    const response = await axios.get(`https://iptv-org.github.io/iptv/index.m3u`, { timeout: 10000 });
    const streams = response.data;
    const found = streams.find((s: any) => 
      s.channel && s.channel.toLowerCase().includes(channelName.toLowerCase()) && s.status === 'online'
    );
    return found ? found.url : null;
  } catch { return null; }
}

async function processPlaylists() {
  const rootDir = './';
  const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.m3u') || f.endsWith('.m3u8'));

  for (const file of files) {
    console.log(`\n🚀 ОБРАБОТКА: ${file}`);
    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const blocks = content.split(/#EXTINF/).filter(b => b.trim() !== '' && !b.startsWith('#EXTM3U'));
    const header = content.startsWith('#EXTM3U') ? '#EXTM3U\n' : '';
    
    let finalChannels = [];
    let seenLinks = new Set();

    for (let i = 0; i < blocks.length; i++) {
      let block = '#EXTINF' + blocks[i];
      const lines = block.split('\n').map(l => l.trim()).filter(l => l !== '');
      const link = lines.find(l => l.startsWith('http'));
      const nameMatch = block.match(/,(.*)/);
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
            const newBlock = block.replace(link, replacement);
            finalChannels.push(newBlock.trim());
            seenLinks.add(replacement);
          } else {
            console.log(`   🗑️ Удаляем.`);
          }
        }
      }
    }
    fs.writeFileSync(filePath, header + finalChannels.join('\n\n'));
    console.log(`✅ ${file} готов! Осталось: ${finalChannels.length}`);
  }
}

processPlaylists().catch(console.error);

