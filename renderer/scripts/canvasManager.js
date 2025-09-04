class CanvasManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.strokes = [];
        this.redoStack = [];
    }

    addStroke(stroke) {
        this.strokes.push(stroke);
        this.redoStack = [];
        this.redraw();
    }

    addStrokeOverlay(stroke, temporario = false) {
        this.strokes.push(stroke);
        this.redoStack = [];
        this.redraw();

        if (temporario) {
            setTimeout(() => {
                this.strokes.pop();
                this.redraw();
            }, 1000);
        }
    }

    undo() {
        if (this.strokes.length > 0) {
            const last = this.strokes.pop();

            this.redoStack.push(last);
            this.redraw()
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const stroke = this.redoStack.pop();

            this.strokes.push(stroke);
            this.redraw();
        }
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let stroke of this.strokes) {
            stroke.draw(this.ctx);
        }
    }
}
