// bridge placeholder
const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, callback, mapArgs = (_event, ...args) => args) {
  const listener = (event, ...args) => {
    callback(...mapArgs(event, ...args));
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

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
  loadSession: (id) => ipcRenderer.invoke('load-session', id),
  openSessionsFolder: () => ipcRenderer.invoke('open-sessions-folder'),
  onKbEntry: (callback) => {
    return subscribe('kb-entry', callback);
  },
  onKbPass: (callback) => {
    return subscribe('kb-pass', callback);
  },
  onKbSl: (callback) => {
    return subscribe('kb-sl', callback);
  },
  onKbClose: (callback) => {
    return subscribe('kb-close', callback);
  },
  onWindowPositionChanged: (callback) => {
    return subscribe('window-position-changed', callback);
  },
  onUpdaterStatus: (callback) => {
    return subscribe('updater-status', callback);
  }
});
