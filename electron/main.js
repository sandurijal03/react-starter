const path = require("path");
const { pathToFileURL } = require("url");
const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");

function bindWindowTitleToDocument(mainWindow) {
  const applyDocumentTitle = () => {
    mainWindow.webContents
      .executeJavaScript("document.title")
      .then((title) => {
        if (typeof title === "string" && title.trim()) {
          mainWindow.setTitle(title.trim());
        }
      })
      .catch(() => {
        // Ignore title sync failures (e.g. transient navigation states).
      });
  };

  mainWindow.webContents.on("did-finish-load", applyDocumentTitle);
  mainWindow.on("page-title-updated", (event, title) => {
    event.preventDefault();
    if (typeof title === "string" && title.trim()) {
      mainWindow.setTitle(title.trim());
    }
  });
}

function openUrlPrompt(mainWindow, initialUrl) {
  return new Promise((resolve) => {
    const promptWindow = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      width: 560,
      height: 230,
      resizable: false,
      minimizable: false,
      maximizable: false,
      show: false,
      title: "Open Media URL",
      webPreferences: {
        preload: path.join(__dirname, "urlPromptPreload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    let settled = false;

    const cleanup = () => {
      ipcMain.removeListener("url-prompt-submit", onSubmit);
      ipcMain.removeListener("url-prompt-cancel", onCancel);
    };

    const settle = (value) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(value);

      if (!promptWindow.isDestroyed()) {
        promptWindow.close();
      }
    };

    const onSubmit = (event, url) => {
      if (event.sender !== promptWindow.webContents) {
        return;
      }

      const nextUrl = typeof url === "string" ? url.trim() : "";
      settle(nextUrl || null);
    };

    const onCancel = (event) => {
      if (event.sender !== promptWindow.webContents) {
        return;
      }

      settle(null);
    };

    ipcMain.on("url-prompt-submit", onSubmit);
    ipcMain.on("url-prompt-cancel", onCancel);

    promptWindow.on("closed", () => {
      settle(null);
    });

    promptWindow.webContents.once("did-finish-load", () => {
      promptWindow.webContents.send("url-prompt-init", initialUrl || "");
    });

    promptWindow.loadFile(path.join(__dirname, "urlPrompt.html"));
    promptWindow.once("ready-to-show", () => {
      promptWindow.show();
    });
  });
}

function createAppMenu(mainWindow) {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Open File...",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openFile"],
              filters: [
                {
                  name: "Media",
                  extensions: [
                    "mp4",
                    "webm",
                    "mov",
                    "m4v",
                    "ogv",
                    "m3u8",
                    "jpg",
                    "jpeg",
                    "png",
                    "webp",
                    "bmp",
                    "gif",
                  ],
                },
                { name: "All Files", extensions: ["*"] },
              ],
            });

            if (result.canceled || result.filePaths.length === 0) {
              return;
            }

            const fileUrl = pathToFileURL(result.filePaths[0]).toString();
            mainWindow.webContents.send("menu-open-file", fileUrl);
          },
        },
        {
          label: "Open Media URL...",
          accelerator: "CmdOrCtrl+L",
          click: () => {
            mainWindow.webContents.send("menu-open-url");
          },
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "View",
      submenu: [{ role: "reload" }, { role: "toggledevtools" }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  bindWindowTitleToDocument(mainWindow);

  createAppMenu(mainWindow);

  const devServerUrl = process.env.ELECTRON_START_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "build", "index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  ipcMain.handle("request-media-url", async (event, initialUrl) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (!senderWindow) {
      return null;
    }

    return openUrlPrompt(senderWindow, initialUrl);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
