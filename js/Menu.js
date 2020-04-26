const { Menu } = require('electron');
 
module.exports = function(window, showLibs) {
  return Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: "New",
          click() {
            window.webContents.send("new");
          }
        },
        {
          label: "Save",
          click() {
            window.webContents.send("save");
          }
        },
        {
          label: "Open",
          click() {
            window.webContents.send("open");
          }
        },
        { type: 'separator' },
        {
          label: "Export",
          click() {
            window.webContents.send("export");
          }
        },
        {
          label: "Compile",
          click() {
            window.webContents.send("compile");
          }
        },
        { type: 'separator' },
        { role: 'quit' },
      ]
    },
    {
      label: "Preview",
      submenu: [
        {
          label: "Reset Camera",
          click() {
            window.webContents.send("preview-cam-reset");
          }
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'GitHub',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/LordVonAdel/P2FakeParticles');
          }
        },
        {
          label: "Used libraries",
          click: showLibs
        }
      ]
    }
  ]);
}