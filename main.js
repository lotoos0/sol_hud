const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const fs = require('fs');
const path = require('path');

let win;
const sessionsDir = path.join(__dirname, 'sessions');
const positionFile = path.join(sessionsDir, '_window.json');

function ensureSessionsDir() {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

function loadWindowPosition() {
  try {
    return JSON.parse(fs.readFileSync(positionFile));
  } catch {
    return { x: 10, y: 10 };
  }
}

function saveWindowPosition(pos) {
  ensureSessionsDir();
  fs.writeFileSync(positionFile, JSON.stringify(pos));
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
  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  ipcMain.handle('resize-window', (_event, h) => {
    if (win) {
      win.setSize(280, h);
    }
  });

  ipcMain.handle('save-session', (_event, data) => {
    ensureSessionsDir();
    const file = path.join(sessionsDir, `${data.session_id}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

    return { ok: true, path: file };
  });

  ipcMain.handle('load-position', () => {
    return loadWindowPosition();
  });

  ipcMain.handle('save-position', (_event, pos) => {
    saveWindowPosition(pos);

    return { ok: true };
  });

  ipcMain.handle('get-sessions-dir', () => {
    return sessionsDir;
  });

  ipcMain.handle('get-session-ids', () => {
    ensureSessionsDir();

    return fs
      .readdirSync(sessionsDir)
      .filter((file) => file.endsWith('.json') && file !== '_window.json')
      .map((file) => path.basename(file, '.json'));
  });

  ipcMain.handle('open-sessions-folder', () => {
    ensureSessionsDir();

    return shell.openPath(sessionsDir);
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

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
