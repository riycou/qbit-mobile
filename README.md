# qBit Mobile

qBit Mobile is a touch-friendly web/PWA remote for qBittorrent on Windows.

It serves a mobile-first qBittorrent interface and proxies `/qbit` requests to a locally running qBittorrent WebUI/API instance.

Why I built qBit Mobile

I originally built qBit Mobile because I was tired of sideloading a qBittorrent controller onto my iPhone, only to have to deal with signing and reinstalling it again later.

I didn’t need another giant media-management project. I just wanted qBittorrent on my phone to feel like an app.

So I built the interface I actually wanted to use: fast, touch-friendly, installable as a PWA, and connected directly to the qBittorrent instance already running on my PC.

It started as a personal project, and once it was doing about 90% of what I wanted, I figured there wasn’t much reason to keep it to myself.

qBit Mobile is MIT licensed. Use it, fork it, break it, improve it, or turn it into something completely different. If it saves somebody else from the sideloading headache that started this project, that’s a win.

codex and chatgpt were the heavy lifters in coding I gave direction and testing. that's why anyone can use it because we all made it. 

## Quick start

1. Enable the qBittorrent WebUI.
2. Confirm the qBittorrent WebUI port, default `8081`.
3. Edit `config.json` if needed, using `config.example.json` as the template.
4. Run `start-qbit-mobile.cmd`.
5. Open `http://PC-IP:8792` or `http://TAILSCALE-NAME:8792` from your phone.
6. Enter your qBittorrent username and password.
7. Add the site to your phone Home Screen.

See [INSTALL-WINDOWS.md](INSTALL-WINDOWS.md) for full setup and troubleshooting.

## Defaults

- qBit Mobile port: `8792`
- Listen address: `0.0.0.0`
- qBittorrent host: `127.0.0.1`
- qBittorrent WebUI port: `8081`
- qBittorrent proxy route: `/qbit`

## Security

qBit Mobile does not store your qBittorrent password. The server address and username may be remembered locally by your browser. qBittorrent handles authentication through its normal Web API session cookie.

Do not expose qBit Mobile or qBittorrent directly to the public Internet without understanding the security implications. Prefer LAN or Tailscale access.

## License

MIT
