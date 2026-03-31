const { app, BrowserWindow, ipcMain, dialog, nativeTheme, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { store } = require('./store');
const { logConversion, getHistory, clearHistory, getStats, close: closeDb } = require('./database');
const { getImageInfo, convertImage, getInputFileFilters, OUTPUT_FORMATS } = require('./converter');
const { setupAutoUpdater, installUpdate } = require('./updater');
const { createMenu } = require('./menu');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;

function createMainWindow() {
  const bounds = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../../resources/icon.png'),
    title: 'Image Converter',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (bounds.isMaximized) mainWindow.maximize();
  });

  const saveWindowState = () => {
    if (!mainWindow.isDestroyed()) {
      const isMaximized = mainWindow.isMaximized();
      if (!isMaximized) {
        const [width, height] = mainWindow.getSize();
        const [x, y] = mainWindow.getPosition();
        store.set('windowBounds', { width, height, x, y, isMaximized });
      } else {
        store.set('windowBounds.isMaximized', true);
      }
    }
  };
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('close', saveWindowState);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }

  createMenu(mainWindow);
  setupAutoUpdater(mainWindow);
}

// --- Store IPC ---
ipcMain.handle('store:get', (_e, key) => store.get(key));
ipcMain.handle('store:set', (_e, key, val) => {
  store.set(key, val);
  return true;
});

// --- Theme IPC ---
ipcMain.handle('theme:system', () => (nativeTheme.shouldUseDarkColors ? 'dark' : 'light'));
ipcMain.handle('theme:set', (_e, mode) => {
  if (typeof mode !== 'string') throw new Error('Invalid theme mode');
  nativeTheme.themeSource = mode;
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

// --- Image IPC ---
ipcMain.handle('images:select', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: getInputFileFilters(),
  });

  if (result.canceled || result.filePaths.length === 0) return [];

  const images = [];
  for (const filePath of result.filePaths) {
    try {
      const info = await getImageInfo(filePath);
      images.push(info);
    } catch (err) {
      console.error(`Failed to read image: ${filePath}`, err);
    }
  }
  return images;
});

ipcMain.handle('images:info', async (_e, filePath) => {
  if (typeof filePath !== 'string') throw new Error('Invalid file path');
  return getImageInfo(filePath);
});

ipcMain.handle('images:selectOutputDir', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('images:convert', async (event, files, settings) => {
  if (!Array.isArray(files) || files.length === 0) throw new Error('No files to convert');
  if (!settings || typeof settings.format !== 'string') throw new Error('Invalid settings');

  const results = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const sender = event.sender;

    try {
      // Determine output directory
      let outputDir;
      if (settings.outputLocation === 'same') {
        outputDir = path.dirname(file.path);
      } else if (settings.customOutputDir && fs.existsSync(settings.customOutputDir)) {
        outputDir = settings.customOutputDir;
      } else {
        outputDir = path.dirname(file.path);
      }

      sender.send('convert:progress', {
        current: i + 1,
        total,
        fileName: file.name,
        status: 'converting',
      });

      const result = await convertImage(file.path, outputDir, settings);

      // Log to database
      logConversion({
        originalName: file.name,
        originalFormat: file.format || file.ext,
        originalSize: file.size,
        outputName: path.basename(result.outputPath),
        outputFormat: settings.format,
        outputSize: result.outputSize,
        width: result.width,
        height: result.height,
      });

      results.push({
        success: true,
        originalName: file.name,
        outputPath: result.outputPath,
        outputSize: result.outputSize,
      });

      sender.send('convert:progress', {
        current: i + 1,
        total,
        fileName: file.name,
        status: 'done',
      });
    } catch (err) {
      console.error(`Failed to convert: ${file.name}`, err);
      results.push({
        success: false,
        originalName: file.name,
        error: err.message,
      });

      sender.send('convert:progress', {
        current: i + 1,
        total,
        fileName: file.name,
        status: 'error',
        error: err.message,
      });
    }
  }

  return results;
});

ipcMain.handle('images:openFolder', async (_e, folderPath) => {
  if (typeof folderPath !== 'string') throw new Error('Invalid path');
  shell.openPath(folderPath);
});

ipcMain.handle('images:formats', () => OUTPUT_FORMATS);

// --- History IPC ---
ipcMain.handle('history:get', () => getHistory());
ipcMain.handle('history:clear', () => {
  clearHistory();
  return true;
});
ipcMain.handle('history:stats', () => getStats());

// --- App IPC ---
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.on('update:install', () => installUpdate());

// --- App lifecycle ---
app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on('before-quit', () => {
  closeDb();
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Sync system theme changes to renderer
nativeTheme.on('updated', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('theme:changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
  }
});
