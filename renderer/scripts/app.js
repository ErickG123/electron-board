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

const btnDraw = document.getElementById('btnDraw');
const btnRectangle = document.getElementById('btnRectangle');
const btnCircle = document.getElementById('btnCircle');
const btnLine = document.getElementById('btnLine');
const btnText = document.getElementById('btnText');
const btnPan = document.getElementById('btnPan');
const btnEraserPaint = document.getElementById('btnEraserPaint');
const btnEraserStroke = document.getElementById('btnEraserStroke');

let drag = { active: false, startX: 0, startY: 0, origX: 0, origY: 0 };
window.currentTool = window.currentTool || 'draw';
window.isDrawingMode = window.isDrawingMode || false;
window.overlayMode = window.overlayMode || 'persistente';
colorPicker.value = window.currentColor;
widthSlider.value = window.currentWidth;
widthValue.textContent = window.currentWidth;

function updateActiveToolButton() {
    [btnDraw, btnRectangle, btnCircle, btnLine, btnText, btnPan, btnEraserPaint, btnEraserStroke].forEach(btn => btn.classList.remove('active'));
    switch (window.currentTool) {
        case 'draw': btnDraw.classList.add('active'); break;
        case 'rectangle': btnRectangle.classList.add('active'); break;
        case 'circle': btnCircle.classList.add('active'); break;
        case 'line': btnLine.classList.add('active'); break;
        case 'text': btnText.classList.add('active'); break;
        case 'pan': btnPan.classList.add('active'); break;
        case 'eraser-paint': btnEraserPaint.classList.add('active'); break;
        case 'eraser-stroke': btnEraserStroke.classList.add('active'); break;
    }
}
updateActiveToolButton();

colorPicker.addEventListener('input', e => window.currentColor = e.target.value);
widthSlider.addEventListener('input', e => { window.currentWidth = parseInt(e.target.value, 10); widthValue.textContent = window.currentWidth; });
btnToggleDraw.addEventListener('click', () => { window.isDrawingMode = !window.isDrawingMode; if (window.setCanvasPointerEvents) window.setCanvasPointerEvents(window.isDrawingMode); btnToggleDraw.style.opacity = window.isDrawingMode ? '1' : '0.6'; });
btnMode.addEventListener('click', () => { window.overlayMode = window.overlayMode === 'persistente' ? 'temporario' : 'persistente'; btnMode.textContent = window.overlayMode === 'persistente' ? 'P' : 'T'; if (window.overlayMode === 'temporario') { window.canvasManager.strokes = []; window.canvasManager.redoStack = []; window.canvasManager.redraw(); } });
btnClear.addEventListener('click', () => { window.canvasManager.strokes = []; window.canvasManager.redoStack = []; window.canvasManager.redraw(); });
btnUndo.addEventListener('click', () => window.canvasManager.undo());
btnRedo.addEventListener('click', () => window.canvasManager.redo());
btnSave.addEventListener('click', window.saveScreenWithOverlay);

[btnDraw, btnRectangle, btnCircle, btnLine, btnText, btnPan, btnEraserPaint, btnEraserStroke].forEach((btn, i) => {
    const tools = ['draw', 'rectangle', 'circle', 'line', 'text', 'pan', 'eraser-paint', 'eraser-stroke'];

    btn.addEventListener('click', () => {
        console.log("Click: ", tools[i]);
        window.currentTool = tools[i];
        updateActiveToolButton();
    });
});

toolbarHead.addEventListener('mousedown', e => {
    const rect = toolbar.getBoundingClientRect();

    drag.active = true; drag.startX = e.clientX; drag.startY = e.clientY;
    drag.origX = rect.left; drag.origY = rect.top;
    toolbarHead.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', e => { if (!drag.active) return; toolbar.style.left = `${drag.origX + (e.clientX - drag.startX)}px`; toolbar.style.top = `${drag.origY + (e.clientY - drag.startY)}px`; });
window.addEventListener('mouseup', () => { drag.active = false; toolbarHead.style.cursor = 'grab'; });

let hideTimeout = null;
function showToolbarTemporarily() {
    toolbar.style.opacity = '1';
    toolbar.style.transform = 'translateY(0)';

    if (hideTimeout) clearTimeout(hideTimeout);

    hideTimeout = setTimeout(() => {
        if (!window.isDrawingMode) {
            toolbar.style.opacity = '0'; toolbar.style.transform = 'translateY(-8px)';
        }
    }, 2500);
}
window.addEventListener('mousemove', () => { if (!window.isDrawingMode) showToolbarTemporarily(); });

if (window.electronAPI && window.electronAPI.onDrawingModeChanged) {
    window.electronAPI.onDrawingModeChanged(val => {
        window.isDrawingMode = val;

        if (window.setCanvasPointerEvents) window.setCanvasPointerEvents(val);

        toolbar.style.opacity = val ? '1' : '0';
        toolbar.style.pointerEvents = 'auto';

        if (!val) showToolbarTemporarily();
    });
}
