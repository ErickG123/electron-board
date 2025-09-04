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

        this.selectedIndices = [];
        this.handleSize = 10;
    }

    addStroke(shape) {
        if (!shape) return;
        this.strokes.push(shape);
        this.redoStack = [];
        this.redraw();
    }

    addStrokeOverlay(shape, temporario = false) {
        if (temporario) {
            shape.draw(this.ctx, this.offsetX, this.offsetY);
        } else {
            this.addStroke(shape);
        }
    }

    redraw() {
        if (this.tempCanvas.width !== this.canvas.width || this.tempCanvas.height !== this.canvas.height) {
            this.tempCanvas.width = this.canvas.width;
            this.tempCanvas.height = this.canvas.height;
            this.tempCtx = this.tempCanvas.getContext("2d");
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.strokes.forEach(s => s.draw(this.ctx, this.offsetX, this.offsetY));

        if (this.selectedIndices.length === 1) {
            const s = this.strokes[this.selectedIndices[0]];

            s.drawSelection(this.ctx, this.offsetX, this.offsetY, this.handleSize);
        } else if (this.selectedIndices.length > 1) {
            const groupBox = this._getGroupBounds();

            if (groupBox) {
                const x = groupBox.x + this.offsetX, y = groupBox.y + this.offsetY, w = groupBox.w, h = groupBox.h;

                this.ctx.save();
                this.ctx.setLineDash([6, 4]);
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = '#1E90FF';
                this.ctx.strokeRect(x, y, w, h);
                this.ctx.setLineDash([]);
                this.ctx.restore();

                const hs = [
                    { name: 'nw', x: x, y: y },
                    { name: 'n', x: x + w / 2, y: y },
                    { name: 'ne', x: x + w, y: y },
                    { name: 'e', x: x + w, y: y + h / 2 },
                    { name: 'se', x: x + w, y: y + h },
                    { name: 's', x: x + w / 2, y: y + h },
                    { name: 'sw', x: x, y: y + h },
                    { name: 'w', x: x, y: y + h / 2 },
                ];
                this.ctx.fillStyle = '#fff';
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 1;
                hs.forEach(hp => {
                    this.ctx.beginPath();
                    this.ctx.rect(hp.x - this.handleSize / 2, hp.y - this.handleSize / 2, this.handleSize, this.handleSize);
                    this.ctx.fill();
                    this.ctx.stroke();
                });

                const rotX = x + w / 2, rotY = y - 20;
                this.ctx.beginPath();
                this.ctx.arc(rotX, rotY, this.handleSize / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }
        }
    }

    undo() {
        if (!this.strokes.length) return;

        const stroke = this.strokes.pop();
        this.redoStack.push(stroke);
        this.selectedIndices = this.selectedIndices.filter(i => i < this.strokes.length);
        this.redraw();
    }

    redo() {
        if (!this.redoStack.length) return;

        const stroke = this.redoStack.pop();
        this.strokes.push(stroke);
        this.redraw();
    }

    clearAll() {
        this.strokes = [];
        this.redoStack = [];
        this.selectedIndices = [];
        this.redraw();
    }

    eraseArea(x, y, size) {
        const half = size / 2;
        this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
        this.strokes.forEach(s => s.draw(this.tempCtx, this.offsetX, this.offsetY));
        this.tempCtx.clearRect(x - half, y - half, size, size);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.tempCanvas, 0, 0);
    }

    selectShapeAt(canvasX, canvasY) {
        for (let i = this.strokes.length - 1; i >= 0; i--) {
            if (this.strokes[i].hitTest(canvasX, canvasY)) {
                this.selectedIndices = [i];
                this.redraw();
                return i;
            }
        }

        this.selectedIndices = [];
        this.redraw();

        return -1;
    }

    selectShapesInRect(rect) {
        const sel = [];

        for (let i = 0; i < this.strokes.length; i++) {
            const b = this.strokes[i].getBounds();
            if (rectsIntersect(rect, b)) sel.push(i);
        }

        this.selectedIndices = sel;
        this.redraw();

        return sel;
    }

    deselect() {
        this.selectedIndices = [];
        this.redraw();
    }

    hitHandleAt(screenX, screenY) {
        if (this.selectedIndices.length === 1) {
            const s = this.strokes[this.selectedIndices[0]];

            return s.hitTestHandle(screenX, screenY, this.offsetX, this.offsetY, this.handleSize);
        }

        if (this.selectedIndices.length > 1) {
            const gb = this._getGroupBounds();

            if (!gb) return null;

            const x = gb.x + this.offsetX, y = gb.y + this.offsetY, w = gb.w, h = gb.h;
            const handles = [
                { name: 'nw', x: x, y: y },
                { name: 'n', x: x + w / 2, y: y },
                { name: 'ne', x: x + w, y: y },
                { name: 'e', x: x + w, y: y + h / 2 },
                { name: 'se', x: x + w, y: y + h },
                { name: 's', x: x + w / 2, y: y + h },
                { name: 'sw', x: x, y: y + h },
                { name: 'w', x: x, y: y + h / 2 }
            ];

            for (let hp of handles) {
                if (screenX >= hp.x - this.handleSize / 2 && screenX <= hp.x + this.handleSize / 2 &&
                    screenY >= hp.y - this.handleSize / 2 && screenY <= hp.y + this.handleSize / 2) {
                    return hp.name;
                }
            }

            const rotX = x + w / 2, rotY = y - 20;

            if (screenX >= rotX - this.handleSize && screenX <= rotX + this.handleSize &&
                screenY >= rotY - this.handleSize && screenY <= rotY + this.handleSize) {

                return 'rotate';
            }
        }

        return null;
    }

    moveSelectedBy(dx, dy) {
        if (!this.selectedIndices.length) return;

        this.selectedIndices.forEach(i => {
            const s = this.strokes[i];

            if (s.type === 'draw') {
                s.points = s.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
                s.startX += dx; s.startY += dy;
                s.endX += dx; s.endY += dy;
            } else {
                s.startX += dx; s.startY += dy;
                s.endX += dx; s.endY += dy;
            }
        });

        this.redraw();
    }

    resizeSelected(handle, dx, dy) {
        if (!this.selectedIndices.length) return;

        const gb = this._getGroupBounds();

        if (!gb) return;

        const cx = gb.x + gb.w / 2;
        const cy = gb.y + gb.h / 2;

        this.selectedIndices.forEach(i => {
            const s = this.strokes[i];
            const bbox = s.getBounds();
            let scaleX = 1, scaleY = 1;

            if (['e', 'w', 'ne', 'nw', 'se', 'sw'].includes(handle)) {
                scaleX = (gb.w + dx * (handle.includes('w') ? -1 : 1)) / gb.w || 1;
            }

            if (['n', 's', 'ne', 'nw', 'se', 'sw'].includes(handle)) {
                scaleY = (gb.h + dy * (handle.includes('n') ? -1 : 1)) / gb.h || 1;
            }

            if (s.type === 'draw') {
                s.points = s.points.map(p => ({
                    x: cx + (p.x - cx) * scaleX,
                    y: cy + (p.y - cy) * scaleY
                }));

                if (s.points.length > 0) {
                    s.startX = s.points[0].x; s.startY = s.points[0].y;
                    const last = s.points[s.points.length - 1];
                    s.endX = last.x; s.endY = last.y;
                }
            } else {
                const ns1 = {
                    x: cx + (s.startX - cx) * scaleX,
                    y: cy + (s.startY - cy) * scaleY
                };

                const ns2 = {
                    x: cx + (s.endX - cx) * scaleX,
                    y: cy + (s.endY - cy) * scaleY
                };

                s.startX = ns1.x; s.startY = ns1.y;
                s.endX = ns2.x; s.endY = ns2.y;

                if (s.type === 'text') {
                    s.textBoxWidth = Math.max(10, s.textBoxWidth * scaleX);
                }
            }
        });
        this.redraw();
    }

    rotateSelected(angleDelta) {
        if (!this.selectedIndices.length) return;

        const gb = this._getGroupBounds();

        if (!gb) return;

        const cx = gb.x + gb.w / 2;
        const cy = gb.y + gb.h / 2;

        this.selectedIndices.forEach(i => {
            const s = this.strokes[i];

            s.rotateAround(cx, cy, angleDelta);
        });

        this.redraw();
    }

    deleteSelected() {
        if (!this.selectedIndices.length) return;

        const sorted = [...this.selectedIndices].sort((a, b) => b - a);

        sorted.forEach(i => this.strokes.splice(i, 1));
        this.selectedIndices = [];
        this.redraw();
    }

    _getGroupBounds() {
        if (!this.selectedIndices.length) return null;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        this.selectedIndices.forEach(i => {
            const b = this.strokes[i].getBounds();

            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.w);
            maxY = Math.max(maxY, b.y + b.h);
        });

        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
}

function rectsIntersect(a, b) {
    return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}
