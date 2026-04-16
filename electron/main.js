import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fork } from 'node:child_process';
import http from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let serverProcess = null;
let mainWindow = null;

const PORT = process.env.PORT || 3000;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function startServer() {
  if (app.isPackaged) {
    const serverPath = path.join(app.getAppPath(), '.output', 'server', 'index.mjs');
    console.log('Starting production server:', serverPath);
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: PORT }
    });
    
    // Wait for server to start
    let attempts = 0;
    while (attempts < 20) {
      const open = await isPortOpen(PORT);
      if (!open) break; // If it's NOT open, it means the server is now listening? 
                        // Wait, isPortOpen returns true if we CAN listen. 
                        // So if it returns false, someone else (the server) is listening.
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Task Tracker",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  if (!app.isPackaged) {
    await mainWindow.loadURL(`http://localhost:${PORT}`);
    // mainWindow.webContents.openDevTools();
  } else {
    await startServer();
    await mainWindow.loadURL(`http://localhost:${PORT}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
