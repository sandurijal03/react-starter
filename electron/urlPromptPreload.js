const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("urlPrompt", {
  submit: (url) => {
    ipcRenderer.send("url-prompt-submit", url);
  },
  cancel: () => {
    ipcRenderer.send("url-prompt-cancel");
  },
  onInit: (callback) => {
    const listener = (_event, initialUrl) => callback(initialUrl || "");
    ipcRenderer.on("url-prompt-init", listener);
    return () => {
      ipcRenderer.removeListener("url-prompt-init", listener);
    };
  },
});
