'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  CalendarClock,
  Check,
  ChevronRight,
  Download,
  FileText,
  Gauge,
  HardDrive,
  Info,
  Layers,
  ListFilter,
  Lock,
  MoreHorizontal,
  Network,
  Palette,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Rss,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Wifi,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

type TorrentState =
  | 'downloading'
  | 'seeding'
  | 'stopped'
  | 'stalled'
  | 'queued'
  | 'checking'
  | 'metadata'
  | 'allocating'
  | 'moving'
  | 'missing'
  | 'error'
  | 'unknown';

type Torrent = {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  progress: number;
  state: TorrentState;
  rawState: string;
  speed: string;
  speedBytes: number;
  downloadSpeed: number;
  uploadSpeed: number;
  eta: string;
  ratio: string;
  peers: string;
  seeds: string;
  category: string;
  tags: string;
  savePath: string;
  force: boolean;
  addedOn: number;
  amountLeft: string;
};

type TransferStats = {
  down: number;
  up: number;
  totalDown: number;
  totalUp: number;
  freeSpace: number;
};

type Diagnostic = {
  id: string;
  key: string;
  kind: 'state' | 'event' | 'problem';
  area: string;
  message: string;
  detail: string;
  timestamp: number;
  resolved: boolean;
  torrentId?: string;
};

type Appearance = 'system' | 'light' | 'dark';
type Accent = 'orange' | 'blue' | 'cyan' | 'green' | 'purple' | 'pink' | 'red' | 'amber';
type View = 'dashboard' | 'torrents' | 'rss' | 'advanced';
type SortMode = 'name' | 'activity' | 'progress' | 'size';

type RssArticle = {
  id: string;
  title: string;
  date: string;
  description: string;
  torrentURL: string;
  link: string;
  size: number;
  isRead: boolean;
};

type RssFeed = {
  name: string;
  path: string;
  url: string;
  articles: RssArticle[];
  hasError: boolean;
};

type TorrentFile = {
  index?: number;
  name: string;
  size: number;
  progress?: number;
  priority?: number;
};

type TorrentTracker = {
  url?: string;
  msg?: string;
  status?: string | number;
};

type QbitTorrentRow = Record<string, unknown> & {
  hash: string;
  name: string;
  state?: string;
};

type QbitTransferInfo = Record<string, number | undefined>;

type CategoryMap = Record<string, { name: string; savePath: string }>;
type PreferenceValue = string | number | boolean;
type PreferenceMap = Record<string, PreferenceValue>;

type PreferenceField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean';
  hint?: string;
};

type PreferenceGroup = {
  id: string;
  title: string;
  icon: typeof Gauge;
  description: string;
  fields: PreferenceField[];
};

const COOKIE_DAYS = 365;
const DEFAULT_SERVER = '/qbit';
const DEFAULT_USER = 'admin';

const accents: { id: Accent; label: string }[] = [
  { id: 'orange', label: 'Orange' },
  { id: 'blue', label: 'Blue' },
  { id: 'cyan', label: 'Cyan' },
  { id: 'green', label: 'Green' },
  { id: 'purple', label: 'Purple' },
  { id: 'pink', label: 'Pink' },
  { id: 'red', label: 'Red' },
  { id: 'amber', label: 'Amber' },
];

const stateNames: Record<TorrentState | 'complete', string> = {
  downloading: 'Downloading',
  seeding: 'Seeding',
  stopped: 'Stopped',
  stalled: 'Stalled',
  queued: 'Queued',
  checking: 'Checking',
  metadata: 'Fetching metadata',
  allocating: 'Allocating',
  moving: 'Moving',
  missing: 'Missing files',
  error: 'Error',
  unknown: 'Unknown',
  complete: 'Completed',
};

const secretPreferenceKeys = new Set([
  'web_ui_password',
  'proxy_password',
  'mail_notification_password',
  'dyndns_password',
  'rss_rules',
  'ssl_key',
  'ssl_cert',
  'api_key',
]);

const preferenceGroups: PreferenceGroup[] = [
  {
    id: 'downloads',
    title: 'Downloads',
    icon: HardDrive,
    description: 'Save paths, temporary downloads, disk behavior, and automatic torrent management.',
    fields: [
      { key: 'save_path', label: 'Default save path', type: 'text' },
      { key: 'temp_path_enabled', label: 'Use temporary path', type: 'boolean' },
      { key: 'temp_path', label: 'Temporary path', type: 'text' },
      { key: 'preallocate_all', label: 'Pre-allocate files', type: 'boolean' },
      { key: 'incomplete_files_ext', label: 'Append .!qB extension', type: 'boolean' },
      { key: 'auto_tmm_enabled', label: 'Automatic torrent management', type: 'boolean' },
      { key: 'torrent_changed_tmm_enabled', label: 'Relocate when torrent category changes', type: 'boolean' },
      { key: 'save_path_changed_tmm_enabled', label: 'Relocate when save path changes', type: 'boolean' },
      { key: 'category_changed_tmm_enabled', label: 'Relocate when category save path changes', type: 'boolean' },
    ],
  },
  {
    id: 'speed',
    title: 'Speed & schedule',
    icon: Gauge,
    description: 'Global limits, alternate limits, and scheduler controls.',
    fields: [
      { key: 'dl_limit', label: 'Download limit', type: 'number', hint: '0 or -1 usually means unlimited, depending on qBittorrent version.' },
      { key: 'up_limit', label: 'Upload limit', type: 'number' },
      { key: 'alt_dl_limit', label: 'Alternative download limit', type: 'number' },
      { key: 'alt_up_limit', label: 'Alternative upload limit', type: 'number' },
      { key: 'scheduler_enabled', label: 'Enable speed scheduler', type: 'boolean' },
      { key: 'schedule_from_hour', label: 'Schedule start hour', type: 'number' },
      { key: 'schedule_from_min', label: 'Schedule start minute', type: 'number' },
      { key: 'schedule_to_hour', label: 'Schedule end hour', type: 'number' },
      { key: 'schedule_to_min', label: 'Schedule end minute', type: 'number' },
      { key: 'scheduler_days', label: 'Schedule days', type: 'number' },
    ],
  },
  {
    id: 'queue',
    title: 'Queueing',
    icon: Layers,
    description: 'Active torrent limits and slow torrent rules.',
    fields: [
      { key: 'queueing_enabled', label: 'Enable torrent queueing', type: 'boolean' },
      { key: 'max_active_downloads', label: 'Max active downloads', type: 'number' },
      { key: 'max_active_uploads', label: 'Max active uploads', type: 'number' },
      { key: 'max_active_torrents', label: 'Max active torrents', type: 'number' },
      { key: 'dont_count_slow_torrents', label: 'Do not count slow torrents', type: 'boolean' },
      { key: 'slow_torrent_dl_rate_threshold', label: 'Slow download threshold', type: 'number' },
      { key: 'slow_torrent_ul_rate_threshold', label: 'Slow upload threshold', type: 'number' },
      { key: 'slow_torrent_inactive_timer', label: 'Slow torrent timer', type: 'number' },
    ],
  },
  {
    id: 'network',
    title: 'Network',
    icon: Network,
    description: 'Listening, peer discovery, encryption, and global connection limits.',
    fields: [
      { key: 'listen_port', label: 'Incoming port', type: 'number' },
      { key: 'upnp', label: 'Use UPnP / NAT-PMP', type: 'boolean' },
      { key: 'random_port', label: 'Use random port on startup', type: 'boolean' },
      { key: 'dht', label: 'DHT', type: 'boolean' },
      { key: 'pex', label: 'Peer exchange', type: 'boolean' },
      { key: 'lsd', label: 'Local peer discovery', type: 'boolean' },
      { key: 'anonymous_mode', label: 'Anonymous mode', type: 'boolean' },
      { key: 'encryption', label: 'Encryption mode', type: 'number' },
      { key: 'max_connec', label: 'Global max connections', type: 'number' },
      { key: 'max_connec_per_torrent', label: 'Max connections per torrent', type: 'number' },
      { key: 'max_uploads', label: 'Global upload slots', type: 'number' },
      { key: 'max_uploads_per_torrent', label: 'Upload slots per torrent', type: 'number' },
    ],
  },
  {
    id: 'rss',
    title: 'RSS & automation',
    icon: Rss,
    description: 'qBittorrent RSS refresh and automatic download engine.',
    fields: [
      { key: 'rss_processing_enabled', label: 'Enable RSS', type: 'boolean' },
      { key: 'rss_auto_downloading_enabled', label: 'Enable RSS auto-downloads', type: 'boolean' },
      { key: 'rss_refresh_interval', label: 'RSS refresh interval', type: 'number' },
      { key: 'rss_max_articles_per_feed', label: 'Max articles per feed', type: 'number' },
    ],
  },
  {
    id: 'webui',
    title: 'Web UI safety',
    icon: Shield,
    description: 'Read and adjust non-secret qBittorrent WebUI/session settings.',
    fields: [
      { key: 'web_ui_port', label: 'qBittorrent WebUI port', type: 'number' },
      { key: 'web_ui_username', label: 'WebUI username', type: 'text' },
      { key: 'web_ui_session_timeout', label: 'Session timeout', type: 'number' },
      { key: 'bypass_local_auth', label: 'Bypass auth for localhost', type: 'boolean' },
      { key: 'bypass_auth_subnet_whitelist_enabled', label: 'Bypass auth whitelist enabled', type: 'boolean' },
      { key: 'web_ui_csrf_protection_enabled', label: 'CSRF protection', type: 'boolean' },
      { key: 'web_ui_clickjacking_protection_enabled', label: 'Clickjacking protection', type: 'boolean' },
      { key: 'web_ui_secure_cookie_enabled', label: 'Secure cookie', type: 'boolean' },
    ],
  },
];

function formatSpeed(value: number) {
  if (!Number.isFinite(value) || value < 1) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const index = Math.min(3, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}

function formatSize(value: number) {
  if (!Number.isFinite(value) || value < 1) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(4, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}

function formatEta(value: number) {
  if (!Number.isFinite(value) || value >= 8640000) return '∞';
  if (value < 60) return `${value}s`;
  if (value < 3600) return `${Math.ceil(value / 60)}m`;
  return `${Math.ceil(value / 3600)}h`;
}

function mapState(raw: string): TorrentState {
  switch (raw) {
    case 'downloading':
    case 'forcedDL':
      return 'downloading';
    case 'uploading':
    case 'forcedUP':
      return 'seeding';
    case 'pausedDL':
    case 'pausedUP':
    case 'stoppedDL':
    case 'stoppedUP':
      return 'stopped';
    case 'stalledDL':
    case 'stalledUP':
      return 'stalled';
    case 'queuedDL':
    case 'queuedUP':
      return 'queued';
    case 'checkingDL':
    case 'checkingUP':
    case 'checkingResumeData':
      return 'checking';
    case 'metaDL':
      return 'metadata';
    case 'allocating':
      return 'allocating';
    case 'moving':
      return 'moving';
    case 'missingFiles':
      return 'missing';
    case 'error':
      return 'error';
    default:
      return 'unknown';
  }
}

function rssAge(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value || 'Unknown date';
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 172800) return 'Yesterday';
  return new Date(time).toLocaleDateString();
}

function toText(value: unknown, fallback = '') {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return '';
  return document.cookie
    .split('; ')
    .find(part => part.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=') ?? '';
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_DAYS * 24 * 60 * 60}; Path=/; SameSite=Lax`;
}

function flattenRss(tree: unknown, prefix = ''): RssFeed[] {
  if (!tree || typeof tree !== 'object') return [];

  return Object.entries(tree as Record<string, unknown>).flatMap(([name, value]) => {
    const path = prefix ? `${prefix}\\${name}` : name;

    if (typeof value === 'string') {
      return [{ name, path, url: value, articles: [], hasError: false }];
    }

    if (value && typeof value === 'object') {
      const node = value as Record<string, unknown>;
      const rawArticles = Array.isArray(node.articles)
        ? node.articles
        : Object.values((node.articles as Record<string, unknown>) ?? {});

      if (Array.isArray(rawArticles) || node.url || node.uid) {
        return [
          {
            name,
            path,
            url: toText(node.url ?? node.uid),
            hasError: Boolean(node.hasError),
            articles: rawArticles.map((article, index) => {
              const item = (article ?? {}) as Record<string, unknown>;
              return {
                id: toText(item.id ?? item.guid, String(index)),
                title: toText(item.title, 'Untitled item'),
                date: toText(item.date ?? item.pubDate),
                description: toText(item.description),
                torrentURL: toText(item.torrentURL ?? item.torrentUrl ?? item.link),
                link: toText(item.link),
                size: Number(item.size) || 0,
                isRead: Boolean(item.isRead),
              };
            }),
          },
        ];
      }

      return flattenRss(value, path);
    }

    return [];
  });
}

function sanitizePreferences(input: Record<string, unknown>): PreferenceMap {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => !secretPreferenceKeys.has(key))
      .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)),
  ) as PreferenceMap;
}

function preferenceKeySet() {
  return new Set(preferenceGroups.flatMap(group => group.fields.map(field => field.key)));
}

function StatPill({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="stat-pill">
      <Icon />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ConnectionScreen({
  server,
  username,
  password,
  status,
  error,
  onServer,
  onUsername,
  onPassword,
  onSubmit,
}: {
  server: string;
  username: string;
  password: string;
  status: 'checking' | 'disconnected' | 'connected';
  error: string;
  onServer: (value: string) => void;
  onUsername: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: (event: { preventDefault: () => void }) => void;
}) {
  return (
    <main className="connection-screen">
      <form className="connection-card" onSubmit={onSubmit}>
        <div className="brand-lockup">
          <div className="brand-mark">
            <ArrowDown />
          </div>
          <div>
            <h1>qBit Mobile</h1>
            <p>Connect to qBittorrent to load the live dashboard.</p>
          </div>
        </div>

        {error && <p className="connection-error">{error}</p>}

        <label>
          Server address
          <input value={server} onChange={event => onServer(event.target.value)} placeholder="/qbit" />
        </label>

        <label>
          qBittorrent username
          <input value={username} onChange={event => onUsername(event.target.value)} autoComplete="username" />
        </label>

        <label>
          qBittorrent password
          <input
            value={password}
            onChange={event => onPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Stored only in memory"
          />
        </label>

        <button className="primary wide" disabled={status === 'checking'} type="submit">
          <Lock />
          {status === 'checking' ? 'Checking…' : 'Connect'}
        </button>

        <small>Only the address and username are remembered on this device. Passwords are never persisted.</small>
      </form>
    </main>
  );
}

function Topbar({
  view,
  setView,
  status,
  version,
  problemCount,
  onAdd,
  onSettings,
}: {
  view: View;
  setView: (view: View) => void;
  status: 'checking' | 'disconnected' | 'connected';
  version: string;
  problemCount: number;
  onAdd: () => void;
  onSettings: () => void;
}) {
  const nav: { id: View; label: string; icon: typeof Activity }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'torrents', label: 'Torrents', icon: Download },
    { id: 'rss', label: 'RSS', icon: Rss },
    { id: 'advanced', label: 'Advanced', icon: Wrench },
  ];

  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark">
          <ArrowDown />
        </div>
        <div>
          <strong>qBit Mobile</strong>
          <span>{status === 'connected' ? `Live server${version ? ` · ${version}` : ''}` : 'Waiting for connection'}</span>
        </div>
      </div>

      <nav className="app-tabs" aria-label="Primary">
        {nav.map(item => (
          <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}>
            <item.icon />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="top-actions">
        <span className={`connection ${status}`}>
          <i />
          {status === 'connected' ? 'Connected' : status === 'checking' ? 'Checking' : 'Offline'}
        </span>
        <button className="icon-button add-top" onClick={onAdd} aria-label="Add torrent">
          <Plus />
        </button>
        <button className="icon-button settings-button" onClick={onSettings} aria-label="Settings and logs">
          <Settings />
          {problemCount > 0 && <b>{problemCount}</b>}
        </button>
      </div>
    </header>
  );
}

function Hero({
  stats,
  torrents,
  sparkPoints,
}: {
  stats: TransferStats;
  torrents: Torrent[];
  sparkPoints: string;
}) {
  const activeDownloads = torrents.filter(torrent => torrent.downloadSpeed > 0 || torrent.state === 'downloading').length;
  const stalled = torrents.filter(torrent => torrent.state === 'stalled').length;
  const completed = torrents.filter(torrent => torrent.progress >= 100).length;

  return (
    <section className="hero-strip">
      <div className="stat-primary">
        <p className="eyebrow">Download speed</p>
        <strong>{formatSpeed(stats.down)}</strong>
        <span>
          <ArrowDown />
          {activeDownloads} active downloads
        </span>
      </div>

      <div className="mini-stats">
        <StatPill icon={Upload} label="Upload" value={formatSpeed(stats.up)} />
        <StatPill icon={HardDrive} label="Free disk" value={formatSize(stats.freeSpace)} />
        <StatPill icon={Check} label="Complete" value={`${completed}`} />
        <StatPill icon={AlertTriangle} label="Stalled" value={`${stalled}`} />
      </div>

      <svg className="spark" viewBox="0 0 460 110" aria-hidden>
        <polyline points={sparkPoints} />
      </svg>
    </section>
  );
}

function TorrentCard({
  torrent,
  selected,
  onSelect,
  onToggle,
}: {
  torrent: Torrent;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const completed = torrent.progress >= 100;

  return (
    <article className={`torrent-card ${selected ? 'selected' : ''}`}>
      <button
        className={`round-control ${torrent.state}`}
        onClick={event => {
          event.stopPropagation();
          onToggle();
        }}
        aria-label={`${torrent.state === 'downloading' ? 'Pause' : 'Start'} ${torrent.name}`}
      >
        {torrent.state === 'downloading' ? <Pause /> : <Play />}
      </button>

      <button className="torrent-main" onClick={onSelect} type="button" aria-label={`Open details for ${torrent.name}`}>
        <div className="torrent-title">
          <strong>{torrent.name}</strong>
          <span aria-hidden="true">
            <MoreHorizontal />
          </span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${torrent.progress}%` }} />
        </div>
        <div className="torrent-meta">
          <span className={`state ${completed ? 'complete' : torrent.state}`}>
            {completed ? stateNames.complete : stateNames[torrent.state]}
          </span>
          <span>
            {torrent.progress}% of {torrent.size}
          </span>
          <span className="eta">{torrent.eta}</span>
          <span className="speed">{torrent.speed}</span>
        </div>
      </button>

      <ChevronRight className="chevron" />
    </article>
  );
}

function TorrentDetail({
  torrent,
  files,
  trackers,
  loading,
  categories,
  tags,
  onClose,
  onAction,
  onDelete,
  onRename,
  onMove,
  onCategory,
  onTags,
  onFilePriority,
}: {
  torrent: Torrent | null;
  files: TorrentFile[];
  trackers: TorrentTracker[];
  loading: boolean;
  categories: CategoryMap;
  tags: string[];
  onClose: () => void;
  onAction: (action: string, value?: boolean) => void;
  onDelete: () => void;
  onRename: () => void;
  onMove: () => void;
  onCategory: () => void;
  onTags: () => void;
  onFilePriority: (fileId: number, priority: number) => void;
}) {
  const [openFull, setOpenFull] = useState(false);

  if (!torrent) {
    return (
      <aside className="detail empty">
        <div>
          <Sparkles />
          <h2>Select a torrent</h2>
          <p>Open a torrent to manage files, trackers, limits, force start, sequential download, categories, tags, and location.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="detail open">
      <div className="detail-head">
        <div>
          <p className="eyebrow">Torrent</p>
          <h2>{torrent.name}</h2>
        </div>
        <button onClick={onClose} aria-label="Close torrent details">
          <X />
        </button>
      </div>

      <div className="ring" style={{ '--p': `${torrent.progress}%` } as CSSProperties}>
        <div>
          <strong>{torrent.progress}%</strong>
          <span>{torrent.amountLeft} left</span>
        </div>
      </div>

      <div className="detail-actions">
        <button onClick={() => onAction(torrent.state === 'downloading' ? 'stop' : 'start')}>
          {torrent.state === 'downloading' ? <Pause /> : <Play />}
          {torrent.state === 'downloading' ? 'Pause' : 'Start'}
        </button>
        <button className={torrent.force ? 'active' : ''} onClick={() => onAction('force', !torrent.force)}>
          <Zap />
          Force
        </button>
        <button onClick={() => onAction('recheck')}>
          <RotateCcw />
          Recheck
        </button>
        <button onClick={() => onAction('reannounce')}>
          <Wifi />
          Announce
        </button>
        <button onClick={() => onAction('sequential')}>
          <ListFilter />
          Sequential
        </button>
        <button onClick={() => onAction('firstLast')}>
          <FileText />
          First/last
        </button>
        <button onClick={() => onAction('superSeed', true)}>
          <Upload />
          Super seed
        </button>
        <button onClick={onRename}>
          <Info />
          Rename
        </button>
        <button onClick={onMove}>
          <HardDrive />
          Move
        </button>
        <button onClick={onCategory}>
          <Layers />
          Category
        </button>
        <button onClick={onTags}>
          <Tag />
          Tags
        </button>
        <button className="danger" onClick={onDelete}>
          <Trash2 />
          Delete
        </button>
      </div>

      <dl>
        <div>
          <dt>Status</dt>
          <dd>{stateNames[torrent.state]}</dd>
        </div>
        <div>
          <dt>Download / upload</dt>
          <dd>
            {formatSpeed(torrent.downloadSpeed)} / {formatSpeed(torrent.uploadSpeed)}
          </dd>
        </div>
        <div>
          <dt>Peers / seeds</dt>
          <dd>
            {torrent.peers} / {torrent.seeds}
          </dd>
        </div>
        <div>
          <dt>Ratio</dt>
          <dd>{torrent.ratio}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{torrent.category}</dd>
        </div>
        <div>
          <dt>Tags</dt>
          <dd>{torrent.tags || 'None'}</dd>
        </div>
        <div>
          <dt>Save path</dt>
          <dd title={torrent.savePath}>{torrent.savePath || 'Default'}</dd>
        </div>
      </dl>

      <button className={`full-details ${openFull ? 'active' : ''}`} onClick={() => setOpenFull(value => !value)}>
        Files and trackers
        <ChevronRight />
      </button>

      {openFull && (
        <div className="torrent-details">
          {loading ? (
            <p>Loading torrent details…</p>
          ) : (
            <>
              <section>
                <h3>
                  Files <span>{files.length}</span>
                </h3>
                {files.slice(0, 40).map((file, index) => (
                  <div className="file-row" key={`${file.name}-${index}`}>
                    <div>
                      <span>{file.name}</span>
                      <b>
                        {formatSize(file.size)} · {Math.round((file.progress ?? 0) * 100)}%
                      </b>
                    </div>
                    <select
                      value={file.priority ?? 1}
                      onChange={event => onFilePriority(Number(file.index ?? index), Number(event.target.value))}
                    >
                      <option value={0}>Skip</option>
                      <option value={1}>Normal</option>
                      <option value={6}>High</option>
                      <option value={7}>Max</option>
                    </select>
                  </div>
                ))}
              </section>

              <section>
                <h3>
                  Trackers <span>{trackers.length}</span>
                </h3>
                {trackers.slice(0, 20).map((tracker, index) => (
                  <div className="detail-row" key={`${tracker.url}-${index}`}>
                    <span>{tracker.url || tracker.msg || 'Tracker'}</span>
                    <b>{tracker.status ?? 'unknown'}</b>
                  </div>
                ))}
              </section>

              <section>
                <h3>
                  Known categories <span>{Object.keys(categories).length}</span>
                </h3>
                <p>{Object.keys(categories).join(', ') || 'No categories configured.'}</p>
              </section>

              <section>
                <h3>
                  Known tags <span>{tags.length}</span>
                </h3>
                <p>{tags.join(', ') || 'No tags configured.'}</p>
              </section>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

function DashboardView({
  torrents,
  stats,
  diagnostics,
  onViewTorrents,
  onViewAdvanced,
}: {
  torrents: Torrent[];
  stats: TransferStats;
  diagnostics: Diagnostic[];
  onViewTorrents: () => void;
  onViewAdvanced: () => void;
}) {
  const groups = {
    downloading: torrents.filter(torrent => torrent.state === 'downloading').length,
    seeding: torrents.filter(torrent => torrent.state === 'seeding').length,
    stalled: torrents.filter(torrent => torrent.state === 'stalled').length,
    stopped: torrents.filter(torrent => torrent.state === 'stopped').length,
  };
  const recent = [...torrents].sort((a, b) => b.addedOn - a.addedOn).slice(0, 5);
  const activeProblems = diagnostics.filter(item => item.kind === 'problem' && !item.resolved);

  return (
    <section className="dashboard-grid">
      <article className="dashboard-card highlight">
        <p className="eyebrow">System overview</p>
        <h1>{torrents.length} torrents tracked</h1>
        <p>Live qBittorrent data with direct API controls. No demo data, no separate account, and no saved password.</p>
        <div className="quick-actions">
          <button className="primary" onClick={onViewTorrents}>
            <Download />
            Manage queue
          </button>
          <button onClick={onViewAdvanced}>
            <Wrench />
            Advanced options
          </button>
        </div>
      </article>

      <article className="dashboard-card">
        <p className="eyebrow">Queue state</p>
        <div className="state-grid">
          {Object.entries(groups).map(([key, value]) => (
            <div key={key}>
              <span>{stateNames[key as TorrentState]}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="dashboard-card">
        <p className="eyebrow">Transfer totals</p>
        <dl>
          <div>
            <dt>Downloaded this session</dt>
            <dd>{formatSize(stats.totalDown)}</dd>
          </div>
          <div>
            <dt>Uploaded this session</dt>
            <dd>{formatSize(stats.totalUp)}</dd>
          </div>
          <div>
            <dt>Free space</dt>
            <dd>{formatSize(stats.freeSpace)}</dd>
          </div>
        </dl>
      </article>

      <article className="dashboard-card">
        <p className="eyebrow">Recent torrents</p>
        <div className="compact-list">
          {recent.length === 0 && <p>No torrents loaded yet.</p>}
          {recent.map(torrent => (
            <div key={torrent.id}>
              <span>{torrent.name}</span>
              <b>{torrent.progress}%</b>
            </div>
          ))}
        </div>
      </article>

      <article className={`dashboard-card ${activeProblems.length ? 'warning' : ''}`}>
        <p className="eyebrow">Logs & problems</p>
        <h2>{activeProblems.length ? `${activeProblems.length} active issue${activeProblems.length === 1 ? '' : 's'}` : 'No active issues'}</h2>
        <p>
          {activeProblems.length
            ? activeProblems[0].message
            : 'Connection, RSS, and torrent-state diagnostics are quiet.'}
        </p>
      </article>
    </section>
  );
}

function TorrentQueueView({
  torrents,
  visible,
  selected,
  filter,
  sortMode,
  query,
  onFilter,
  onSort,
  onQuery,
  onSelect,
  onToggle,
  onAdd,
  count,
}: {
  torrents: Torrent[];
  visible: Torrent[];
  selected: Torrent | null;
  filter: string;
  sortMode: SortMode;
  query: string;
  onFilter: (value: string) => void;
  onSort: (value: SortMode) => void;
  onQuery: (value: string) => void;
  onSelect: (torrent: Torrent) => void;
  onToggle: (torrent: Torrent) => void;
  onAdd: () => void;
  count: (state: string) => number;
}) {
  const filters = ['all', 'downloading', 'seeding', 'stalled', 'queued', 'stopped', 'complete'];

  return (
    <main className="content">
      <div className="content-head">
        <div>
          <p className="eyebrow">Queue</p>
          <h1>All torrents</h1>
        </div>
        <button className="primary" onClick={onAdd}>
          <Plus />
          Add torrent
        </button>
      </div>

      <div className="filter-row">
        {filters.map(item => (
          <button key={item} className={filter === item ? 'active' : ''} onClick={() => onFilter(item)}>
            {item === 'all' ? 'All' : item === 'complete' ? 'Complete' : stateNames[item as TorrentState]}
            <b>{count(item)}</b>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <label className="search">
          <Search />
          <input value={query} onChange={event => onQuery(event.target.value)} placeholder="Search torrents" />
        </label>
        <select className="sort" value={sortMode} onChange={event => onSort(event.target.value as SortMode)}>
          <option value="name">Name</option>
          <option value="activity">Activity</option>
          <option value="progress">Progress</option>
          <option value="size">Size</option>
        </select>
      </div>

      <div className="torrent-list">
        {torrents.length === 0 && <p className="empty-state">No torrents are currently reported by qBittorrent.</p>}
        {torrents.length > 0 && visible.length === 0 && <p className="empty-state">Nothing matches this filter.</p>}
        {visible.map(torrent => (
          <TorrentCard
            key={torrent.id}
            torrent={torrent}
            selected={selected?.id === torrent.id}
            onSelect={() => onSelect(torrent)}
            onToggle={() => onToggle(torrent)}
          />
        ))}
      </div>
    </main>
  );
}

function RssPage({
  feeds,
  loading,
  error,
  selected,
  onSelect,
  onAdd,
  onRefresh,
  onDownload,
  onMarkFeedRead,
}: {
  feeds: RssFeed[];
  loading: boolean;
  error: string;
  selected: string;
  onSelect: (path: string) => void;
  onAdd: () => void;
  onRefresh: () => void;
  onDownload: (item: RssArticle & { feed: string; feedPath: string }) => void;
  onMarkFeedRead: () => void;
}) {
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');
  const all = feeds
    .flatMap(feed => feed.articles.map(article => ({ ...article, feed: feed.name, feedPath: feed.path })))
    .sort((a, b) =>
      order === 'newest'
        ? (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
        : (Date.parse(a.date) || 0) - (Date.parse(b.date) || 0),
    );
  const unreadItems = all.filter(item => !item.isRead);
  const unread = unreadItems.length;
  const shown =
    selected === 'all' ? all : selected === 'unread' ? unreadItems : all.filter(item => item.feedPath === selected);

  return (
    <main className="content full-content">
      <div className="content-head">
        <div>
          <p className="eyebrow">Subscriptions</p>
          <h1>RSS feeds</h1>
        </div>
        <button className="primary" onClick={onAdd}>
          <Plus />
          Add feed
        </button>
      </div>

      <div className="rss-summary">
        <div>
          <Rss />
          <span>
            <b>
              {feeds.length} {feeds.length === 1 ? 'feed' : 'feeds'}
            </b>
            <small>
              {unread} unread {unread === 1 ? 'item' : 'items'}
            </small>
          </span>
        </div>
        <div className="rss-summary-actions">
          <button onClick={onMarkFeedRead} disabled={loading || selected === 'all'}>
            <Check />
            Mark read
          </button>
          <button onClick={onRefresh} disabled={loading}>
            <RefreshCw />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="rss-layout">
        <aside className="feed-list">
          <p className="eyebrow">Your feeds</p>
          <button className={selected === 'all' ? 'active' : ''} onClick={() => onSelect('all')}>
            <span className="feed-dot" />
            All items
            <b>{all.length}</b>
          </button>
          <button className={selected === 'unread' ? 'active' : ''} onClick={() => onSelect('unread')}>
            <span className="feed-dot unread" />
            Unread
            <b>{unread}</b>
          </button>
          {feeds.map(feed => (
            <button className={selected === feed.path ? 'active' : ''} onClick={() => onSelect(feed.path)} key={feed.path}>
              <span className="feed-dot" />
              {feed.name}
              <b>{feed.articles.filter(item => !item.isRead).length}</b>
            </button>
          ))}
        </aside>

        <section className="feed-items">
          <div className="rss-toolbar">
            <strong>{selected === 'unread' ? 'Unread items' : 'RSS items'}</strong>
            <button onClick={() => setOrder(current => (current === 'newest' ? 'oldest' : 'newest'))}>
              <CalendarClock />
              {order === 'newest' ? 'Newest first' : 'Oldest first'}
            </button>
          </div>

          {error && <p className="connection-error">{error}</p>}
          {!error && !loading && feeds.length === 0 && (
            <p className="rss-empty">No RSS feeds are configured in qBittorrent yet.</p>
          )}
          {!error && !loading && feeds.length > 0 && shown.length === 0 && (
            <p className="rss-empty">{selected === 'unread' ? 'You have no unread RSS items.' : 'This feed has no articles yet.'}</p>
          )}
          {shown.map(item => (
            <article className={`feed-item ${item.isRead ? 'read' : ''}`} key={`${item.feedPath}-${item.id}`}>
              <div className="feed-icon">
                <Rss />
              </div>
              <div>
                <span>
                  {item.feed} · {rssAge(item.date)}
                </span>
                <h2>{item.title}</h2>
                <p>
                  {item.size ? formatSize(item.size) : 'Torrent'} · {item.isRead ? 'Read' : 'Unread'}
                </p>
              </div>
              <button disabled={!item.torrentURL} onClick={() => onDownload(item)} aria-label={`Download ${item.title}`}>
                <Download />
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function AdvancedPage({
  preferences,
  draft,
  dirtyCount,
  loading,
  saving,
  error,
  onReload,
  onChange,
  onSave,
  onPreset,
}: {
  preferences: PreferenceMap;
  draft: PreferenceMap;
  dirtyCount: number;
  loading: boolean;
  saving: boolean;
  error: string;
  onReload: () => void;
  onChange: (key: string, value: PreferenceValue) => void;
  onSave: () => void;
  onPreset: (preset: 'disableQueueing' | 'unlimitedConnections') => void;
}) {
  const availableKeys = new Set(Object.keys(draft));

  return (
    <main className="content full-content">
      <div className="content-head">
        <div>
          <p className="eyebrow">Native WebUI coverage</p>
          <h1>Advanced qBittorrent options</h1>
        </div>
        <div className="advanced-head-actions">
          <button onClick={onReload} disabled={loading}>
            <RefreshCw />
            Refresh
          </button>
          <button className="primary" onClick={onSave} disabled={saving || dirtyCount === 0}>
            <Check />
            {saving ? 'Saving…' : `Save ${dirtyCount || ''}`}
          </button>
        </div>
      </div>

      <section className="advanced-intro">
        <div>
          <Shield />
          <h2>Power-user controls without storing secrets</h2>
          <p>
            These settings are read from qBittorrent’s native preferences API. Password fields, private keys, cookies,
            and credentials are deliberately hidden and never saved by qBit Mobile.
          </p>
        </div>
        <div className="preset-row">
          <button onClick={() => onPreset('disableQueueing')}>
            <Layers />
            Disable queueing
          </button>
          <button onClick={() => onPreset('unlimitedConnections')}>
            <Network />
            Unlimited connection preset
          </button>
        </div>
      </section>

      {error && <p className="connection-error">{error}</p>}

      <div className="advanced-grid">
        {preferenceGroups.map(group => {
          const fields = group.fields.filter(field => availableKeys.has(field.key));
          if (fields.length === 0) return null;
          return (
            <section className="advanced-card" key={group.id}>
              <div className="advanced-card-head">
                <group.icon />
                <div>
                  <h2>{group.title}</h2>
                  <p>{group.description}</p>
                </div>
              </div>

              <div className="pref-list">
                {fields.map(field => {
                  const value = draft[field.key];
                  const original = preferences[field.key];
                  const dirty = value !== original;
                  return (
                    <label className={`pref-row ${field.type === 'boolean' ? 'toggle' : ''} ${dirty ? 'dirty' : ''}`} key={field.key}>
                      <span>
                        <b>{field.label}</b>
                        <small>{field.hint ?? field.key}</small>
                      </span>
                      {field.type === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={event => onChange(field.key, event.target.checked)}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={String(value ?? '')}
                          onChange={event =>
                            onChange(field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)
                          }
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function SettingsModal({
  open,
  onClose,
  section,
  setSection,
  appearance,
  accent,
  server,
  username,
  diagnostics,
  version,
  onAppearance,
  onAccent,
  onServer,
  onUsername,
  onClearLogs,
  onResolveAll,
}: {
  open: boolean;
  onClose: () => void;
  section: 'appearance' | 'connection' | 'problems' | 'about';
  setSection: (section: 'appearance' | 'connection' | 'problems' | 'about') => void;
  appearance: Appearance;
  accent: Accent;
  server: string;
  username: string;
  diagnostics: Diagnostic[];
  version: string;
  onAppearance: (mode: Appearance) => void;
  onAccent: (accent: Accent) => void;
  onServer: (value: string) => void;
  onUsername: (value: string) => void;
  onClearLogs: () => void;
  onResolveAll: () => void;
}) {
  if (!open) return null;

  const activeProblems = diagnostics.filter(item => item.kind === 'problem' && !item.resolved);
  const nav = [
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'connection' as const, label: 'Connection', icon: Server },
    { id: 'problems' as const, label: 'Logs', icon: AlertTriangle, count: activeProblems.length },
    { id: 'about' as const, label: 'About', icon: Info },
  ];

  return (
    <dialog className="modal-backdrop" open>
      <div className="modal settings-modal">
        <div className="modal-title">
          <div>
            <p className="eyebrow">Settings</p>
            <h2>qBit Mobile</h2>
          </div>
          <button onClick={onClose} aria-label="Close settings">
            <X />
          </button>
        </div>

        <div className="settings-layout">
          <nav className="settings-nav">
            {nav.map(item => (
              <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>
                <item.icon />
                {item.label}
                {Boolean(item.count) && <b>{item.count}</b>}
              </button>
            ))}
          </nav>

          <section className="settings-content">
            {section === 'appearance' && (
              <>
                <h3>Appearance</h3>
                <p className="helper">Theme and accent are stored locally in this browser only.</p>
                <div className="appearance-modes">
                  {(['system', 'light', 'dark'] as Appearance[]).map(mode => (
                    <button key={mode} className={appearance === mode ? 'active' : ''} onClick={() => onAppearance(mode)}>
                      {mode}
                    </button>
                  ))}
                </div>

                <h4>Accent</h4>
                <div className="accent-grid">
                  {accents.map(item => (
                    <button
                      key={item.id}
                      data-swatch={item.id}
                      className={accent === item.id ? 'active' : ''}
                      onClick={() => onAccent(item.id)}
                    >
                      <i />
                      {item.label}
                      {accent === item.id && <Check />}
                    </button>
                  ))}
                </div>
              </>
            )}

            {section === 'connection' && (
              <>
                <h3>Connection</h3>
                <p className="helper">The server and username can be remembered. The password is never persisted.</p>
                <label>
                  Server address
                  <input value={server} onChange={event => onServer(event.target.value)} />
                </label>
                <label>
                  Username
                  <input value={username} onChange={event => onUsername(event.target.value)} />
                </label>
                <p className="cors-note">For the portable host, the normal server address is /qbit.</p>
              </>
            )}

            {section === 'problems' && (
              <>
                <div className="problems-head">
                  <div>
                    <h3>Logs & problems</h3>
                    <p className="helper">Repeated API/RSS failures and torrent-state issues collect here.</p>
                  </div>
                  <button onClick={onResolveAll}>Resolve all</button>
                </div>
                {diagnostics.length === 0 ? (
                  <div className="no-problems">
                    <Check />
                    <b>No logged issues yet.</b>
                    <span>The app will flag repeated problems here automatically.</span>
                  </div>
                ) : (
                  <div className="diagnostic-list">
                    {diagnostics.map(item => (
                      <article className={`${item.kind} ${item.resolved ? 'resolved' : ''}`} key={item.id}>
                        <div>
                          <span>{item.area}</span>
                          <time>{new Date(item.timestamp).toLocaleString()}</time>
                        </div>
                        <strong>{item.message}</strong>
                        <p>{item.detail}</p>
                      </article>
                    ))}
                  </div>
                )}
                <button className="recheck" onClick={onClearLogs}>
                  <Trash2 />
                  Clear log history
                </button>
              </>
            )}

            {section === 'about' && (
              <>
                <h3>About</h3>
                <p className="helper">
                  qBit Mobile is a mobile-first PWA that talks to qBittorrent through its normal Web API. It keeps the
                  UI installable while leaving authentication and torrent work inside qBittorrent.
                </p>
                <dl>
                  <div>
                    <dt>qBittorrent</dt>
                    <dd>{version || 'Unknown'}</dd>
                  </div>
                  <div>
                    <dt>Password storage</dt>
                    <dd>Never persisted</dd>
                  </div>
                  <div>
                    <dt>API route</dt>
                    <dd>{server || DEFAULT_SERVER}</dd>
                  </div>
                </dl>
              </>
            )}
          </section>
        </div>
      </div>
    </dialog>
  );
}

function AddTorrentModal({
  open,
  magnet,
  file,
  savePath,
  category,
  tags,
  categories,
  paused,
  sequential,
  firstLast,
  onClose,
  onMagnet,
  onFile,
  onSavePath,
  onCategory,
  onTags,
  onPaused,
  onSequential,
  onFirstLast,
  onSubmit,
}: {
  open: boolean;
  magnet: string;
  file: File | null;
  savePath: string;
  category: string;
  tags: string;
  categories: CategoryMap;
  paused: boolean;
  sequential: boolean;
  firstLast: boolean;
  onClose: () => void;
  onMagnet: (value: string) => void;
  onFile: (value: File | null) => void;
  onSavePath: (value: string) => void;
  onCategory: (value: string) => void;
  onTags: (value: string) => void;
  onPaused: (value: boolean) => void;
  onSequential: (value: boolean) => void;
  onFirstLast: (value: boolean) => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <dialog className="modal-backdrop" open>
      <div className="modal">
        <div className="modal-title">
          <div>
            <p className="eyebrow">New torrent</p>
            <h2>Add to qBittorrent</h2>
          </div>
          <button onClick={onClose} aria-label="Close add torrent">
            <X />
          </button>
        </div>

        <label>
          Magnet link or torrent URL
          <textarea value={magnet} onChange={event => onMagnet(event.target.value)} placeholder="magnet:?xt=... or https://..." />
        </label>

        <label className={`dropzone ${file ? 'selected' : ''}`}>
          <input
            type="file"
            accept=".torrent,application/x-bittorrent"
            onChange={event => onFile(event.target.files?.[0] ?? null)}
          />
          <Upload />
          <strong>{file ? file.name : 'Choose .torrent file'}</strong>
          <span>Tap here to select from this device.</span>
        </label>

        <label>
          Save path on qBittorrent PC
          <input value={savePath} onChange={event => onSavePath(event.target.value)} placeholder="Use qBittorrent default" />
        </label>

        <div className="field-row">
          <label>
            Category
            <input list="category-list" value={category} onChange={event => onCategory(event.target.value)} placeholder="Optional" />
            <datalist id="category-list">
              {Object.keys(categories).map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </datalist>
          </label>

          <label>
            Tags
            <input value={tags} onChange={event => onTags(event.target.value)} placeholder="tag1, tag2" />
          </label>
        </div>

        <div className="check-row">
          <label>
            <input type="checkbox" checked={paused} onChange={event => onPaused(event.target.checked)} />
            Add paused
          </label>
          <label>
            <input type="checkbox" checked={sequential} onChange={event => onSequential(event.target.checked)} />
            Sequential download
          </label>
          <label>
            <input type="checkbox" checked={firstLast} onChange={event => onFirstLast(event.target.checked)} />
            First/last piece priority
          </label>
        </div>

        <button className="primary wide" onClick={onSubmit}>
          <Plus />
          Add torrent
        </button>
      </div>
    </dialog>
  );
}

function RssAddModal({
  open,
  url,
  name,
  onClose,
  onUrl,
  onName,
  onSubmit,
}: {
  open: boolean;
  url: string;
  name: string;
  onClose: () => void;
  onUrl: (value: string) => void;
  onName: (value: string) => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <dialog className="modal-backdrop" open>
      <div className="modal">
        <div className="modal-title">
          <div>
            <p className="eyebrow">RSS</p>
            <h2>Add feed</h2>
          </div>
          <button onClick={onClose} aria-label="Close add feed">
            <X />
          </button>
        </div>
        <label>
          Feed URL
          <input value={url} onChange={event => onUrl(event.target.value)} placeholder="https://example.com/feed" />
        </label>
        <label>
          Display name
          <input value={name} onChange={event => onName(event.target.value)} placeholder="Optional" />
        </label>
        <button className="primary wide" onClick={onSubmit}>
          <Plus />
          Add RSS feed
        </button>
      </div>
    </dialog>
  );
}

export default function Home() {
  const [view, setView] = useState<View>('torrents');
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [selected, setSelected] = useState<Torrent | null>(null);
  const [filter, setFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState<TransferStats>({ down: 0, up: 0, totalDown: 0, totalUp: 0, freeSpace: 0 });
  const [speedHistory, setSpeedHistory] = useState<number[]>([0, 0]);
  const [detailFiles, setDetailFiles] = useState<TorrentFile[]>([]);
  const [detailTrackers, setDetailTrackers] = useState<TorrentTracker[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryMap>({});
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'checking' | 'disconnected' | 'connected'>('checking');
  const [error, setError] = useState('');
  const [server, setServer] = useState(() => decodeURIComponent(getCookie('qbit_server') || '') || DEFAULT_SERVER);
  const [username, setUsername] = useState(() => decodeURIComponent(getCookie('qbit_username') || '') || DEFAULT_USER);
  const [password, setPassword] = useState('');
  const [version, setVersion] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [magnet, setMagnet] = useState('');
  const [torrentFile, setTorrentFile] = useState<File | null>(null);
  const [savePath, setSavePath] = useState('');
  const [addCategory, setAddCategory] = useState('');
  const [addTags, setAddTags] = useState('');
  const [addPaused, setAddPaused] = useState(false);
  const [addSequential, setAddSequential] = useState(false);
  const [addFirstLast, setAddFirstLast] = useState(false);
  const [rssFeeds, setRssFeeds] = useState<RssFeed[]>([]);
  const [rssSelected, setRssSelected] = useState('all');
  const [rssLoading, setRssLoading] = useState(false);
  const [rssError, setRssError] = useState('');
  const [rssAdd, setRssAdd] = useState(false);
  const [rssUrl, setRssUrl] = useState('');
  const [rssName, setRssName] = useState('');
  const [preferences, setPreferences] = useState<PreferenceMap>({});
  const [prefDraft, setPrefDraft] = useState<PreferenceMap>({});
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'appearance' | 'connection' | 'problems' | 'about'>('appearance');
  const [appearance, setAppearance] = useState<Appearance>(() =>
    typeof window === 'undefined' ? 'system' : ((localStorage.getItem('qbit_appearance') as Appearance | null) ?? 'system'),
  );
  const [accent, setAccent] = useState<Accent>(() =>
    typeof window === 'undefined' ? 'orange' : ((localStorage.getItem('qbit_accent') as Accent | null) ?? 'orange'),
  );
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = JSON.parse(localStorage.getItem('qbit_diagnostics') || '[]') as Diagnostic[];
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });
  const failureCounts = useRef<Record<string, number>>({});
  const rechecking = useRef<Set<string>>(new Set());

  const base = useCallback((value = server) => value.replace(/\/$/, '') || DEFAULT_SERVER, [server]);

  const visible = useMemo(() => {
    return torrents
      .filter(torrent => {
        const filterMatch =
          filter === 'all' ||
          (filter === 'complete' ? torrent.progress >= 100 : torrent.state === filter);
        const searchMatch = torrent.name.toLowerCase().includes(query.toLowerCase());
        return filterMatch && searchMatch;
      })
      .sort((a, b) => {
        if (sortMode === 'name') return a.name.localeCompare(b.name);
        if (sortMode === 'progress') return b.progress - a.progress;
        if (sortMode === 'size') return b.sizeBytes - a.sizeBytes;
        return b.speedBytes - a.speedBytes;
      });
  }, [torrents, filter, query, sortMode]);

  const sparkPoints = useMemo(() => {
    const values = speedHistory.length > 1 ? speedHistory : [0, 0];
    const max = Math.max(...values, 1);
    return values.map((value, index) => `${(index / (values.length - 1)) * 460},${95 - (value / max) * 85}`).join(' ');
  }, [speedHistory]);

  const activeProblems = diagnostics.filter(item => item.kind === 'problem' && !item.resolved);
  const dirtyPrefs = useMemo(() => Object.keys(prefDraft).filter(key => prefDraft[key] !== preferences[key]), [prefDraft, preferences]);

  const saveDiagnostics = useCallback((next: Diagnostic[]) => {
    const trimmed = next.slice(0, 250);
    try {
      localStorage.setItem('qbit_diagnostics', JSON.stringify(trimmed));
    } catch {}
    return trimmed;
  }, []);

  const addDiagnostic = useCallback(
    (entry: Omit<Diagnostic, 'id' | 'timestamp' | 'resolved'>) => {
      setDiagnostics(current =>
        saveDiagnostics([
          { ...entry, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), resolved: false },
          ...current,
        ]),
      );
    },
    [saveDiagnostics],
  );

  const upsertProblem = useCallback(
    (key: string, area: string, message: string, detail: string, torrentId?: string) => {
      setDiagnostics(current => {
        if (current.some(item => item.key === key && item.kind === 'problem' && !item.resolved)) return current;
        return saveDiagnostics([
          { id: `${Date.now()}-${Math.random()}`, key, kind: 'problem', area, message, detail, timestamp: Date.now(), resolved: false, torrentId },
          ...current,
        ]);
      });
    },
    [saveDiagnostics],
  );

  const resolveProblem = useCallback(
    (key: string) => {
      setDiagnostics(current =>
        current.some(item => item.key === key && !item.resolved)
          ? saveDiagnostics(current.map(item => (item.key === key && !item.resolved ? { ...item, resolved: true } : item)))
          : current,
      );
    },
    [saveDiagnostics],
  );

  const noteFailure = useCallback(
    (key: string, area: string, message: string, detail: string, threshold = 3) => {
      failureCounts.current[key] = (failureCounts.current[key] || 0) + 1;
      if (failureCounts.current[key] >= threshold) upsertProblem(key, area, message, detail);
    },
    [upsertProblem],
  );

  const clearFailure = useCallback(
    (key: string) => {
      failureCounts.current[key] = 0;
      resolveProblem(key);
    },
    [resolveProblem],
  );

  const qbit = useCallback(
    (path: string, init?: RequestInit) => fetch(`${base()}${path}`, { credentials: 'include', ...init }),
    [base],
  );

  const formPost = useCallback(
    (path: string, params: Record<string, string | number | boolean>) =>
      qbit(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])),
      }),
    [qbit],
  );

  const applyAppearance = useCallback(
    (mode: Appearance, nextAccent: Accent = accent) => {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolved = mode === 'system' ? (dark ? 'dark' : 'light') : mode;
      document.documentElement.dataset.mode = mode;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.accent = nextAccent;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#050505' : '#f5f6f8');
    },
    [accent],
  );

  const loadPreferences = useCallback(async () => {
    setPrefLoading(true);
    setPrefError('');
    try {
      const response = await qbit('/api/v2/app/preferences');
      if (!response.ok) throw new Error(`Preferences API returned ${response.status}`);
      const safe = sanitizePreferences(await response.json());
      setPreferences(safe);
      setPrefDraft(safe);
      clearFailure('prefs:load');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not load qBittorrent preferences.';
      setPrefError(message);
      noteFailure('prefs:load', 'Advanced', 'Preferences repeatedly failed to load.', message);
    } finally {
      setPrefLoading(false);
    }
  }, [clearFailure, noteFailure, qbit]);

  const loadRss = useCallback(async () => {
    setRssLoading(true);
    setRssError('');
    try {
      const response = await qbit('/api/v2/rss/items?withData=true');
      if (!response.ok) {
        throw new Error(response.status === 403 ? 'RSS session expired. Reconnect to qBittorrent.' : 'Could not load RSS feeds from qBittorrent.');
      }
      setRssFeeds(flattenRss(await response.json()));
      clearFailure('rss:load');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not load RSS feeds from qBittorrent.';
      setRssError(message);
      noteFailure('rss:load', 'RSS', 'RSS feeds repeatedly failed to load.', message);
    } finally {
      setRssLoading(false);
    }
  }, [clearFailure, noteFailure, qbit]);

  const loadAuxiliary = useCallback(async () => {
    await Promise.allSettled([
      qbit('/api/v2/app/defaultSavePath').then(async response => {
        if (response.ok) {
          const path = (await response.text()).trim();
          if (path) setSavePath(path);
        }
      }),
      qbit('/api/v2/app/version').then(async response => {
        if (response.ok) setVersion((await response.text()).trim());
      }),
      qbit('/api/v2/torrents/categories').then(async response => {
        if (response.ok) setCategories((await response.json()) as CategoryMap);
      }),
      qbit('/api/v2/torrents/tags').then(async response => {
        if (response.ok) setTags((await response.json()) as string[]);
      }),
      loadRss(),
      loadPreferences(),
    ]);
  }, [loadPreferences, loadRss, qbit]);

  const loadData = useCallback(async () => {
    const [torrentResponse, transferResponse] = await Promise.all([
      qbit('/api/v2/torrents/info'),
      qbit('/api/v2/transfer/info'),
    ]);

    if (!torrentResponse.ok || !transferResponse.ok) {
      throw new Error(`qBittorrent API ${torrentResponse.status}/${transferResponse.status}`);
    }

    const rows = (await torrentResponse.json()) as QbitTorrentRow[];
    const transfer = (await transferResponse.json()) as QbitTransferInfo;
    const down = Number(transfer.dl_info_speed) || 0;

    const mapped = rows.map(row => {
      const downloadSpeed = Number(row.dlspeed) || 0;
      const uploadSpeed = Number(row.upspeed) || 0;
      return {
        id: row.hash,
        name: row.name,
        size: formatSize(Number(row.size) || 0),
        sizeBytes: Number(row.size) || 0,
        progress: Math.round((Number(row.progress) || 0) * 100),
        state: mapState(toText(row.state, 'unknown')),
        rawState: toText(row.state, 'unknown'),
        speed: formatSpeed(downloadSpeed || uploadSpeed),
        speedBytes: downloadSpeed || uploadSpeed,
        downloadSpeed,
        uploadSpeed,
        eta: formatEta(Number(row.eta) || 0),
        ratio: Number(row.ratio || 0).toFixed(2),
        peers: `${Number(row.num_leechs) || 0} (${Number(row.num_incomplete) || 0})`,
        seeds: `${Number(row.num_seeds) || 0} (${Number(row.num_complete) || 0})`,
        category: toText(row.category, 'Uncategorized') || 'Uncategorized',
        tags: toText(row.tags),
        savePath: toText(row.save_path),
        force: Boolean(row.force_start),
        addedOn: Number(row.added_on) || 0,
        amountLeft: formatSize(Number(row.amount_left) || 0),
      } satisfies Torrent;
    });

    mapped.forEach(torrent => {
      const key = `torrent:${torrent.id}`;
      if (torrent.state === 'missing') upsertProblem(key, 'Torrent', `${torrent.name} has missing files.`, torrent.rawState, torrent.id);
      else if (torrent.state === 'error') upsertProblem(key, 'Torrent', `${torrent.name} reports an error.`, torrent.rawState, torrent.id);
      else if (torrent.state === 'unknown') upsertProblem(key, 'Torrent', `${torrent.name} has an unsupported state.`, torrent.rawState, torrent.id);
      else if (!(torrent.state === 'checking' && rechecking.current.has(torrent.id))) {
        rechecking.current.delete(torrent.id);
        resolveProblem(key);
      }
    });

    setTorrents(mapped);
    setSelected(current => (current ? mapped.find(torrent => torrent.id === current.id) ?? null : null));
    setStats({
      down,
      up: Number(transfer.up_info_speed) || 0,
      totalDown: Number(transfer.dl_info_data) || 0,
      totalUp: Number(transfer.up_info_data) || 0,
      freeSpace: Number(transfer.free_space_on_disk) || 0,
    });
    setSpeedHistory(history => [...history, down].slice(-36));
    setStatus('connected');
    setError('');
    clearFailure('api:connection');
  }, [clearFailure, qbit, resolveProblem, upsertProblem]);

  const connectWithExistingSession = useCallback(
    async (serverValue = server) => {
      const response = await fetch(`${base(serverValue)}/api/v2/app/version`, { credentials: 'include' });
      if (!response.ok) throw new Error(`qBittorrent session not ready (${response.status})`);
      setVersion((await response.text()).trim());
      await loadData();
      await loadAuxiliary();
    },
    [base, loadAuxiliary, loadData, server],
  );

  const login = useCallback(
    async (event?: { preventDefault: () => void }) => {
      event?.preventDefault();
      setStatus('checking');
      setError('');
      try {
        const response = await fetch(`${base()}/api/v2/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ username, password }),
        });
        const text = await response.text();
        if (!response.ok || /fails/i.test(text)) throw new Error('qBittorrent rejected that username or password.');
        setCookie('qbit_server', server);
        setCookie('qbit_username', username);
        await loadData();
        await loadAuxiliary();
        setStatus('connected');
        setPassword('');
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Could not connect to qBittorrent.';
        setStatus('disconnected');
        setError(message);
        noteFailure('auth:login', 'Connection', 'Login failed repeatedly.', message, 2);
      }
    },
    [base, loadAuxiliary, loadData, noteFailure, password, server, username],
  );

  // oxlint-disable-next-line react/react-compiler
  const loadSelectedDetails = useCallback(
    async (torrent: Torrent) => {
      setDetailLoading(true);
      try {
        const params = new URLSearchParams({ hash: torrent.id });
        const root = server.replace(/\/$/, '') || DEFAULT_SERVER;
        const [filesResponse, trackersResponse] = await Promise.all([
          fetch(`${root}/api/v2/torrents/files?${params}`, { credentials: 'include' }),
          fetch(`${root}/api/v2/torrents/trackers?${params}`, { credentials: 'include' }),
        ]);
        setDetailFiles(filesResponse.ok ? ((await filesResponse.json()) as TorrentFile[]) : []);
        setDetailTrackers(trackersResponse.ok ? ((await trackersResponse.json()) as TorrentTracker[]) : []);
      } finally {
        setDetailLoading(false);
      }
    },
    [server],
  );

  const performTorrentAction = useCallback(
    async (torrent: Torrent, action: string, value?: boolean) => {
      const hashes = torrent.id;
      const run = (path: string, params: Record<string, string | number | boolean>) => formPost(path, params);
      if (action === 'start') await run('/api/v2/torrents/start', { hashes });
      if (action === 'stop') await run('/api/v2/torrents/stop', { hashes });
      if (action === 'force') await run('/api/v2/torrents/setForceStart', { hashes, value: Boolean(value) });
      if (action === 'recheck') {
        rechecking.current.add(torrent.id);
        await run('/api/v2/torrents/recheck', { hashes });
      }
      if (action === 'reannounce') await run('/api/v2/torrents/reannounce', { hashes });
      if (action === 'sequential') await run('/api/v2/torrents/toggleSequentialDownload', { hashes });
      if (action === 'firstLast') await run('/api/v2/torrents/toggleFirstLastPiecePrio', { hashes });
      if (action === 'superSeed') await run('/api/v2/torrents/setSuperSeeding', { hashes, value: Boolean(value) });
      await loadData();
      addDiagnostic({
        key: `torrent:event:${Date.now()}`,
        kind: 'event',
        area: 'Torrent',
        message: `${torrent.name}: ${action}`,
        detail: hashes,
      });
    },
    [addDiagnostic, formPost, loadData],
  );

  const deleteTorrent = useCallback(async () => {
    if (!selected) return;
    const removeFiles = window.confirm(`Delete downloaded files for "${selected.name}" too?\n\nOK = delete torrent and files\nCancel = remove torrent only`);
    const confirmed = removeFiles || window.confirm(`Remove "${selected.name}" from qBittorrent without deleting files?`);
    if (!confirmed) return;
    await formPost('/api/v2/torrents/delete', { hashes: selected.id, deleteFiles: removeFiles });
    setSelected(null);
    await loadData();
  }, [formPost, loadData, selected]);

  const renameTorrent = useCallback(async () => {
    if (!selected) return;
    const name = window.prompt('New torrent name', selected.name);
    if (!name?.trim()) return;
    await formPost('/api/v2/torrents/rename', { hash: selected.id, name: name.trim() });
    await loadData();
  }, [formPost, loadData, selected]);

  const moveTorrent = useCallback(async () => {
    if (!selected) return;
    const location = window.prompt('Move torrent data to this path on the qBittorrent PC', selected.savePath || savePath);
    if (!location?.trim()) return;
    await formPost('/api/v2/torrents/setLocation', { hashes: selected.id, location: location.trim() });
    await loadData();
  }, [formPost, loadData, savePath, selected]);

  const setTorrentCategory = useCallback(async () => {
    if (!selected) return;
    const category = window.prompt('Set category', selected.category === 'Uncategorized' ? '' : selected.category);
    if (category === null) return;
    await formPost('/api/v2/torrents/setCategory', { hashes: selected.id, category: category.trim() });
    await loadData();
  }, [formPost, loadData, selected]);

  const setTorrentTags = useCallback(async () => {
    if (!selected) return;
    const nextTags = window.prompt('Replace tags with comma-separated values', selected.tags);
    if (nextTags === null) return;
    await formPost('/api/v2/torrents/removeTags', { hashes: selected.id, tags: '' });
    if (nextTags.trim()) await formPost('/api/v2/torrents/addTags', { hashes: selected.id, tags: nextTags.trim() });
    await loadData();
  }, [formPost, loadData, selected]);

  const setFilePriority = useCallback(
    async (fileId: number, priority: number) => {
      if (!selected) return;
      await formPost('/api/v2/torrents/filePrio', { hash: selected.id, id: fileId, priority });
      await loadSelectedDetails(selected);
    },
    [formPost, loadSelectedDetails, selected],
  );

  const addTorrent = useCallback(async () => {
    if (!magnet.trim() && !torrentFile) return;
    const data = new FormData();
    if (magnet.trim()) data.append('urls', magnet.trim());
    if (torrentFile) data.append('torrents', torrentFile, torrentFile.name);
    if (savePath.trim()) data.append('savepath', savePath.trim());
    if (addCategory.trim()) data.append('category', addCategory.trim());
    if (addTags.trim()) data.append('tags', addTags.trim());
    data.append('paused', String(addPaused));
    data.append('sequentialDownload', String(addSequential));
    data.append('firstLastPiecePrio', String(addFirstLast));

    const response = await qbit('/api/v2/torrents/add', { method: 'POST', body: data });
    if (!response.ok) {
      setError(`Add torrent failed: ${response.status}`);
      return;
    }

    setAddOpen(false);
    setMagnet('');
    setTorrentFile(null);
    setAddCategory('');
    setAddTags('');
    setAddPaused(false);
    setAddSequential(false);
    setAddFirstLast(false);
    addDiagnostic({
      key: `torrent:add:${Date.now()}`,
      kind: 'event',
      area: 'Torrent',
      message: 'Torrent add request sent.',
      detail: magnet.trim() || torrentFile?.name || 'file',
    });
    setTimeout(() => {
      void loadData();
    }, 1200);
  }, [addCategory, addFirstLast, addPaused, addSequential, addTags, addDiagnostic, loadData, magnet, qbit, savePath, torrentFile]);

  const refreshRss = useCallback(async () => {
    setRssLoading(true);
    setRssError('');
    try {
      const targets = rssSelected === 'all' || rssSelected === 'unread' ? rssFeeds : rssFeeds.filter(feed => feed.path === rssSelected);
      const responses = await Promise.all(
        targets.map(feed =>
          formPost('/api/v2/rss/refreshItem', {
            itemPath: feed.path,
          }),
        ),
      );
      if (responses.some(response => !response.ok)) {
        throw new Error(`One or more feeds failed to refresh (${responses.filter(response => !response.ok).map(response => response.status).join(', ')})`);
      }
      addDiagnostic({
        key: `rss:event:${Date.now()}`,
        kind: 'event',
        area: 'RSS',
        message: 'RSS refresh completed.',
        detail: `${targets.length} feeds requested`,
      });
      clearFailure('rss:refresh');
      setTimeout(() => {
        void loadRss();
      }, 1200);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'RSS refresh failed.';
      setRssError(message);
      noteFailure('rss:refresh', 'RSS', 'RSS refresh repeatedly failed.', message, 2);
    } finally {
      setRssLoading(false);
    }
  }, [addDiagnostic, clearFailure, formPost, loadRss, noteFailure, rssFeeds, rssSelected]);

  const addRssFeed = useCallback(async () => {
    if (!rssUrl.trim()) return;
    const itemPath = rssName.trim() || rssUrl.trim();
    const response = await formPost('/api/v2/rss/addFeed', { url: rssUrl.trim(), path: itemPath });
    if (!response.ok) {
      setRssError(`Could not add RSS feed (${response.status})`);
      return;
    }
    setRssAdd(false);
    setRssUrl('');
    setRssName('');
    setTimeout(() => {
      void loadRss();
    }, 800);
  }, [formPost, loadRss, rssName, rssUrl]);

  const downloadRssItem = useCallback(
    async (item: RssArticle & { feed: string; feedPath: string }) => {
      if (!item.torrentURL) return;
      const data = new FormData();
      data.append('urls', item.torrentURL);
      if (savePath.trim()) data.append('savepath', savePath.trim());
      const response = await qbit('/api/v2/torrents/add', { method: 'POST', body: data });
      if (!response.ok) {
        setRssError(`RSS torrent add failed (${response.status})`);
        return;
      }
      await formPost('/api/v2/rss/markAsRead', { itemPath: item.feedPath, articleId: item.id }).catch(() => undefined);
      addDiagnostic({
        key: `rss:add:${Date.now()}`,
        kind: 'event',
        area: 'RSS',
        message: 'RSS torrent add request sent.',
        detail: item.title,
      });
      setTimeout(() => {
        void loadData();
        void loadRss();
      }, 1500);
    },
    [addDiagnostic, formPost, loadData, loadRss, qbit, savePath],
  );

  const markFeedRead = useCallback(async () => {
    if (rssSelected === 'all' || rssSelected === 'unread') return;
    await formPost('/api/v2/rss/markAsRead', { itemPath: rssSelected });
    setTimeout(() => {
      void loadRss();
    }, 500);
  }, [formPost, loadRss, rssSelected]);

  const savePreferences = useCallback(async () => {
    setPrefSaving(true);
    setPrefError('');
    try {
      const allowed = preferenceKeySet();
      const update = Object.fromEntries(
        dirtyPrefs
          .filter(key => allowed.has(key) && !secretPreferenceKeys.has(key))
          .map(key => [key, prefDraft[key]]),
      );
      const response = await formPost('/api/v2/app/setPreferences', { json: JSON.stringify(update) });
      if (!response.ok) throw new Error(`qBittorrent rejected preferences (${response.status})`);
      setPreferences(prefDraft);
      addDiagnostic({
        key: `prefs:save:${Date.now()}`,
        kind: 'event',
        area: 'Advanced',
        message: 'qBittorrent preferences saved.',
        detail: Object.keys(update).join(', '),
      });
      setTimeout(() => {
        void loadData();
      }, 700);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not save preferences.';
      setPrefError(message);
      noteFailure('prefs:save', 'Advanced', 'Preference save failed repeatedly.', message, 2);
    } finally {
      setPrefSaving(false);
    }
  }, [addDiagnostic, dirtyPrefs, formPost, loadData, noteFailure, prefDraft]);

  const applyAdvancedPreset = useCallback((preset: 'disableQueueing' | 'unlimitedConnections') => {
    setPrefDraft(current => {
      if (preset === 'disableQueueing') {
        return {
          ...current,
          queueing_enabled: false,
          max_active_downloads: -1,
          max_active_uploads: -1,
          max_active_torrents: -1,
        };
      }
      return {
        ...current,
        max_connec: -1,
        max_connec_per_torrent: -1,
        max_uploads: -1,
        max_uploads_per_torrent: -1,
      };
    });
  }, []);

  useEffect(() => {
    applyAppearance(appearance, accent);
    const timer = window.setTimeout(() => {
      void connectWithExistingSession(server).catch(() => setStatus('disconnected'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [accent, appearance, applyAppearance, connectWithExistingSession, server]);

  useEffect(() => {
    if (status !== 'connected') return;
    const interval = window.setInterval(() => {
      loadData().catch(caught => {
        const message = caught instanceof Error ? caught.message : 'Could not reach qBittorrent.';
        setError(message);
        setStatus('disconnected');
        noteFailure('api:connection', 'Connection', 'qBittorrent API repeatedly failed.', message, 2);
      });
    }, 5000);
    return () => window.clearInterval(interval);
  }, [loadData, noteFailure, status]);

  useEffect(() => {
    if (selected) {
      void Promise.resolve().then(() => loadSelectedDetails(selected));
    }
  }, [loadSelectedDetails, selected]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
    }
  }, []);

  const count = useCallback(
    (state: string) => {
      if (state === 'all') return torrents.length;
      if (state === 'complete') return torrents.filter(torrent => torrent.progress >= 100).length;
      return torrents.filter(torrent => torrent.state === state).length;
    },
    [torrents],
  );

  const chooseAppearance = (mode: Appearance) => {
    setAppearance(mode);
    localStorage.setItem('qbit_appearance', mode);
    applyAppearance(mode);
  };

  const chooseAccent = (next: Accent) => {
    setAccent(next);
    localStorage.setItem('qbit_accent', next);
    applyAppearance(appearance, next);
  };

  if (status !== 'connected') {
    return (
      <ConnectionScreen
        server={server}
        username={username}
        password={password}
        status={status}
        error={error}
        onServer={setServer}
        onUsername={setUsername}
        onPassword={setPassword}
        onSubmit={login}
      />
    );
  }

  return (
    <div className="app-shell">
      <Topbar
        view={view}
        setView={setView}
        status={status}
        version={version}
        problemCount={activeProblems.length}
        onAdd={() => setAddOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />

      <Hero stats={stats} torrents={torrents} sparkPoints={sparkPoints} />

      {view === 'dashboard' && (
        <main className="content full-content">
          <DashboardView
            torrents={torrents}
            stats={stats}
            diagnostics={diagnostics}
            onViewTorrents={() => setView('torrents')}
            onViewAdvanced={() => setView('advanced')}
          />
        </main>
      )}

      {view === 'torrents' && (
        <div className="workspace">
          <TorrentQueueView
            torrents={torrents}
            visible={visible}
            selected={selected}
            filter={filter}
            sortMode={sortMode}
            query={query}
            onFilter={setFilter}
            onSort={setSortMode}
            onQuery={setQuery}
            onSelect={setSelected}
            onToggle={torrent => performTorrentAction(torrent, torrent.state === 'downloading' ? 'stop' : 'start')}
            onAdd={() => setAddOpen(true)}
            count={count}
          />
          <TorrentDetail
            torrent={selected}
            files={detailFiles}
            trackers={detailTrackers}
            loading={detailLoading}
            categories={categories}
            tags={tags}
            onClose={() => setSelected(null)}
            onAction={(action, value) => selected && performTorrentAction(selected, action, value)}
            onDelete={deleteTorrent}
            onRename={renameTorrent}
            onMove={moveTorrent}
            onCategory={setTorrentCategory}
            onTags={setTorrentTags}
            onFilePriority={setFilePriority}
          />
        </div>
      )}

      {view === 'rss' && (
        <RssPage
          feeds={rssFeeds}
          loading={rssLoading}
          error={rssError}
          selected={rssSelected}
          onSelect={setRssSelected}
          onAdd={() => setRssAdd(true)}
          onRefresh={refreshRss}
          onDownload={downloadRssItem}
          onMarkFeedRead={markFeedRead}
        />
      )}

      {view === 'advanced' && (
        <AdvancedPage
          preferences={preferences}
          draft={prefDraft}
          dirtyCount={dirtyPrefs.length}
          loading={prefLoading}
          saving={prefSaving}
          error={prefError}
          onReload={loadPreferences}
          onChange={(key, value) => setPrefDraft(current => ({ ...current, [key]: value }))}
          onSave={savePreferences}
          onPreset={applyAdvancedPreset}
        />
      )}

      <nav className="mobile-nav" aria-label="Mobile">
        <button className={view === 'torrents' ? 'active' : ''} onClick={() => setView('torrents')}>
          <Download />
          Torrents
        </button>
        <button className="add-mobile" onClick={() => setAddOpen(true)} aria-label="Add torrent">
          <Plus />
        </button>
        <button className={view === 'rss' ? 'active' : ''} onClick={() => setView('rss')}>
          <Rss />
          RSS
        </button>
        <button className={view === 'advanced' ? 'active' : ''} onClick={() => setView('advanced')}>
          <Wrench />
          Advanced
        </button>
      </nav>

      <AddTorrentModal
        open={addOpen}
        magnet={magnet}
        file={torrentFile}
        savePath={savePath}
        category={addCategory}
        tags={addTags}
        categories={categories}
        paused={addPaused}
        sequential={addSequential}
        firstLast={addFirstLast}
        onClose={() => setAddOpen(false)}
        onMagnet={setMagnet}
        onFile={setTorrentFile}
        onSavePath={setSavePath}
        onCategory={setAddCategory}
        onTags={setAddTags}
        onPaused={setAddPaused}
        onSequential={setAddSequential}
        onFirstLast={setAddFirstLast}
        onSubmit={addTorrent}
      />

      <RssAddModal
        open={rssAdd}
        url={rssUrl}
        name={rssName}
        onClose={() => setRssAdd(false)}
        onUrl={setRssUrl}
        onName={setRssName}
        onSubmit={addRssFeed}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        section={settingsSection}
        setSection={setSettingsSection}
        appearance={appearance}
        accent={accent}
        server={server}
        username={username}
        diagnostics={diagnostics}
        version={version}
        onAppearance={chooseAppearance}
        onAccent={chooseAccent}
        onServer={value => {
          setServer(value);
          setCookie('qbit_server', value);
        }}
        onUsername={value => {
          setUsername(value);
          setCookie('qbit_username', value);
        }}
        onClearLogs={() => setDiagnostics(saveDiagnostics([]))}
        onResolveAll={() => setDiagnostics(current => saveDiagnostics(current.map(item => ({ ...item, resolved: true }))))}
      />
    </div>
  );
}
