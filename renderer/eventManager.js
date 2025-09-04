class EventManager {
    constructor(canvas, canvasManager, options = {}) {
        this.canvas = canvas;
        this.canvasManager = canvasManager;
        this.isDrawing = false;
        this.currentStroke = null;

        this.isOverlay = options.isOverlay || false;

        this.registerEvents();
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();

        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        }
    }

    registerEvents() {
        this.canvas.addEventListener("mousedown", (e) => {
            const pos = this.getMousePos(e);

            this.isDrawing = true;
            this.currentStroke = new Stroke(window.currentColor || 'black', window.currentWidth || 2);
            this.currentStroke.addPoint(pos.x, pos.y);
        });

        this.canvas.addEventListener("mousemove", (e) => {
            if (!this.isDrawing) return;

            const pos = this.getMousePos(e);

            this.currentStroke.addPoint(pos.x, pos.y);
            this.canvasManager.redraw();
            this.currentStroke.draw(this.canvasManager.ctx);
        });

        this.canvas.addEventListener("mouseup", () => {
            if (!this.isDrawing) return;

            this.isDrawing = false;

            if (this.isOverlay) {
                const temporario = window.overlayMode === "temporario";

                this.canvasManager.addStrokeOverlay(this.currentStroke, temporario);
            } else {
                this.canvasManager.addStroke(this.currentStroke);
            }

            this.currentStroke = null;
        });

        window.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "z") {
                this.canvasManager.undo();
            }

            if (e.ctrlKey && e.key === "y") {
                this.canvasManager.redo();
            }
        });
    }
}
