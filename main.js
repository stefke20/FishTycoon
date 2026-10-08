// Optional desktop wrapper: `npm install && npm start`
const { app, BrowserWindow } = require('electron');
function create() {
  const w = new BrowserWindow({ width: 1280, height: 820, title: 'Fish Tycoon', autoHideMenuBar: true, icon: require('path').join(__dirname, 'build', 'icon.png') });
  w.loadFile('index.html');
}
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
