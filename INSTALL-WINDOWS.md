# qBit Mobile Windows Portable Install

qBit Mobile is a web/PWA remote for qBittorrent. It runs on the same Windows PC as qBittorrent, serves the mobile app, and proxies `/qbit` to the local qBittorrent WebUI/API.

It does not store your qBittorrent password. The app can remember the server address and username on your device; the password is only used in memory for qBittorrent's normal Web API login.

## 5-minute quick start

1. Open qBittorrent on the Windows PC.
2. Go to Tools -> Options -> Web UI.
3. Enable the Web User Interface.
4. Note the WebUI port. qBit Mobile defaults to `8081`.
5. Download and extract the qBit Mobile portable ZIP.
6. If qBittorrent uses a different WebUI port, edit `config.json` after the first start, or copy `config.example.json` to `config.json` and change `qbitPort`.
7. Run `start-qbit-mobile.cmd`.
8. Open qBit Mobile from another device:
   - Same PC: `http://127.0.0.1:8792`
   - LAN: `http://PC-LAN-IP:8792`
   - Tailscale: `http://100.x.x.x:8792` or `http://your-pc-name:8792`
9. In qBit Mobile, use server address `/qbit`, then enter your qBittorrent WebUI username and password.
10. On your phone, use Add to Home Screen to install the PWA.

## Configuration

`config.json` is created from `config.example.json` if it does not exist.

```json
{
  "qbitMobilePort": 8792,
  "listenAddress": "0.0.0.0",
  "qbitHost": "127.0.0.1",
  "qbitPort": 8081
}
```

Settings:

- `qbitMobilePort`: the port for qBit Mobile.
- `listenAddress`: `0.0.0.0` listens on all interfaces. Use Windows Firewall or your network settings to control access.
- `qbitHost`: usually `127.0.0.1` because qBittorrent is on the same PC.
- `qbitPort`: the qBittorrent WebUI port.

Do not put qBittorrent usernames or passwords in this file.

## Requirements

- Windows PC running qBittorrent.
- Node.js `22.13.0` or newer.

This first portable release uses Node.js directly. A later packaging step could bundle the host into a single executable so users do not need Node installed.

## Optional Windows autostart

Run `install-autostart.cmd` to register a Task Scheduler entry that starts qBit Mobile after Windows sign-in.

Run `remove-autostart.cmd` to remove it.

The autostart task starts qBit Mobile only. It does not install, configure, or restart qBittorrent.

## Windows Firewall

If another device cannot open qBit Mobile, allow the qBit Mobile port through Windows Firewall.

For the default port:

```powershell
New-NetFirewallRule -DisplayName "qBit Mobile Portable" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8792
```

LAN access means devices on your local network can reach the port if the firewall allows it.

Tailscale access means devices in your tailnet can reach the port using the PC's Tailscale IP or MagicDNS name if firewall/network policy allows it.

Public Internet exposure is different. Do not port-forward qBit Mobile from your router unless you understand the security risk. qBit Mobile relies on qBittorrent WebUI authentication and is intended for LAN/Tailscale-style access.

## Troubleshooting

### qBit Mobile page is unreachable

- Confirm `start-qbit-mobile.cmd` is still running.
- Confirm the address uses the qBit Mobile port, default `8792`.
- Check Windows Firewall.
- If using Tailscale, confirm both devices are connected to the same tailnet.

### qBittorrent returns 403

`403` usually means qBittorrent WebUI is reachable but you are not logged in. Use the qBittorrent WebUI username and password in qBit Mobile.

### Login says username/password is wrong

- Confirm qBittorrent is running.
- Open `http://127.0.0.1:8081` on the qBittorrent PC, replacing `8081` if needed.
- Confirm the same username/password works in qBittorrent's normal WebUI.
- Confirm qBit Mobile's server address is `/qbit`.

### Wrong qBittorrent WebUI port

Check qBittorrent: Tools -> Options -> Web UI -> Port.

Update `config.json`:

```json
{
  "qbitPort": 8081
}
```

Restart `start-qbit-mobile.cmd`.

### Torrent list does not load after login

- Confirm qBittorrent WebUI is enabled.
- Confirm qBit Mobile is using `/qbit`.
- Close and reopen the PWA if an old failed session is stuck.

### RSS is empty or fails

- Confirm RSS is enabled and configured inside qBittorrent.
- Confirm the same RSS feeds load in qBittorrent itself.
- Reconnect qBit Mobile if the qBittorrent session expired.

### PWA install does not appear

- Use a modern mobile browser.
- Open qBit Mobile over HTTP on LAN/Tailscale or HTTPS if you put it behind your own trusted reverse proxy.
- Refresh once, then use the browser's Add to Home Screen option.

### Browser cache or service worker issues

qBit Mobile does not cache `/qbit` API or authentication responses. If the app shell seems stale, close the installed PWA and reopen it. If needed, clear site data for the qBit Mobile address in the browser.
