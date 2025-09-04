const { contextBridge, ipcRenderer, desktopCapturer } = require('electron');

console.log('Preload ativo');

contextBridge.exposeInMainWorld('electronAPI', {
    onDrawingModeChanged: (cb) => ipcRenderer.on('drawing-mode-changed', (e, val) => cb(val)),
    onOverlayModeChanged: (cb) => ipcRenderer.on('overlay-mode-changed', (e, val) => cb(val)),

    captureScreen: async () => {
        try {
            const sources = await desktopCapturer.getSources({ types: ['screen'] });
            if (!sources || sources.length === 0) throw new Error('Nenhuma fonte encontrada');

            const source = sources[0];

            return source.thumbnail.toDataURL();
        } catch (err) {
            console.error('captureScreen error (preload):', err);
            throw err;
        }
    },

    saveToFile: (dataUrl, filename) => ipcRenderer.invoke('save-file', dataUrl, filename)
});
