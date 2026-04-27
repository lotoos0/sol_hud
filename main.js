const { app, BrowserWindow, globalShortcut, ipcMain, screen, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');
const playerStore = require('./storage/playerStore');
const questStore = require('./storage/questStore');

let win;
let updaterWin;

function getDataDir() {
  return app.isPackaged ? app.getPath('userData') : __dirname;
}

function getSessionsDir() {
  return path.join(getDataDir(), 'sessions');
}

function getPositionFile() {
  return path.join(getSessionsDir(), '_window.json');
}

function ensureSessionsDir() {
  fs.mkdirSync(getSessionsDir(), { recursive: true });
}

function createEmptyHeatmapBuckets() {
  return Array.from({ length: 24 }, (_item, hour) => ({
    hour,
    trades: 0,
    wins: 0,
    losses: 0,
    sl: 0,
    win_rate: 0
  }));
}

function isSessionDataFile(file) {
  return (
    file.endsWith('.json') &&
    file !== '_window.json' &&
    file !== 'player.json' &&
    file !== 'quests_state.json' &&
    !file.startsWith('share_')
  );
}

function loadHeatmapData() {
  ensureSessionsDir();
  const buckets = createEmptyHeatmapBuckets();

  fs.readdirSync(getSessionsDir())
    .filter(isSessionDataFile)
    .forEach((file) => {
      try {
        const sessionData = JSON.parse(fs.readFileSync(path.join(getSessionsDir(), file), 'utf8'));
        const trades = Array.isArray(sessionData.trades) ? sessionData.trades : [];
        let previousWins = 0;
        let previousLosses = 0;

        trades.forEach((trade) => {
          const tradeDate = new Date(trade.at);
          const hour = tradeDate.getHours();
          const currentWins = Number(trade.wins);
          const currentLosses = Number(trade.losses);
          const hasSnapshots = Number.isFinite(currentWins) && Number.isFinite(currentLosses);

          if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
            return;
          }

          buckets[hour].trades++;

          if (hasSnapshots && currentWins > previousWins) {
            buckets[hour].wins++;
          }

          if (hasSnapshots && currentLosses > previousLosses) {
            buckets[hour].losses++;
          }

          if (trade.type === 'SL') {
            buckets[hour].sl++;
          }

          if (hasSnapshots) {
            previousWins = currentWins;
            previousLosses = currentLosses;
          }
        });
      } catch {
        // Ignore malformed historical session files so analytics still loads.
      }
    });

  return buckets.map((bucket) => ({
    ...bucket,
    win_rate:
      bucket.wins + bucket.losses === 0
        ? 0
        : Number(((bucket.wins / (bucket.wins + bucket.losses)) * 100).toFixed(1))
  }));
}

function loadWindowPosition() {
  try {
    return JSON.parse(fs.readFileSync(getPositionFile()));
  } catch {
    return { x: 10, y: 10 };
  }
}

function saveWindowPosition(pos) {
  ensureSessionsDir();
  fs.writeFileSync(getPositionFile(), JSON.stringify(pos));
}

function createUpdaterWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  updaterWin = new BrowserWindow({
    width: 280,
    height: 90,
    x: Math.round((width - 280) / 2),
    y: Math.round((height - 90) / 2),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    icon: path.join(__dirname, 'data', 'Icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  updaterWin.loadFile('updater.html');
}

function startMainWindow() {
  if (updaterWin) {
    updaterWin.close();
    updaterWin = null;
  }

  if (!win || win.isDestroyed()) {
    createWindow();
  }
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;

  autoUpdater.on('checking-for-update', () => {
    updaterWin?.webContents.send('updater-status', { state: 'checking' });
  });

  autoUpdater.on('update-not-available', () => {
    updaterWin?.webContents.send('updater-status', { state: 'no-update' });
    setTimeout(startMainWindow, 800);
  });

  autoUpdater.on('download-progress', (progress) => {
    updaterWin?.webContents.send('updater-status', {
      state: 'downloading',
      percent: Math.round(progress.percent)
    });
  });

  autoUpdater.on('update-downloaded', () => {
    updaterWin?.webContents.send('updater-status', { state: 'restarting' });
    setTimeout(() => autoUpdater.quitAndInstall(false, true), 1500);
  });

  autoUpdater.on('error', () => {
    updaterWin?.webContents.send('updater-status', { state: 'error' });
    setTimeout(startMainWindow, 600);
  });

  autoUpdater.checkForUpdates().catch(() => {
    startMainWindow();
  });
}

function createWindow() {
  const pos = loadWindowPosition();

  win = new BrowserWindow({
    width: 280,
    height: 180,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    icon: path.join(__dirname, 'data', 'Icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.on('move', () => {
    const [x, y] = win.getPosition();
    const nextPos = { x, y };
    saveWindowPosition(nextPos);
    win.webContents.send('window-position-changed', nextPos);
  });

  win.loadFile('index.html');
  globalShortcut.unregister('Alt+E');
  globalShortcut.unregister('Alt+P');
  globalShortcut.unregister('Alt+S');
  globalShortcut.register('Alt+E', () => win.webContents.send('kb-entry'));
  globalShortcut.register('Alt+P', () => win.webContents.send('kb-pass'));
  globalShortcut.register('Alt+S', () => win.webContents.send('kb-sl'));

  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  playerStore.init(getDataDir());
  questStore.init(getDataDir());

  ipcMain.handle('resize-window', (_event, size) => {
    if (win) {
      const nextSize =
        typeof size === 'object'
          ? size
          : { height: size };
      const width = Number(nextSize.width) || 280;
      const height = Number(nextSize.height) || 180;

      win.setSize(width, height);
    }
  });

  ipcMain.handle('save-session', (_event, data) => {
    ensureSessionsDir();
    const file = path.join(getSessionsDir(), `${data.session_id}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

    return { ok: true, path: file };
  });

  ipcMain.handle('save-share-card', (_event, data) => {
    ensureSessionsDir();
    const sessionId = String(data.session_id || 'session').replace(/[^a-zA-Z0-9_-]/g, '_');
    const file = path.join(getSessionsDir(), `share_${sessionId}.png`);
    fs.writeFileSync(file, Buffer.from(data.base64, 'base64'));
    shell.openPath(file);

    return { ok: true, path: file };
  });

  ipcMain.handle('load-player', () => {
    return playerStore.loadPlayer();
  });

  ipcMain.handle('save-player', (_event, data) => {
    playerStore.savePlayer(data);

    return { ok: true };
  });

  ipcMain.handle('load-quests-state', () => {
    return questStore.loadQuestsState();
  });

  ipcMain.handle('save-quests-state', (_event, data) => {
    questStore.saveQuestsState(data);

    return { ok: true };
  });

  ipcMain.handle('load-quest-defs', () => {
    return questStore.loadQuestDefs();
  });

  ipcMain.handle('load-heatmap-data', () => {
    return loadHeatmapData();
  });

  ipcMain.handle('load-position', () => {
    return loadWindowPosition();
  });

  ipcMain.handle('save-position', (_event, pos) => {
    saveWindowPosition(pos);

    return { ok: true };
  });

  ipcMain.handle('get-sessions-dir', () => {
    return getSessionsDir();
  });

  ipcMain.handle('get-session-ids', () => {
    ensureSessionsDir();

    return fs
      .readdirSync(getSessionsDir())
      .filter(isSessionDataFile)
      .map((file) => path.basename(file, '.json'));
  });

  ipcMain.handle('open-sessions-folder', () => {
    ensureSessionsDir();

    return shell.openPath(getSessionsDir());
  });

  ipcMain.handle('get-screen-size', () => {
    return screen.getPrimaryDisplay().workAreaSize;
  });

  ipcMain.on('set-ignore-mouse', (_event, ignore) => {
    if (!win) {
      return;
    }

    if (ignore) {
      win.setIgnoreMouseEvents(true, { forward: true });
    } else {
      win.setIgnoreMouseEvents(false);
    }
  });

  if (app.isPackaged) {
    createUpdaterWindow();
    setupAutoUpdater();
  } else {
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
