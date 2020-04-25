const { app, BrowserWindow, Menu } = require('electron');

app.whenReady().then(() => {
  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true
    },
    minWidth: 640,
    minHeight: 480,
    backgroundColor: "#202020",
    icon: "icon.png"
  });
  win.loadFile('index.html');
  Menu.setApplicationMenu(require('./js/Menu.js')(win, showLibs));
});

function showLibs() {
  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true
    },
    minWidth: 640,
    minHeight: 480,
    icon: "icon.png",
  });
  win.setMenu(null);
  win.loadFile('usedLibraries.html');
  win.webContents.toggleDevTools();
}

// Everything else is implemented in the renderer process