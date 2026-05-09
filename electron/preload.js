const { contextBridge, ipcRenderer } = require("electron");

// Keep preload minimal and explicit for a safer renderer boundary.
contextBridge.exposeInMainWorld("electronAPI", {
  isDesktop: true,
  requestMediaUrl: (initialUrl) =>
    ipcRenderer.invoke("request-media-url", initialUrl),
  onMenuOpenFile: (callback) => {
    const listener = (_event, fileUrl) => callback(fileUrl);
    ipcRenderer.on("menu-open-file", listener);
    return () => {
      ipcRenderer.removeListener("menu-open-file", listener);
    };
  },
  onMenuOpenUrl: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("menu-open-url", listener);
    return () => {
      ipcRenderer.removeListener("menu-open-url", listener);
    };
  },
});
