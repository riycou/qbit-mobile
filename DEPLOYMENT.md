# qBit Mobile Portable Deployment Notes

This branch is the community/portable edition. It is intended to be built into a ZIP and run on the same Windows PC as qBittorrent.

The personal IIS deployment is intentionally not part of this branch. Keep machine-specific reverse proxy rules, hostnames, public domains, local account paths, and service startup details on a separate personal branch.

## Architecture

- qBit Mobile frontend is built as a static PWA.
- `portable/host.mjs` serves the built frontend from `www/`.
- The same host proxies `/qbit` to qBittorrent's WebUI/API.
- Default qBittorrent target is `http://127.0.0.1:8081`.
- Default qBit Mobile listener is `0.0.0.0:8792`.

## Release Build

1. Install dependencies.
2. Run the production build.
3. Run `pnpm run package:portable`.
4. Distribute the ZIP from `release/`.

Do not include `node_modules`, Git metadata, build caches, logs, credentials, or local `config.json` in release archives.

## Publication Warning

Before publishing this repository, audit current files and Git history. Earlier personal branches or commits may contain hostnames, local filesystem paths, public URLs, or deployment-only details that should not be present in a public repository history.
