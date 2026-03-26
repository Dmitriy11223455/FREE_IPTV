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
  if (!targetUrl) return new Response('Proxy Active', { status: 200 });

  try {
    targetUrl = decodeURIComponent(targetUrl).trim();
    const forwardHeaders = new Headers();
    
    // Загальний User-Agent
    forwardHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // ЛОГІКА ОБ'ЄДНАННЯ: вибір Referer
    if (targetUrl.includes('televizor-24') || targetUrl.includes('televizor24')) {
      forwardHeaders.set('Referer', 'https://televizor24tochka.ru');
      forwardHeaders.set('Origin', 'https://televizor24tochka.ru');
    } else {
      // Для Росія 1 / Smotrim
      forwardHeaders.set('Referer', 'https://smotrim.ru');
      forwardHeaders.set('Origin', 'https://smotrim.ru');
      // Обхід блоку за IP (фейковий РФ IP)
      const fakeIp = `31.173.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      forwardHeaders.set('X-Forwarded-For', fakeIp);
      forwardHeaders.set('X-Real-IP', fakeIp);
    }

    const response = await fetch(targetUrl, { 
      headers: forwardHeaders, 
      redirect: 'follow' 
    });

    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    // ОБРОБКА ПЛЕЙЛИСТА (.m3u8) - переписування посилань
    if (targetUrl.includes('.m3u8') || contentType.includes('mpegurl')) {
      let text = await response.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      // Заміна посилань на сегменти та ключі (URI)
      const modifiedText = text.split('\n').map(line => {
        line = line.trim();
        if (!line) return '';
        
        // Якщо це рядок з URI (ключ)
        if (line.includes('URI=')) {
          return line.replace(/URI=["']([^"']+)["']/, (match, p1) => {
            const abs = new URL(p1, targetUrl).href;
            return `URI="${url.origin}/?url=${encodeURIComponent(abs)}"`;
          });
        }
        
        // Якщо це посилання на сегмент (не починається з #)
        if (!line.startsWith('#')) {
          const abs = new URL(line, targetUrl).href;
          return `${url.origin}/?url=${encodeURIComponent(abs)}`;
        }
        
        return line;
      }).join('\n');

      return new Response(modifiedText, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/vnd.apple.mpegurl' 
        }
      });
    }

    // ПЕРЕДАЧА ВІДЕО-СЕГМЕНТІВ (.ts / .m4s)
    const newHeaders = new Headers(response.headers);
    // Очищення та встановлення CORS
    newHeaders.delete('content-security-policy');
    newHeaders.delete('x-frame-options');
    Object.keys(corsHeaders).forEach(k => newHeaders.set(k, corsHeaders[k]));

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });

  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500, headers: corsHeaders });
  }
}


⚠️ Важное ограничение (Cloudflare Free)

Из-за лимитов бесплатного тарифа Cloudflare на количество запросов:
Один пользователь может подключать не более 3-х устройств одновременно.
Превышение этого лимита может привести к временной блокировке вашего прокси-сервера (ошибка 429 Too Many Requests).
Для личного использования на ТВ и смартфоне этого лимита достаточно.
Видео по настройке https://drive.google.com/file/d/11ORdn3QRnZfiknBmhdp4XlVC1j-btCxG/view?usp=sharing
Поиск в интернете: FREE_IPTV github represitory dmitriy11223455.



⚠️ВНИМАНИЕ:ИДЁТ РЕМОНТ НА КАНАЛАХ:Россия 1(обычное качество), Рен ТВ и другие каналы с потоком от televizor24tochka.ru⚠️
⚠️ИЩУТСЯ ПОТОКИ НА СПОРТИВНЫЕ КАНАЛЫ И ТВ3.⚠️
⚠️СОЗДАЁТСЯ ПЛЕЙЛИСТ С РУССКИМИ КАНАЛАМИ.⚠️
