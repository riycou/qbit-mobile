# qBit Mobile

qBit Mobile is a mobile-first web/PWA remote for qBittorrent. It runs as a lightweight local web app on the same Windows PC as qBittorrent, serves a touch-friendly interface, and proxies `/qbit` to qBittorrent's normal WebUI/API.

It is designed for LAN or Tailscale use from a phone, tablet, or desktop browser.

## Why I built qBit Mobile

I originally built qBit Mobile because I was tired of sideloading a qBittorrent controller onto my iPhone, only to have to deal with signing and reinstalling it again later.

I didn’t need another giant media-management project. I just wanted qBittorrent on my phone to feel like an app.

So I built the interface I actually wanted to use: fast, touch-friendly, installable as a PWA, and connected directly to the qBittorrent instance already running on my PC.

It started as a personal project, and once it was doing about 90% of what I wanted, I figured there wasn’t much reason to keep it to myself.

qBit Mobile is MIT licensed. Use it, fork it, break it, improve it, or turn it into something completely different. If it saves somebody else from the sideloading headache that started this project, that’s a win.

Codex and ChatGPT did a lot of the heavy lifting on the code. I gave the direction, tested the hell out of it, and shaped it into the app I wanted. That’s also part of why I’m making it open source — we all made it, so anyone should be able to use it.

## Highlights

- Live torrent dashboard with real qBittorrent data.
- Add torrents by magnet/URL or `.torrent` file.
- Set remote save path, category, tags, paused state, sequential download, and first/last piece priority when adding.
- Manage torrents: start, pause, force start, recheck, reannounce, rename, move location, category, tags, delete, file priority, trackers/files view.
- RSS page with all/unread/feed views, refresh, add-feed, and torrent-add actions.
- Advanced tab backed by qBittorrent's preferences API for common native WebUI options.
- Appearance settings with light/dark/system modes and eight accent colors.
- PWA install support with icons, safe-area handling, and service-worker rules that exclude `/qbit` API/auth traffic.
- Password is never persistently stored. qBittorrent remains the only authentication system.

## Quick install on Windows

For normal users, download the latest release and run:

- `qbit-mobile-windows-setup-v1.1.0.exe` for the installer, or
- `qbit-mobile-windows-portable-v1.1.0.zip` for the portable folder.

See [INSTALL-WINDOWS.md](INSTALL-WINDOWS.md) for the 5-minute setup guide, qBittorrent WebUI setup, firewall notes, Tailscale access, and troubleshooting.

## Development

```powershell
pnpm install
pnpm build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\portable\package-release.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\installer\build-installer.ps1
```

The portable host defaults to:

```json
{
  "qbitMobilePort": 8792,
  "listenAddress": "0.0.0.0",
  "qbitHost": "127.0.0.1",
  "qbitPort": 8081
}
```

Do not put qBittorrent credentials in `config.json`.

## Security model

qBit Mobile does not create its own user account system. It uses qBittorrent's normal WebUI authentication and session cookie. The app may remember server address and username locally on the device; the password remains memory-only.

Do not expose qBit Mobile or qBittorrent directly to the public Internet unless you understand the risk and have added your own hardened reverse proxy/security controls.
