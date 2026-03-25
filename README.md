# 📺 FREE_IPTV - Бесплатные плейлисты

Коллекция актуальных IPTV каналов. Плейлисты работают на большинстве современных устройств и плееров.

## 🔗 Прямые ссылки на плейлисты
Для использования просто скопируйте ссылку и вставьте её в ваш IPTV плеер:

1. **Общий список:** 
   `https://dmitriy11223455.github.io/FREE_IPTV/FREE_IPTV.m3u8`
2. **Русскоязычные каналы:** 
   `https://dmitriy11223455.github.io/FREE_IPTV/FREE_IPTVru.m3u8`

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
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let targetUrl = url.searchParams.get('url');

    // 1. Обработка CORS Preflight (важно для ТВ-браузеров)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    if (!targetUrl) {
      return new Response('Proxy Ready. Use: ?url=LINK', { status: 200 });
    }

    try {
      targetUrl = decodeURIComponent(targetUrl).trim();
      const target = new URL(targetUrl);

      // 2. Формируем заголовки запроса к ВГТРК
      const forwardHeaders = new Headers();
      // Используем современный UA, но с пометкой SmartTV для совместимости
      forwardHeaders.set('User-Agent', 'Mozilla/5.0 (SmartTV; Linux; Tizen) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.0 Chrome/122.0.0.0 Safari/537.36');
      forwardHeaders.set('Accept', '*/*');
      forwardHeaders.set('Connection', 'keep-alive');

      // Маскировка под плеер Смотрим/ВГТРК
      if (target.hostname.includes('vgtrk') || target.hostname.includes('smotrim') || target.hostname.includes('live-russia')) {
        forwardHeaders.set('Origin', 'https://smotrim.ru');
        forwardHeaders.set('Referer', 'https://smotrim.ru');
      } else {
        forwardHeaders.set('Origin', target.origin);
        forwardHeaders.set('Referer', target.origin + '/');
      }

      // Передаем Range, если плеер ТВ его запрашивает (для стабильности сегментов)
      if (request.headers.has('Range')) {
        forwardHeaders.set('Range', request.headers.get('Range'));
      }

      const response = await fetch(targetUrl, { 
        headers: forwardHeaders,
        redirect: 'follow' 
      });

      const contentType = response.headers.get('content-type') || '';

      // 3. ОБРАБОТКА ПЛЕЙЛИСТА (M3U8)
      if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
        let text = await response.text();
        const proxyPrefix = `${url.origin}${url.pathname}?url=`;

        const modifiedText = text.split('\n').map(line => {
          line = line.trim();
          if (!line) return line;

          // Обработка служебных тегов (Ключи шифрования URI="...", Кадры и т.д.)
          if (line.startsWith('#')) {
            return line.replace(/URI=["']([^"']+)["']/, (match, p1) => {
              const absKeyUrl = new URL(p1, targetUrl).href;
              return `URI="${proxyPrefix}${encodeURIComponent(absKeyUrl)}"`;
            });
          }

          // Обработка ссылок на сегменты или вложенные плейлисты
          try {
            const absoluteUrl = new URL(line, targetUrl).href;
            return proxyPrefix + encodeURIComponent(absoluteUrl);
          } catch (e) {
            return line;
          }
        }).join('\n');

        return new Response(modifiedText, {
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Cache-Control': 'no-cache',
          }
        });
      }

      // 4. ПРЯМАЯ ПЕРЕДАЧА ДАННЫХ (Сегменты .ts, Ключи .key)
      const proxyResponse = new Response(response.body, {
        status: response.status,
        headers: response.headers
      });

      // Чистим заголовки для ТВ, добавляем CORS
      proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
      proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      proxyResponse.headers.delete('X-Frame-Options');
      proxyResponse.headers.delete('Content-Security-Policy');
      // Для .ts файлов принудительно ставим правильный тип, если сервер его не отдал
      if (targetUrl.includes('.ts') && !contentType) {
        proxyResponse.headers.set('Content-Type', 'video/mp2t');
      }

      return proxyResponse;

    } catch (e) {
      return new Response('Proxy Error: ' + e.message, { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
⚠️ Важное ограничение (Cloudflare Free)

Из-за лимитов бесплатного тарифа Cloudflare на количество запросов:
Один пользователь может подключать не более 3-х устройств одновременно.
Превышение этого лимита может привести к временной блокировке вашего прокси-сервера (ошибка 429 Too Many Requests).
Для личного использования на ТВ и смартфоне этого лимита достаточно.
Видео по настройке https://drive.google.com/file/d/11ORdn3QRnZfiknBmhdp4XlVC1j-btCxG/view?usp=sharing
Поиск в интернете: FREE_IPTV github represitory dmitriy11223455.
