class EventManager {
    constructor(canvas, canvasManager, options = {}) {
        this.canvas = canvas;
        this.canvasManager = canvasManager;

        this.isDrawing = false;
        this.currentShape = null;
        this.isOverlay = options.isOverlay || false;

        this.isPanning = false;
        this.startPan = { x: 0, y: 0 };

        this.registerEvents();
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
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
                    this.canvasManager.strokes = this.canvasManager.strokes.filter(
                        s => !s.hitTest || !s.hitTest(pos.x - this.canvasManager.offsetX, pos.y - this.canvasManager.offsetY)
                    );
                    this.canvasManager.redraw();
                    break;

                case "eraser-paint":
                    this.isDrawing = true;
                    break;

                default:
                    this.isDrawing = true;
                    let text = null;

                    if (window.currentTool === "text") text = prompt("Digite o texto:") || "";

                    this.currentShape = new Shape(
                        window.currentTool,
                        window.currentColor,
                        window.currentWidth,
                        pos.x - this.canvasManager.offsetX,
                        pos.y - this.canvasManager.offsetY,
                        text
                    );
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
                const size = window.currentWidth || 20;

                this.canvasManager.eraseArea(pos.x, pos.y, size);
            } else if (this.currentShape) {
                this.currentShape.setEnd(pos.x - this.canvasManager.offsetX, pos.y - this.canvasManager.offsetY);
                this.canvasManager.redraw();
                this.currentShape.draw(this.canvasManager.ctx, this.canvasManager.offsetX, this.canvasManager.offsetY);
            }
        });

        this.canvas.addEventListener("mouseup", () => {
            if (this.isPanning) { this.isPanning = false; return; }
            if (!this.isDrawing) return;

            this.isDrawing = false;

            if (this.currentShape) {
                if (this.isOverlay) {
                    const temp = window.overlayMode === "temporario";

                    this.canvasManager.addStrokeOverlay(this.currentShape, temp);
                } else {
                    this.canvasManager.addStroke(this.currentShape);
                }

                this.currentShape = null;
            }
        });

        window.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "z") this.canvasManager.undo();
            if (e.ctrlKey && e.key === "y") this.canvasManager.redo();
        });
    }
}
