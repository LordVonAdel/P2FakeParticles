const { Menu } = require('electron');
 
module.exports = function(window) {
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
          label: "Export SMD"
          /**
           * @todo Implement SMD Export
           */
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
            await shell.openExternal('https://electronjs.org');
          }
        }
      ]
    }
  ]);
}