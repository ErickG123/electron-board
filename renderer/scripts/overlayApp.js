const canvas = document.getElementById("overlay");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const canvasManager = new CanvasManager(canvas);
const eventManager = new EventManager(canvas, canvasManager, { isOverlay: true });

window.isDrawingMode = false;
window.overlayMode = "persistente";
window.currentColor = "#000000";
window.currentWidth = 2;
window.currentTool = "draw";

function setCanvasPointerEvents(shouldCapture) {
    canvas.style.pointerEvents = shouldCapture ? "auto" : "none";
}
setCanvasPointerEvents(window.isDrawingMode);

if (window.electronAPI) {
    window.electronAPI.onDrawingModeChanged?.(val => {
        window.isDrawingMode = val;
        setCanvasPointerEvents(val);
        console.log("Renderer recebeu drawing-mode:", val);
    });

    window.electronAPI.onOverlayModeChanged?.(val => {
        window.overlayMode = val;
        console.log("Renderer recebeu overlay-mode:", val);
        if (val === "temporario") {
            canvasManager.strokes = [];
            canvasManager.redoStack = [];
            canvasManager.redraw();
        }
    });
}

function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
    });
}

async function saveScreenWithOverlay() {
    try {
        const screenDataUrl = await window.electronAPI.captureScreen();
        const screenImg = await loadImage(screenDataUrl);

        const outCanvas = document.createElement('canvas');
        outCanvas.width = screenImg.width;
        outCanvas.height = screenImg.height;
        const outCtx = outCanvas.getContext('2d');

        outCtx.drawImage(screenImg, 0, 0, outCanvas.width, outCanvas.height);

        const sx = outCanvas.width / canvas.width;
        const sy = outCanvas.height / canvas.height;

        outCtx.save();
        outCtx.scale(sx, sy);
        outCtx.drawImage(canvas, 0, 0);
        outCtx.restore();

        const finalDataUrl = outCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = finalDataUrl;
        a.download = `annotator-${Date.now()}.png`;
        a.click();

        console.log('Screenshot saved (client-side).');
    } catch (err) {
        console.error('Erro ao salvar screenshot:', err);
        alert('Erro ao capturar tela. Veja o console para detalhes.');
    }
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasManager.redraw();
});

window.saveScreenWithOverlay = saveScreenWithOverlay;
window.canvasManager = canvasManager;
window.setCanvasPointerEvents = setCanvasPointerEvents;
