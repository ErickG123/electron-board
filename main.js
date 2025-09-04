const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const fs = require("fs");
const path = require("node:path");

let whiteboardWindow;
let overlayWindow = null;
let isDrawing = false;
let overlayMode = "persistente";

const createWhiteboard = () => {
    whiteboardWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });

    whiteboardWindow.loadFile("renderer/whiteboard.html");
}

const createOverlay = () => {
    overlayWindow = new BrowserWindow({
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        fullscreen: true,
        hasShadow: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: true,
            sandbox: false
        }
    });

    overlayWindow.loadFile(path.join(__dirname, "renderer/overlay.html"));

    overlayWindow.webContents.on('did-finish-load', () => {
        // overlayWindow.webContents.openDevTools({ mode: 'detach' });

        overlayWindow.setIgnoreMouseEvents(true, { forward: true });

        overlayWindow.webContents.send("drawing-mode-changed", isDrawing);
        overlayWindow.webContents.send("overlay-mode-changed", overlayMode);
    });
}

ipcMain.on("toggle-mouse-events", (event, isDrawingMode) => {
    if (!overlayWindow) return;

    if (isDrawingMode) {
        overlayWindow.setIgnoreMouseEvents(false);
        overlayWindow.setAlwaysOnTop(true);
        overlayWindow.show();
        try { overlayWindow.focus(); } catch (_) { }
    } else {
        overlayWindow.setIgnoreMouseEvents(true, { forward: true });
        overlayWindow.setAlwaysOnTop(true);
    }

    overlayWindow.webContents.send("drawing-mode-changed", isDrawingMode);
});

app.whenReady().then(() => {
    // createWhiteboard();
    createOverlay();

    globalShortcut.register("CommandOrControl+Shift+D", () => {
        isDrawing = !isDrawing;

        if (!overlayWindow) return;

        if (isDrawing) {
            overlayWindow.setIgnoreMouseEvents(false);
            overlayWindow.setAlwaysOnTop(true);
            overlayWindow.show();
            try { overlayWindow.focus(); } catch (_) { }
        } else {
            overlayWindow.setIgnoreMouseEvents(true, { forward: true });
            overlayWindow.setAlwaysOnTop(true);
        }

        overlayWindow.webContents.send("drawing-mode-changed", isDrawing);
        console.log("Global toggle drawing:", isDrawing);
    });

    globalShortcut.register("CommandOrControl+Shift+T", () => {
        overlayMode = overlayMode === "persistente" ? "temporario" : "persistente";
        if (overlayWindow) overlayWindow.webContents.send("overlay-mode-changed", overlayMode);
        console.log("Global overlay mode:", overlayMode);
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            // createWhiteboard();
            createOverlay();
        }
    });
});

ipcMain.handle('capture-screen', async () => {
    try {
        if (!desktopCapturer) throw new Error('desktopCapturer não disponível');

        const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
        if (!sources || sources.length === 0) throw new Error('Nenhuma fonte encontrada');

        let source = sources.find(s => s.name && s.name.toLowerCase().includes('screen')) || sources[0];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: source.id,
                        minWidth: window.screen.width,
                        maxWidth: window.screen.width,
                        minHeight: window.screen.height,
                        maxHeight: window.screen.height
                    }
                }
            });

            const video = document.createElement('video');
            video.srcObject = stream;

            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play().then(resolve).catch(resolve);
                };
            });

            const cw = video.videoWidth || window.screen.width;
            const ch = video.videoHeight || window.screen.height;
            const canvas = document.createElement('canvas');
            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, cw, ch);

            stream.getTracks().forEach(t => t.stop());

            return canvas.toDataURL('image/png');
        } catch (gmErr) {
            console.warn('getUserMedia failed, fallback to source.thumbnail:', gmErr);

            const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
            const thumbW = Math.floor(window.screen.width * dpr);
            const thumbH = Math.floor(window.screen.height * dpr);

            const sourcesWithThumb = await desktopCapturer.getSources({
                types: ['screen', 'window'],
                thumbnailSize: { width: thumbW, height: thumbH }
            });

            const chosen = sourcesWithThumb.find(s => s.id === source.id) || sourcesWithThumb[0];
            if (!chosen || !chosen.thumbnail) throw new Error('Nenhuma thumbnail disponível');

            const dataUrl = chosen.thumbnail.toDataURL();
            return dataUrl;
        }

    } catch (err) {
        console.error('captureScreen error:', err);
        throw err;
    }
});

ipcMain.handle('save-file', async (event, dataUrl, filename) => {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid data URL');

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const savePath = path.join(app.getPath('pictures') || app.getPath('home'), filename);

    await fs.promises.writeFile(savePath, buffer);
    return savePath;
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
