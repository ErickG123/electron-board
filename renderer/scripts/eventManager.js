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
                    this.canvasManager.eraseArea(pos.x, pos.y, window.currentWidth || 20);
                    break;

                case "text":
                    this.createTextBox(e);
                    break;

                default:
                    this.isDrawing = true;
                    this.currentShape = new Shape(
                        window.currentTool,
                        window.currentColor,
                        window.currentWidth,
                        pos.x - this.canvasManager.offsetX,
                        pos.y - this.canvasManager.offsetY
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
                return;
            }

            if (!this.currentShape) return;

            if (["draw", "rectangle", "circle", "line"].includes(window.currentTool)) {
                this.currentShape.setEnd(
                    pos.x - this.canvasManager.offsetX,
                    pos.y - this.canvasManager.offsetY
                );

                this.canvasManager.redraw();
                this.currentShape.draw(this.canvasManager.ctx, this.canvasManager.offsetX, this.canvasManager.offsetY);
            }
        });

        this.canvas.addEventListener("mouseup", () => {
            if (this.isPanning) { this.isPanning = false; return; }
            if (!this.isDrawing) return;

            this.isDrawing = false;

            if (this.currentShape && this.currentShape.type !== "text") {
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
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                this.canvasManager.undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
                this.canvasManager.redo();
            }
        });
    }

    createTextBox(evt) {
        if (document.querySelector(".overlay-text-input")) {
            const existing = document.querySelector(".overlay-text-input");

            existing.focus();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const clientX = evt.clientX;
        const clientY = evt.clientY;

        const leftPx = clientX;
        const topPx = clientY;

        const canvasX = clientX - rect.left - this.canvasManager.offsetX;
        const canvasY = clientY - rect.top - this.canvasManager.offsetY;

        const input = document.createElement("textarea");
        input.classList.add("overlay-text-input");

        input.style.position = "fixed";
        input.style.left = `${leftPx}px`;
        input.style.top = `${topPx}px`;
        input.style.zIndex = 10001;
        input.style.minWidth = "80px";
        input.style.maxWidth = "500px";
        input.style.fontSize = `${window.currentWidth * 5}px`;
        input.style.color = window.currentColor;
        input.style.borderColor = window.currentColor;
        input.style.background = "rgba(255,255,255,0.95)";
        input.style.padding = "6px";
        input.style.resize = "none";
        input.style.overflow = "hidden";
        input.style.outline = "none";
        input.style.lineHeight = "1.2";
        input.spellcheck = false;
        input.autocapitalize = "off";
        input.placeholder = "Digite e pressione Enter para salvar";

        document.body.appendChild(input);

        setTimeout(() => input.focus(), 0);

        const adjustHeight = () => {
            input.style.height = "auto";
            input.style.height = Math.min(input.scrollHeight, 800) + "px";
        };
        input.addEventListener("input", adjustHeight);
        adjustHeight();

        const saveText = () => {
            const textValue = input.value.trim();

            if (textValue) {
                const shape = new Shape(
                    "text",
                    window.currentColor,
                    window.currentWidth,
                    canvasX,
                    canvasY,
                    textValue
                );

                if (this.isOverlay && window.overlayMode === "temporario") {
                    this.canvasManager.addStrokeOverlay(shape, true);
                } else {
                    this.canvasManager.addStroke(shape);
                }
            }

            input.removeEventListener("input", adjustHeight);
            if (document.body.contains(input)) document.body.removeChild(input);
        };

        input.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
                ev.preventDefault();
                saveText();
            } else if (ev.key === "Escape") {
                if (document.body.contains(input)) document.body.removeChild(input);
            }
        });

        input.addEventListener("blur", () => {
            if (!document.body.contains(input)) return;
            saveText();
        });
    }
}
