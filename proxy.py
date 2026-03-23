import requests
from flask import Flask, Response, request

app = Flask(__name__)

HEADERS = {
    "Referer": "https://televizor24tochka.ru",
    "User-Agent": "Mozilla/5.0"
}

def proxy_request(url):
    return requests.get(url, headers=HEADERS, stream=True)

@app.route("/proxy")
def proxy():
    url = request.args.get("url")
    r = proxy_request(url)

    content_type = r.headers.get("Content-Type", "")

    # если это m3u8 — переписываем
    if "mpegurl" in content_type:
        text = r.text
        base = url.rsplit("/", 1)[0]

        new_lines = []
        for line in text.splitlines():
            if line.endswith(".ts"):
                line = f"{request.host_url}segment?url={base}/{line}"
            new_lines.append(line)

        return Response("\n".join(new_lines),
                        content_type="application/vnd.apple.mpegurl")

    return Response(r.content, content_type=content_type)

@app.route("/segment")
def segment():
    url = request.args.get("url")
    r = proxy_request(url)

    return Response(r.iter_content(1024),
                    content_type="video/MP2T")

app.run(host="0.0.0.0", port=8080)

