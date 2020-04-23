const { app, BrowserWindow, Menu } = require('electron');

function createWindow () {
  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true
    },
    minWidth: 640,
    minHeight: 480,
    backgroundColor: "#202020"
  });
  win.loadFile('index.html');
  Menu.setApplicationMenu(require('./js/Menu.js')(win));
}

app.whenReady().then(createWindow);
