// eventManager.js
class EventManager {
    constructor(canvas, canvasManager, options = {}) {
        this.canvas = canvas;
        this.canvasManager = canvasManager;

        this.isDrawing = false;
        this.currentShape = null;
        this.isOverlay = options.isOverlay || false;

        this.isPanning = false;
        this.startPan = { x: 0, y: 0 };

        // selection/move/resize/rotate
        this.isSelectingArea = false;
        this.selectionStart = null; // screen coords {x,y}
        this.selectionRect = null;  // {x,y,w,h} in canvas coords

        this.isMovingSelected = false;
        this.moveStart = null; // canvas coords

        this.isResizingSelected = false;
        this.resizeHandle = null;
        this.resizeStart = null; // screen coords

        this.isRotatingSelected = false;
        this.rotateStartAngle = null;

        this.registerEvents();
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
            clientX: evt.clientX,
            clientY: evt.clientY,
            rect
        };
    }

    registerEvents() {
        // MOUSE DOWN
        this.canvas.addEventListener("mousedown", (e) => {
            const pos = this.getMousePos(e);
            const canvasX = pos.x - this.canvasManager.offsetX;
            const canvasY = pos.y - this.canvasManager.offsetY;

            if (window.currentTool === "select") {
                // if there is a selection and handle hit
                const handle = this.canvasManager.hitHandleAt(pos.clientX, pos.clientY);
                if (handle) {
                    if (handle === 'rotate') {
                        this.isRotatingSelected = true;
                        // compute center of group or single selected
                        const gb = this.canvasManager.selectedIndices.length > 1 ? this.canvasManager._getGroupBounds() : this.canvasManager.strokes[this.canvasManager.selectedIndices[0]].getBounds();
                        const cx = gb.x + gb.w / 2, cy = gb.y + gb.h / 2;
                        this.rotateStartAngle = Math.atan2(pos.clientY - (cy + this.canvasManager.offsetY), pos.clientX - (cx + this.canvasManager.offsetX));
                        return;
                    } else {
                        // resize
                        this.isResizingSelected = true;
                        this.resizeHandle = handle;
                        this.resizeStart = { screenX: pos.clientX, screenY: pos.clientY };
                        return;
                    }
                }

                // if clicked on a shape => start move
                const idx = this.canvasManager.selectShapeAt(canvasX, canvasY);
                if (idx >= 0) {
                    // start moving selected shape(s)
                    this.isMovingSelected = true;
                    this.moveStart = { x: canvasX, y: canvasY };
                    return;
                }

                // else start area selection (marquee)
                this.isSelectingArea = true;
                this.selectionStart = { clientX: pos.clientX, clientY: pos.clientY };
                this.selectionRect = null;
                return;
            }

            // not in select mode: previous behaviors
            switch (window.currentTool) {
                case "pan":
                    this.isPanning = true;
                    this.startPan = { x: pos.x, y: pos.y };
                    break;

                case "eraser-stroke":
                    this.canvasManager.strokes = this.canvasManager.strokes.filter(
                        s => !s.hitTest(canvasX, canvasY)
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
                        canvasX,
                        canvasY
                    );
            }
        });

        // MOUSE MOVE
        this.canvas.addEventListener("mousemove", (e) => {
            const pos = this.getMousePos(e);
            const canvasX = pos.x - this.canvasManager.offsetX;
            const canvasY = pos.y - this.canvasManager.offsetY;

            // PAN
            if (this.isPanning) {
                const dx = pos.x - this.startPan.x;
                const dy = pos.y - this.startPan.y;
                this.canvasManager.offsetX += dx;
                this.canvasManager.offsetY += dy;
                this.startPan = pos;
                this.canvasManager.redraw();
                return;
            }

            // rotating selected
            if (this.isRotatingSelected) {
                const gb = this.canvasManager.selectedIndices.length > 1 ? this.canvasManager._getGroupBounds() : this.canvasManager.strokes[this.canvasManager.selectedIndices[0]].getBounds();
                const cx = gb.x + gb.w / 2, cy = gb.y + gb.h / 2;
                const currentAngle = Math.atan2(pos.clientY - (cy + this.canvasManager.offsetY), pos.clientX - (cx + this.canvasManager.offsetX));
                const delta = currentAngle - this.rotateStartAngle;
                this.canvasManager.rotateSelected(delta);
                this.rotateStartAngle = currentAngle;
                return;
            }

            // resizing selected
            if (this.isResizingSelected) {
                const screenDx = pos.clientX - this.resizeStart.screenX;
                const screenDy = pos.clientY - this.resizeStart.screenY;
                // convert screen deltas to approximate canvas deltas (1:1)
                const dx = screenDx;
                const dy = screenDy;
                this.canvasManager.resizeSelected(this.resizeHandle, dx, dy);
                this.resizeStart = { screenX: pos.clientX, screenY: pos.clientY };
                return;
            }

            // moving selected
            if (this.isMovingSelected) {
                const dx = canvasX - this.moveStart.x;
                const dy = canvasY - this.moveStart.y;
                this.canvasManager.moveSelectedBy(dx, dy);
                this.moveStart = { x: canvasX, y: canvasY };
                return;
            }

            // selecting area (marquee)
            if (this.isSelectingArea) {
                // draw temporary selection rectangle on top of canvas
                const sx = this.selectionStart.clientX;
                const sy = this.selectionStart.clientY;
                const ex = pos.clientX;
                const ey = pos.clientY;
                const left = Math.min(sx, ex), top = Math.min(sy, ey), w = Math.abs(ex - sx), h = Math.abs(ey - sy);

                // convert viewport rect to canvas coords
                const rect = this.canvas.getBoundingClientRect();
                const canvasRect = {
                    x: left - rect.left - this.canvasManager.offsetX,
                    y: top - rect.top - this.canvasManager.offsetY,
                    w: w,
                    h: h
                };
                this.selectionRect = canvasRect;

                // redraw and overlay rectangle
                this.canvasManager.redraw();
                // draw marquee on top
                const ctx = this.canvasManager.ctx;
                ctx.save();
                ctx.setLineDash([4, 3]);
                ctx.strokeStyle = 'rgba(30,144,255,0.9)';
                ctx.lineWidth = 1;
                ctx.strokeRect(left - rect.left, top - rect.top, w, h);
                ctx.restore();
                return;
            }

            // If not in any of above and not drawing, nothing
            if (!this.isDrawing) return;

            // ERASER PAINT
            if (window.currentTool === "eraser-paint") {
                const size = window.currentWidth || 20;
                this.canvasManager.eraseArea(pos.x, pos.y, size);
                return;
            }

            // DRAW / shapes preview
            if (this.currentShape && ["draw", "rectangle", "circle", "line"].includes(window.currentTool)) {
                this.currentShape.setEnd(canvasX, canvasY);
                this.canvasManager.redraw();
                this.currentShape.draw(this.canvasManager.ctx, this.canvasManager.offsetX, this.canvasManager.offsetY);
            }
        });

        // MOUSE UP
        this.canvas.addEventListener("mouseup", (e) => {
            // finish pan
            if (this.isPanning) { this.isPanning = false; return; }

            // finish rotate
            if (this.isRotatingSelected) { this.isRotatingSelected = false; this.rotateStartAngle = null; return; }

            // finish resize
            if (this.isResizingSelected) { this.isResizingSelected = false; this.resizeHandle = null; this.resizeStart = null; return; }

            // finish move
            if (this.isMovingSelected) { this.isMovingSelected = false; this.moveStart = null; return; }

            // finish selection area: compute which shapes intersect selectionRect
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

        // KEYBOARD handlers
        window.addEventListener("keydown", (e) => {
            // Undo / Redo
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                this.canvasManager.undo();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
                this.canvasManager.redo();
                return;
            }

            // Delete selected
            if (e.key === "Delete" || e.key === "Backspace") {
                this.canvasManager.deleteSelected();
                return;
            }

            // Escape: cancel selection/modes
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

    // createTextBox: same as before (position fixed, creates shape on save). Kept unchanged for brevity
    createTextBox(evt) {
        if (document.querySelector(".overlay-text-input")) {
            const existing = document.querySelector(".overlay-text-input");
            existing.focus();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const clientX = evt.clientX;
        const clientY = evt.clientY;
        const canvasX = clientX - rect.left - this.canvasManager.offsetX;
        const canvasY = clientY - rect.top - this.canvasManager.offsetY;

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
