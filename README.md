# 📺 FREE_IPTV - Бесплатные плейлисты

Коллекция актуальных IPTV каналов. Плейлисты работают на большинстве современных устройств и плееров.

## 🔗 Прямые ссылки на плейлисты
Для использования просто скопируйте ссылку и вставьте её в ваш IPTV плеер:

1. **Общий список:** 
   `https://dmitriy11223455.github.io/FREE_IPTV/FREE_IPTV.m3u8`
2. **Русскоязычные каналы:** 
   `https://dmitriy11223455.github.io/FREE_IPTV/FREE_IPTVru.m3u8`
3. **Универсальная ссылка**
   `https://dmitriy11223455.github.io/FREE_IPTV/<FILENAME>.m3u(8)`
---

## 🛠 Настройка для разных устройств

### 📱 Android TV / Смартфоны
На ОС Android большинство плееров (TiviMate, OTT Navigator, IPTV Pro) работают со ссылками напрямую без дополнительных настроек.

### 📺 Samsung Tizen OS / LG WebOS
На телевизорах Samsung и LG часто возникает проблема блокировки (ошибка доступа), так как GitHub требует заголовок `Referer`. Чтобы это исправить, используйте прокси через **Cloudflare Workers**.

#### Инструкция по настройке Cloudflare:
1. Создайте бесплатный аккаунт на [Cloudflare](https://dash.cloudflare.com).
2. Перейдите в **Workers & Pages** -> **Create Worker**.
3. Вставьте следующий код в редактор:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  let targetUrl = url.searchParams.get('url');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': '*'
  };

  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (!targetUrl) return new Response('Proxy Ready. Usage: /?url=URL_HERE', { status: 200 });

  try {
    targetUrl = decodeURIComponent(targetUrl).trim();
    const forwardHeaders = new Headers();
    
    // Default Browser Emulation
    forwardHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    forwardHeaders.set('Accept', '*/*');
    forwardHeaders.set('Accept-Language', 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7');

    const lowerUrl = targetUrl.toLowerCase();

    
    // 1. Logic for PLANETA / SMOTRIM / VGTRK / CDNVIDEO
    if (lowerUrl.includes('planeta') || lowerUrl.includes('vgtrk') || lowerUrl.includes('cdnvideo') || lowerUrl.includes('smotrim')) {
      const russiaIp = `185.120.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      // Имитация версии для iOS
      forwardHeaders.set('User-Agent', 'VTRKPlayer/3.4.0 (iPhone; iOS 17.4.1; Scale/3.00)');
      
      // Улаляем все стандартные заголовки Cloudflare
      forwardHeaders.delete('cf-connecting-ip');
      forwardHeaders.delete('cf-ipcountry');
      forwardHeaders.delete('cf-ray');
      forwardHeaders.delete('cf-visitor');
      
      // Заголовок реального IP (Ростелеком)
      forwardHeaders.set('X-Forwarded-For', russiaIp);
      forwardHeaders.set('X-Real-IP', russiaIp);
      forwardHeaders.set('Client-IP', russiaIp);
      forwardHeaders.set('True-Client-IP', russiaIp);
      
      forwardHeaders.set('Origin', 'https://smotrim.ru');
      forwardHeaders.set('Referer', 'https://smotrim.ru');
      forwardHeaders.set('Accept', '*/*');
      forwardHeaders.set('Connection', 'keep-alive');
      forwardHeaders.set('Sec-Fetch-Dest', 'empty');
      forwardHeaders.set('Sec-Fetch-Mode', 'cors');
      forwardHeaders.set('Sec-Fetch-Site', 'cross-site');
    }

    // 2. Logic for NTV (New)
    else if (lowerUrl.includes('ntv.ru') || lowerUrl.includes('ntv-cdn') || lowerUrl.includes('sync-ntv')) {
      forwardHeaders.set('Referer', 'https://www.ntv.ru');
      forwardHeaders.set('Origin', 'https://www.ntv.ru');
      const ntvIp = `176.192.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      forwardHeaders.set('X-Forwarded-For', ntvIp);
      forwardHeaders.set('X-Real-IP', ntvIp);
      forwardHeaders.set('Sec-Fetch-Dest', 'empty');
      forwardHeaders.set('Sec-Fetch-Mode', 'cors');
      forwardHeaders.set('Sec-Fetch-Site', 'cross-site');
    }
    // 3. Logic for Televizor24
    else if (lowerUrl.includes('televizor-24') || lowerUrl.includes('televizor24')) {
      forwardHeaders.set('Referer', 'https://televizor24tochka.ru');
      forwardHeaders.set('Origin', 'https://televizor24tochka.ru');
    } 
    // Default Fallback
    else {
      forwardHeaders.set('Referer', 'https://smotrim.ru');
      const defaultIp = `31.173.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      forwardHeaders.set('X-Forwarded-For', defaultIp);
    }

    const response = await fetch(targetUrl, { 
      headers: forwardHeaders, 
      redirect: 'follow' 
    });

    if (response.status === 403) {
      return new Response('CDN Error: 403 (Forbidden). Link expired or Cloudflare IP blocked.', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    // M3U8 Playlist Rewriting
    if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('apple.mpegurl')) {
      let text = await response.text();
      
      const modifiedText = text.split('\n').map(line => {
        line = line.trim();
        if (!line) return '';
        
        // Fix Encryption Keys (URI)
        if (line.includes('URI=')) {
          return line.replace(/URI=["']([^"']+)["']/, (match, p1) => {
            const abs = new URL(p1, targetUrl).href;
            return `URI="${url.origin}/?url=${encodeURIComponent(abs)}"`;
          });
        }
        
        // Fix Segments (.ts / .m4s)
        if (!line.startsWith('#')) {
          const abs = new URL(line, targetUrl).href;
          return `${url.origin}/?url=${encodeURIComponent(abs)}`;
        }
        
        return line;
      }).join('\n');

      return new Response(modifiedText, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Binary Data (Segments)
    const newHeaders = new Headers(response.headers);
    newHeaders.delete('content-security-policy');
    newHeaders.delete('x-frame-options');
    Object.keys(corsHeaders).forEach(k => newHeaders.set(k, corsHeaders[k]));

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });

  } catch (e) {
    return new Response('Worker Error: ' + e.message, { status: 500, headers: corsHeaders });
  }
}


⚠️ Важное ограничение (Cloudflare Free)

Из-за лимитов бесплатного тарифа Cloudflare на количество запросов:
Один пользователь может подключать не более 3-х устройств одновременно.
Превышение этого лимита может привести к временной блокировке вашего прокси-сервера (ошибка 429 Too Many Requests).
Для личного использования на ТВ и смартфоне этого лимита достаточно.
Видео по настройке https://drive.google.com/file/d/11ORdn3QRnZfiknBmhdp4XlVC1j-btCxG/view?usp=sharing
Поиск в интернете: FREE_IPTV github represitory dmitriy11223455.



⚠️ИЩУТСЯ ПОТОКИ НА СПОРТИВНЫЕ КАНАЛЫ И ТВ3.⚠️
⚠️СОЗДАЁТСЯ ПЛЕЙЛИСТ С РУССКИМИ КАНАЛАМИ.⚠️
⚠️НА КАНАЛЕ РАТНИК ОКОНЧАНИЕ ЭФИРА ЭТО СВЯЗАНО С РЕМОНТОМ НА САЙТЕ "BEREZKA.LIVE"⚠️
