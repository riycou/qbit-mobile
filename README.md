# qBit Mobile

qBit Mobile is a touch-friendly web/PWA remote for qBittorrent on Windows.

It serves a mobile-first qBittorrent interface and proxies `/qbit` requests to a locally running qBittorrent WebUI/API instance.

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
