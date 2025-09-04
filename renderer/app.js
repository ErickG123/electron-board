const toolbar = document.getElementById('toolbar');
const toolbarHead = document.getElementById('toolbarHead');
const colorPicker = document.getElementById('colorPicker');
const widthSlider = document.getElementById('widthSlider');
const widthValue = document.getElementById('widthValue');
const btnToggleDraw = document.getElementById('btnToggleDraw');
const btnMode = document.getElementById('btnMode');
const btnClear = document.getElementById('btnClear');
const btnUndo = document.getElementById('btnUndo');
const btnRedo = document.getElementById('btnRedo');
const btnSave = document.getElementById('btnSave');
let drag = { active: false, startX: 0, startY: 0, origX: 0, origY: 0 };

window.currentColor = window.currentColor || '#000000';
window.currentWidth = window.currentWidth || 2;
colorPicker.value = window.currentColor;
widthSlider.value = window.currentWidth;
widthValue.textContent = window.currentWidth;

colorPicker.addEventListener('input', (e) => {
    window.currentColor = e.target.value;
});

widthSlider.addEventListener('input', (e) => {
    window.currentWidth = parseInt(e.target.value, 10);
    widthValue.textContent = window.currentWidth;
});

btnToggleDraw.addEventListener('click', () => {
    window.isDrawingMode = !window.isDrawingMode;

    if (window.electronAPI && window.electronAPI.toggleMouseEvents) {
        window.electronAPI.toggleMouseEvents(window.isDrawingMode);
    } else {
        canvas.style.pointerEvents = window.isDrawingMode ? 'auto' : 'none';
    }

    btnToggleDraw.style.opacity = window.isDrawingMode ? '1' : '0.6';
});

btnMode.addEventListener('click', () => {
    window.overlayMode = window.overlayMode === 'persistente' ? 'temporario' : 'persistente';
    btnMode.textContent = (window.overlayMode === 'persistente') ? 'P' : 'T';

    if (window.overlayMode === 'temporario') {
        canvasManager.strokes = [];
        canvasManager.redoStack = [];
        canvasManager.redraw();
    }
});

btnClear.addEventListener('click', () => {
    canvasManager.strokes = [];
    canvasManager.redoStack = [];
    canvasManager.redraw();
});

btnUndo.addEventListener('click', () => canvasManager.undo());
btnRedo.addEventListener('click', () => canvasManager.redo());

btnSave.addEventListener('click', saveScreenWithOverlay);

toolbarHead.addEventListener('mousedown', (e) => {
    const rect = toolbar.getBoundingClientRect();

    drag.active = true;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.origX = rect.left;
    drag.origY = rect.top;
    toolbarHead.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (!drag.active) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    toolbar.style.left = `${drag.origX + dx}px`;
    toolbar.style.top = `${drag.origY + dy}px`;
});

window.addEventListener('mouseup', () => {
    drag.active = false;
    toolbarHead.style.cursor = 'grab';
});

let hideTimeout = null;
function showToolbarTemporarily() {
    toolbar.style.opacity = '1';
    toolbar.style.transform = 'translateY(0)';

    if (hideTimeout) clearTimeout(hideTimeout);
    
    hideTimeout = setTimeout(() => {
        if (!window.isDrawingMode) {
            toolbar.style.opacity = '0';
            toolbar.style.transform = 'translateY(-8px)';
        }
    }, 2500);
}

window.electronAPI && window.electronAPI.onDrawingModeChanged && window.electronAPI.onDrawingModeChanged((val) => {
    window.isDrawingMode = val;
    setCanvasPointerEvents(val);

    if (val) {
        toolbar.style.opacity = '1';
        toolbar.style.pointerEvents = 'auto';
    } else {
        toolbar.style.pointerEvents = 'auto';
        showToolbarTemporarily();
    }
});

window.addEventListener('mousemove', () => {
    if (!window.isDrawingMode) showToolbarTemporarily();
});
