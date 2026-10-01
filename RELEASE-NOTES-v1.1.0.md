# qBit Mobile v1.1.0

This release is a community-focused overhaul of qBit Mobile.

## What's new

- Cleaner mobile/desktop layout with Dashboard, Torrents, RSS, Advanced, and Settings.
- Expanded native qBittorrent controls from the WebUI API.
- Advanced qBittorrent preferences editor with secret fields intentionally hidden.
- Better add-torrent flow with save path, category, tags, paused, sequential, and first/last piece options.
- RSS unread tab, feed refresh, add-feed, and add-from-RSS actions.
- Windows installer EXE packaging in addition to the portable ZIP.
- Desktop/Start Menu shortcuts, uninstall tooling, and hidden autostart support.
- Portable host `/health` endpoint and safer config behavior.

## Security

qBit Mobile still does not persist qBittorrent passwords. Server address and username may be remembered locally on the device; qBittorrent authentication and session cookies remain handled by qBittorrent.
