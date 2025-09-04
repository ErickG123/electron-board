class EventManager {
    constructor(canvas, canvasManager, options = {}) {
        this.canvas = canvas;
        this.canvasManager = canvasManager;
        this.isDrawing = false;
        this.currentStroke = null;

        this.isOverlay = options.isOverlay || false;

        this.isPanning = false;
        this.startPan = { x: 0, y: 0 };

        this.registerEvents();
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();

        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    registerEvents() {
        this.canvas.addEventListener("mousedown", (e) => {
            const pos = this.getMousePos(e);

            switch (window.currentTool) {
                case "pan":
                    this.isPanning = true;
                    this.startPan = { x: pos.x, y: pos.y };
                    break;

                case "eraser-stroke":
                    this.eraseStroke({
                        x: pos.x - this.canvasManager.offsetX,
                        y: pos.y - this.canvasManager.offsetY
                    });
                    break;

                case "eraser-paint":
                    this.isDrawing = true;
                    break;

                case "draw":
                    this.isDrawing = true;
                    this.currentStroke = new Stroke(
                        window.currentColor || "black",
                        window.currentWidth || 2
                    );
                    this.currentStroke.addPoint(
                        pos.x - this.canvasManager.offsetX,
                        pos.y - this.canvasManager.offsetY
                    );
                    break;
            }
        });

        this.canvas.addEventListener("mousemove", (e) => {
            const pos = this.getMousePos(e);

            if (this.isPanning) {
                const dx = pos.x - this.startPan.x;
                const dy = pos.y - this.startPan.y;

                this.canvasManager.offsetX += dx;
                this.canvasManager.offsetY += dy;

                this.startPan = pos;
                this.canvasManager.redraw();
                return;
            }

            if (!this.isDrawing) return;

            if (window.currentTool === "eraser-paint") {
                const x = pos.x;
                const y = pos.y;
                const size = window.currentWidth || 20;
                this.canvasManager.eraseArea(x, y, size);
            }

            if (window.currentTool === "draw" && this.currentStroke) {
                this.currentStroke.addPoint(
                    pos.x - this.canvasManager.offsetX,
                    pos.y - this.canvasManager.offsetY
                );

                this.canvasManager.redraw();
                this.currentStroke.draw(this.canvasManager.ctx, this.canvasManager.offsetX, this.canvasManager.offsetY);
            }
        });

        this.canvas.addEventListener("mouseup", () => {
            if (this.isPanning) {
                this.isPanning = false;
                return;
            }

            if (!this.isDrawing) return;
            this.isDrawing = false;

            if (window.currentTool === "draw" && this.currentStroke) {
                if (this.isOverlay) {
                    const temporario = window.overlayMode === "temporario";
                    this.canvasManager.addStrokeOverlay(this.currentStroke, temporario);
                } else {
                    this.canvasManager.addStroke(this.currentStroke);
                }
                this.currentStroke = null;
            }
        });

        window.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "z") this.canvasManager.undo();
            if (e.ctrlKey && e.key === "y") this.canvasManager.redo();
        });
    }

    eraseStroke(pos) {
        this.canvasManager.strokes = this.canvasManager.strokes.filter(stroke => {
            return !stroke.hitTest(pos.x, pos.y);
        });
        this.canvasManager.redraw();
    }
}
