// Electron Desktop Wrapper Entry point
// Untuk menjalankan sebagai aplikasi desktop mandiri (Electron):
// 1. npm install -D electron
// 2. npx electron electron-main.cjs

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'K99 Coffee POS - ERP Kedai Kopi',
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public/icon.svg'),
  });

  // Muat server lokal atau file dist
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  mainWindow.loadURL(startUrl).catch(() => {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  });

  // Maximized by default for POS workstation
  mainWindow.maximize();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
