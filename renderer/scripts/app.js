const $ = id => document.getElementById(id) || null;

const toolbar = $('toolbar');
const toolbarHead = $('toolbarHead');
const colorPicker = $('colorPicker');
const widthSlider = $('widthSlider');
const widthValue = $('widthValue');
const btnToggleDraw = $('btnToggleDraw');
const btnMode = $('btnMode');
const btnClear = $('btnClear');
const btnUndo = $('btnUndo');
const btnRedo = $('btnRedo');
const btnSave = $('btnSave');

const btnDraw = $('btnDraw');
const btnRectangle = $('btnRectangle');
const btnCircle = $('btnCircle');
const btnLine = $('btnLine');
const btnText = $('btnText');
const btnSelect = $('btnSelect');
const btnPan = $('btnPan');
const btnEraserPaint = $('btnEraserPaint');
const btnEraserStroke = $('btnEraserStroke');

let drag = { active: false, startX: 0, startY: 0, origX: 0, origY: 0 };

window.currentTool = window.currentTool || 'draw';
window.isDrawingMode = window.isDrawingMode || false;
window.overlayMode = window.overlayMode || 'persistente';

if (colorPicker && window.currentColor) colorPicker.value = window.currentColor;
if (widthSlider && window.currentWidth !== undefined) widthSlider.value = window.currentWidth;
if (widthValue && window.currentWidth !== undefined) widthValue.textContent = window.currentWidth;

const toolButtons = {
    draw: btnDraw,
    rectangle: btnRectangle,
    circle: btnCircle,
    line: btnLine,
    text: btnText,
    select: btnSelect,
    pan: btnPan,
    'eraser-paint': btnEraserPaint,
    'eraser-stroke': btnEraserStroke
};

function updateActiveToolButton() {
    Object.values(toolButtons).forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    const activeBtn = toolButtons[window.currentTool];
    if (activeBtn) activeBtn.classList.add('active');
}
updateActiveToolButton();

if (colorPicker) colorPicker.addEventListener('input', e => window.currentColor = e.target.value);
if (widthSlider) widthSlider.addEventListener('input', e => {
    window.currentWidth = parseInt(e.target.value, 10);
    if (widthValue) widthValue.textContent = window.currentWidth;
});

if (btnToggleDraw) btnToggleDraw.addEventListener('click', () => {
    window.isDrawingMode = !window.isDrawingMode;
    if (window.setCanvasPointerEvents) window.setCanvasPointerEvents(window.isDrawingMode);
    btnToggleDraw.style.opacity = window.isDrawingMode ? '1' : '0.6';
});

if (btnMode) btnMode.addEventListener('click', () => {
    window.overlayMode = window.overlayMode === 'persistente' ? 'temporario' : 'persistente';
    btnMode.textContent = window.overlayMode === 'persistente' ? 'P' : 'T';
    if (window.overlayMode === 'temporario' && window.canvasManager) {
        window.canvasManager.strokes = [];
        window.canvasManager.redoStack = [];
        window.canvasManager.redraw();
    }
});

if (btnClear) btnClear.addEventListener('click', () => {
    if (!window.canvasManager) return;
    window.canvasManager.strokes = [];
    window.canvasManager.redoStack = [];
    window.canvasManager.redraw();
});

if (btnUndo) btnUndo.addEventListener('click', () => window.canvasManager?.undo());
if (btnRedo) btnRedo.addEventListener('click', () => window.canvasManager?.redo());
if (btnSave) btnSave.addEventListener('click', () => window.saveScreenWithOverlay?.());

const toolsOrder = ['draw', 'rectangle', 'circle', 'line', 'text', 'select', 'pan', 'eraser-paint', 'eraser-stroke'];
toolsOrder.forEach(toolName => {
    const btn = toolButtons[toolName];
    if (!btn) return;
    btn.addEventListener('click', () => {
        window.currentTool = toolName;
        updateActiveToolButton();
    });
});

if (toolbarHead) {
    toolbarHead.addEventListener('mousedown', e => {
        const rect = toolbar?.getBoundingClientRect();
        if (!rect) return;
        drag.active = true; drag.startX = e.clientX; drag.startY = e.clientY;
        drag.origX = rect.left; drag.origY = rect.top;
        toolbarHead.style.cursor = 'grabbing';
    });
}

window.addEventListener('mousemove', e => {
    if (!drag.active || !toolbar) return;
    toolbar.style.left = `${drag.origX + (e.clientX - drag.startX)}px`;
    toolbar.style.top = `${drag.origY + (e.clientY - drag.startY)}px`;
});

window.addEventListener('mouseup', () => {
    drag.active = false;
    if (toolbarHead) toolbarHead.style.cursor = 'grab';
});

let hideTimeout = null;
function showToolbarTemporarily() {
    if (!toolbar) return;
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
window.addEventListener('mousemove', () => { if (!window.isDrawingMode) showToolbarTemporarily(); });

if (window.electronAPI && window.electronAPI.onDrawingModeChanged && typeof window.electronAPI.onDrawingModeChanged === 'function') {
    window.electronAPI.onDrawingModeChanged(val => {
        window.isDrawingMode = val;
        if (window.setCanvasPointerEvents) window.setCanvasPointerEvents(val);
        if (toolbar) {
            toolbar.style.opacity = val ? '1' : '0';
            toolbar.style.pointerEvents = 'auto';
            if (!val) showToolbarTemporarily();
        }
    });
}
