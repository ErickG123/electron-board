class EventManager {
    constructor(canvas, canvasManager, options = {}) {
        this.canvas = canvas;
        this.canvasManager = canvasManager;

        this.isDrawing = false;
        this.currentShape = null;
        this.isOverlay = options.isOverlay || false;

        this.isPanning = false;
        this.startPan = { x: 0, y: 0 };

        this.isSelectingArea = false;
        this.selectionStart = null;
        this.selectionRect = null;

        this.isMovingSelected = false;
        this.moveStart = null;

        this.isResizingSelected = false;
        this.resizeHandle = null;
        this.resizeStart = null;

        this.isRotatingSelected = false;
        this.rotateStartAngle = null;

        this.registerEvents();
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        const wrapperScale = window.globalScale || 1;
        const sx = (evt.clientX - rect.left) / wrapperScale;
        const sy = (evt.clientY - rect.top) / wrapperScale;

        const world = this.canvasManager.screenToWorld(sx, sy);
        return {
            sx, sy,
            wx: world.x, wy: world.y,
            clientX: evt.clientX, clientY: evt.clientY,
            rect
        };
    }

    registerEvents() {
        this.canvas.addEventListener("mousedown", (e) => {
            const pos = this.getMousePos(e);
            const canvasWX = pos.wx, canvasWY = pos.wy;

            if (document.querySelector('.overlay-text-input')) {
                return;
            }

            if (window.currentTool === "select") {
                const handle = this.canvasManager.hitHandleAt(pos.sx, pos.sy);
                if (handle) {
                    if (handle === 'rotate') {
                        this.isRotatingSelected = true;
                        const gb = this.canvasManager.selectedIndices.length > 1 ? this.canvasManager._getGroupBounds() : this.canvasManager.strokes[this.canvasManager.selectedIndices[0]].getBounds();
                        const cx = gb.x + gb.w / 2, cy = gb.y + gb.h / 2;
                        this.rotateStartAngle = Math.atan2(pos.clientY - (cy + this.canvasManager.offsetY), pos.clientX - (cx + this.canvasManager.offsetX));
                        return;
                    } else {
                        this.isResizingSelected = true;
                        this.resizeHandle = handle;
                        this.resizeStart = { screenX: pos.sx, screenY: pos.sy };
                        return;
                    }
                }

                const idx = this.canvasManager.selectShapeAt(canvasWX, canvasWY);
                if (idx >= 0) {
                    this.isMovingSelected = true;
                    this.moveStart = { x: canvasWX, y: canvasWY };
                    return;
                }

                this.isSelectingArea = true;
                this.selectionStart = { sx: pos.sx, sy: pos.sy };
                this.selectionRect = null;
                return;
            }

            switch (window.currentTool) {
                case "pan":
                    this.isPanning = true;
                    this.startPan = { x: pos.sx, y: pos.sy };
                    break;

                case "eraser-stroke":
                    this.canvasManager.strokes = this.canvasManager.strokes.filter(
                        s => !s.hitTest || !s.hitTest(canvasWX, canvasWY)
                    );
                    this.canvasManager.redraw();
                    break;

                case "eraser-paint":
                    this.isDrawing = true;
                    this.canvasManager.eraseArea(pos.sx, pos.sy, window.currentWidth || 20);
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
                        canvasWX,
                        canvasWY
                    );
            }
        });

        this.canvas.addEventListener("mousemove", (e) => {
            const pos = this.getMousePos(e);
            const canvasWX = pos.wx, canvasWY = pos.wy;

            if (this.isPanning) {
                const dx = pos.sx - this.startPan.x;
                const dy = pos.sy - this.startPan.y;
                this.canvasManager.offsetX += dx;
                this.canvasManager.offsetY += dy;
                this.startPan = { x: pos.sx, y: pos.sy };
                this.canvasManager.redraw();
                return;
            }

            if (this.isRotatingSelected) {
                const gb = this.canvasManager.selectedIndices.length > 1 ? this.canvasManager._getGroupBounds() : this.canvasManager.strokes[this.canvasManager.selectedIndices[0]].getBounds();
                const cx = gb.x + gb.w / 2, cy = gb.y + gb.h / 2;
                const currentAngle = Math.atan2(pos.clientY - (cy + this.canvasManager.offsetY), pos.clientX - (cx + this.canvasManager.offsetX));
                const delta = currentAngle - this.rotateStartAngle;
                this.canvasManager.rotateSelected(delta);
                this.rotateStartAngle = currentAngle;
                return;
            }

            if (this.isResizingSelected) {
                const screenDx = pos.sx - this.resizeStart.screenX;
                const screenDy = pos.sy - this.resizeStart.screenY;
                this.canvasManager.resizeSelected(this.resizeHandle, screenDx, screenDy);
                this.resizeStart = { screenX: pos.sx, screenY: pos.sy };
                return;
            }

            if (this.isMovingSelected) {
                const dx = canvasWX - this.moveStart.x;
                const dy = canvasWY - this.moveStart.y;
                this.canvasManager.moveSelectedBy(dx, dy);
                this.moveStart = { x: canvasWX, y: canvasWY };
                return;
            }

            if (this.isSelectingArea) {
                const sx = this.selectionStart.sx, sy = this.selectionStart.sy;
                const ex = pos.sx, ey = pos.sy;
                const left = Math.min(sx, ex), top = Math.min(sy, ey), w = Math.abs(ex - sx), h = Math.abs(ey - sy);

                const canvasRectWorld = {
                    x: (left - this.canvasManager.offsetX) / this.canvasManager.zoom,
                    y: (top - this.canvasManager.offsetY) / this.canvasManager.zoom,
                    w: w / this.canvasManager.zoom,
                    h: h / this.canvasManager.zoom
                };
                this.selectionRect = canvasRectWorld;

                this.canvasManager.redraw();
                const ctx = this.canvasManager.ctx;
                ctx.save();
                ctx.setLineDash([4, 3]);
                ctx.strokeStyle = 'rgba(30,144,255,0.9)';
                ctx.lineWidth = 1;
                ctx.strokeRect(left, top, w, h);
                ctx.restore();
                return;
            }

            if (!this.isDrawing) return;

            if (window.currentTool === "eraser-paint") {
                const size = window.currentWidth || 20;
                this.canvasManager.eraseArea(pos.sx, pos.sy, size);
                return;
            }

            if (this.currentShape && ["draw", "rectangle", "circle", "line"].includes(window.currentTool)) {
                this.currentShape.setEnd(canvasWX, canvasWY);
                this.canvasManager.redraw(this.currentShape);
            }
        });

        this.canvas.addEventListener("mouseup", (e) => {
            if (this.isPanning) { this.isPanning = false; return; }
            if (this.isRotatingSelected) { this.isRotatingSelected = false; this.rotateStartAngle = null; return; }
            if (this.isResizingSelected) { this.isResizingSelected = false; this.resizeHandle = null; this.resizeStart = null; return; }
            if (this.isMovingSelected) { this.isMovingSelected = false; this.moveStart = null; return; }

            if (this.isSelectingArea) {
                this.isSelectingArea = false;
                if (this.selectionRect) {
                    this.canvasManager.selectShapesInRect(this.selectionRect);
                    this.selectionRect = null;
                }
                this.selectionStart = null;
                return;
            }

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
            if ((e.ctrlKey || e.metaKey) && e.key === "z") this.canvasManager.undo();
            if ((e.ctrlKey || e.metaKey) && e.key === "y") this.canvasManager.redo();

            if (e.key === "Delete" || e.key === "Backspace") {
                this.canvasManager.deleteSelected();
                return;
            }

            if (e.key === "Escape") {
                this.isMovingSelected = false;
                this.isResizingSelected = false;
                this.resizeHandle = null;
                this.isRotatingSelected = false;
                this.canvasManager.deselect();
                return;
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
        const wrapperScale = window.globalScale || 1;
        const clientX = evt.clientX;
        const clientY = evt.clientY;
        const canvasX = (clientX - rect.left) / wrapperScale;
        const canvasY = (clientY - rect.top) / wrapperScale;
        const world = this.canvasManager.screenToWorld(canvasX, canvasY);

        const input = document.createElement("textarea");
        input.classList.add("overlay-text-input");
        input.style.position = "fixed";
        input.style.left = `${clientX}px`;
        input.style.top = `${clientY}px`;
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
                    world.x,
                    world.y,
                    textValue
                );

                if (this.isOverlay && window.overlayMode === "temporario") {
                    this.canvasManager.addStrokeOverlay(shape, true);
                } else {
                    this.canvasManager.addStroke(shape);
                }
            }

            input.addEventListener("input", adjustHeight, { once: true });
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
