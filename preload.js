// bridge placeholder
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  resizeWindow: (height, width) => ipcRenderer.invoke('resize-window', { height, width }),
  saveSession: (data) => ipcRenderer.invoke('save-session', data),
  saveShareCard: (data) => ipcRenderer.invoke('save-share-card', data),
  loadPlayer: () => ipcRenderer.invoke('load-player'),
  savePlayer: (data) => ipcRenderer.invoke('save-player', data),
  loadQuestsState: () => ipcRenderer.invoke('load-quests-state'),
  saveQuestsState: (data) => ipcRenderer.invoke('save-quests-state', data),
  loadQuestDefs: () => ipcRenderer.invoke('load-quest-defs'),
  loadHeatmapData: () => ipcRenderer.invoke('load-heatmap-data'),
  loadLastPosition: () => ipcRenderer.invoke('load-position'),
  savePosition: (pos) => ipcRenderer.invoke('save-position', pos),
  getSessionsDir: () => ipcRenderer.invoke('get-sessions-dir'),
  getSessionIds: () => ipcRenderer.invoke('get-session-ids'),
  openSessionsFolder: () => ipcRenderer.invoke('open-sessions-folder'),
  onKbEntry: (callback) => {
    ipcRenderer.on('kb-entry', callback);
  },
  onKbPass: (callback) => {
    ipcRenderer.on('kb-pass', callback);
  },
  onKbSl: (callback) => {
    ipcRenderer.on('kb-sl', callback);
  },
  onWindowPositionChanged: (callback) => {
    ipcRenderer.on('window-position-changed', (_event, pos) => callback(pos));
  },
  onUpdaterStatus: (callback) => {
    ipcRenderer.on('updater-status', (_event, data) => callback(data));
  }
});
