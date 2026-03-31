const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Image operations
  selectImages: () => ipcRenderer.invoke('images:select'),
  getImageInfo: (filePath) => ipcRenderer.invoke('images:info', filePath),
  selectOutputDir: () => ipcRenderer.invoke('images:selectOutputDir'),
  convertImages: (files, settings) => ipcRenderer.invoke('images:convert', files, settings),
  getOutputFormats: () => ipcRenderer.invoke('images:formats'),
  openFolder: (folderPath) => ipcRenderer.invoke('images:openFolder', folderPath),

  // Get file path from drag-and-drop (sandbox-safe)
  getPathForFile: (file) => webUtils.getPathForFile(file),

  // Conversion progress events
  onConversionProgress: (callback) => {
    ipcRenderer.on('convert:progress', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('convert:progress');
  },

  // History
  getHistory: () => ipcRenderer.invoke('history:get'),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  getHistoryStats: () => ipcRenderer.invoke('history:stats'),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('store:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('store:set', key, value),

  // Theme
  getSystemTheme: () => ipcRenderer.invoke('theme:system'),
  setTheme: (mode) => ipcRenderer.invoke('theme:set', mode),
  onThemeChanged: (callback) => {
    ipcRenderer.on('theme:changed', (_event, theme) => callback(theme));
    return () => ipcRenderer.removeAllListeners('theme:changed');
  },

  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),

  // Menu actions
  onMenuAction: (callback) => {
    ipcRenderer.on('menu:action', (_event, action) => callback(action));
    return () => ipcRenderer.removeAllListeners('menu:action');
  },

  // Updates
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update:available', (_event, info) => callback(info));
    return () => ipcRenderer.removeAllListeners('update:available');
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update:downloaded', (_event, info) => callback(info));
    return () => ipcRenderer.removeAllListeners('update:downloaded');
  },
  installUpdate: () => ipcRenderer.send('update:install'),
});
