class CanvasManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.strokes = [];
        this.overlayStrokes = [];
        this.redoStack = [];

        this.offsetX = 0;
        this.offsetY = 0;

        this.tempCanvas = document.createElement("canvas");
        this.tempCanvas.width = canvas.width;
        this.tempCanvas.height = canvas.height;
        this.tempCtx = this.tempCanvas.getContext("2d");
    }

    addStroke(shape) {
        if (!shape) return;
        this.strokes.push(shape);
        this.redoStack = [];
        this.redraw();
    }

    addStrokeOverlay(shape, temporario = false) {
        if (temporario) {
            this.overlayStrokes.push(shape);
            this.redraw();
        } else {
            this.addStroke(shape);
        }
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.strokes.forEach(s => s.draw(this.ctx, this.offsetX, this.offsetY));

        this.overlayStrokes.forEach(s => s.draw(this.ctx, this.offsetX, this.offsetY));
    }

    undo() {
        if (!this.strokes.length) return;
        this.redoStack.push(this.strokes.pop());
        this.redraw();
    }

    redo() {
        if (!this.redoStack.length) return;
        this.strokes.push(this.redoStack.pop());
        this.redraw();
    }

    clearAll() {
        this.strokes = [];
        this.overlayStrokes = [];
        this.redoStack = [];
        this.redraw();
    }

    eraseArea(x, y, size) {
        const half = size / 2;

        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        this.strokes.forEach(s => s.draw(this.tempCtx, this.offsetX, this.offsetY));

        this.tempCtx.clearRect(x - half, y - half, size, size);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.tempCanvas, 0, 0);

        this.overlayStrokes.forEach(s => s.draw(this.ctx, this.offsetX, this.offsetY));
    }

    clearOverlay() {
        this.overlayStrokes = [];
        this.redraw();
    }
}
