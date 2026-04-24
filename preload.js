// bridge placeholder
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  resizeWindow: (height) => ipcRenderer.invoke('resize-window', height),
  saveSession: (data) => ipcRenderer.invoke('save-session', data),
  loadLastPosition: () => ipcRenderer.invoke('load-position'),
  savePosition: (pos) => ipcRenderer.invoke('save-position', pos),
  getSessionsDir: () => ipcRenderer.invoke('get-sessions-dir'),
  getSessionIds: () => ipcRenderer.invoke('get-session-ids'),
  openSessionsFolder: () => ipcRenderer.invoke('open-sessions-folder'),
  onWindowPositionChanged: (callback) => {
    ipcRenderer.on('window-position-changed', (_event, pos) => callback(pos));
  }
});
