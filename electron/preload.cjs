const { contextBridge, ipcRenderer } = require('electron');

let desktopApiUrl;
try {
  ({ API_URL: desktopApiUrl } = require('./desktop-api-url.cjs'));
} catch {
  desktopApiUrl = 'http://localhost:5000/api';
}

contextBridge.exposeInMainWorld('electronAPI', {
  getApiUrl: () => desktopApiUrl,
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  onMessage: (channel, func) => ipcRenderer.on(channel, (_event, ...args) => func(...args)),
});
