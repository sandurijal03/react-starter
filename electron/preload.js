const { contextBridge, ipcRenderer } = require('electron');

// Keep preload minimal and explicit for a safer renderer boundary.
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  requestMediaUrl: (initialUrl) =>
    ipcRenderer.invoke('request-media-url', initialUrl),
  getWindowFullscreen: () => ipcRenderer.invoke('get-window-fullscreen'),
  getWindowMaximized: () => ipcRenderer.invoke('get-window-maximized'),
  onMenuOpenFile: (callback) => {
    const listener = (_event, fileUrl) => callback(fileUrl);
    ipcRenderer.on('menu-open-file', listener);
    return () => {
      ipcRenderer.removeListener('menu-open-file', listener);
    };
  },
  onMenuOpenUrl: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('menu-open-url', listener);
    return () => {
      ipcRenderer.removeListener('menu-open-url', listener);
    };
  },
  onWindowFullscreenChange: (callback) => {
    const listener = (_event, isFullscreen) => callback(Boolean(isFullscreen));
    ipcRenderer.on('window-fullscreen-change', listener);
    return () => {
      ipcRenderer.removeListener('window-fullscreen-change', listener);
    };
  },
  onWindowMaximizeChange: (callback) => {
    const listener = (_event, isMaximized) => callback(Boolean(isMaximized));
    ipcRenderer.on('window-maximize-change', listener);
    return () => {
      ipcRenderer.removeListener('window-maximize-change', listener);
    };
  },
});
