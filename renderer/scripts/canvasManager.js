class CanvasManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.strokes = [];
        this.redoStack = [];

        this.offsetX = 0;
        this.offsetY = 0;

        this.tempCanvas = document.createElement("canvas");
        this.tempCanvas.width = canvas.width;
        this.tempCanvas.height = canvas.height;
        this.tempCtx = this.tempCanvas.getContext("2d");
    }

    addStroke(stroke) {
        if (!stroke || !stroke.points || stroke.points.length === 0) return;

        this.strokes.push(stroke);
        this.redoStack = [];
        this.redraw();
    }

    addStrokeOverlay(stroke, temporario = false) {
        if (temporario) {
            stroke.draw(this.ctx, this.offsetX, this.offsetY);
        } else {
            this.addStroke(stroke);
        }
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.strokes.forEach(stroke => stroke.draw(this.ctx, this.offsetX, this.offsetY));
    }

    undo() {
        if (this.strokes.length === 0) return;
        const stroke = this.strokes.pop();
        this.redoStack.push(stroke);
        this.redraw();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const stroke = this.redoStack.pop();
        this.strokes.push(stroke);
        this.redraw();
    }

    clearAll() {
        this.strokes = [];
        this.redoStack = [];
        this.redraw();
    }

    eraseArea(x, y, size) {
        const half = size / 2;

        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        this.strokes.forEach(stroke => stroke.draw(this.tempCtx, this.offsetX, this.offsetY));

        this.tempCtx.clearRect(x - half, y - half, size, size);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.tempCanvas, 0, 0);
    }
}
