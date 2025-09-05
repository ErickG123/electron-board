class CanvasManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.strokes = [];

        this.history = [];
        this.redoStack = [];
        this.maxHistory = 100;

        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1;

        this.tempCanvas = document.createElement("canvas");
        this.tempCanvas.width = canvas.width;
        this.tempCanvas.height = canvas.height;
        this.tempCtx = this.tempCanvas.getContext("2d");

        this.selectedIndices = [];
        this.handleSizePx = 10;
    }

    worldToScreen(wx, wy) {
        return { x: wx * this.zoom + this.offsetX, y: wy * this.zoom + this.offsetY };
    }

    screenToWorld(sx, sy) {
        return { x: (sx - this.offsetX) / this.zoom, y: (sy - this.offsetY) / this.zoom };
    }

    _getSnapshot() {
        return this.strokes.map(s => s.toJSON());
    }

    _restoreSnapshot(snapshot) {
        this.strokes = (snapshot || []).map(obj => Shape.fromJSON(obj));
        this.selectedIndices = [];
        this.redraw();
    }

    _pushHistory() {
        const snap = this._getSnapshot();
        this.history.push(snap);
        if (this.history.length > this.maxHistory) this.history.shift();

        this.redoStack = [];
    }

    addStroke(shape) {
        if (!shape) return;
        this._pushHistory();
        this.strokes.push(shape);
        this.redraw();
    }

    addStrokeOverlay(shape, temporario = false) {
        if (temporario) {
            shape.draw(this.ctx, 0, 0);
        } else {
            this.addStroke(shape);
        }
    }

    redraw(previewShape = null) {
        if (this.tempCanvas.width !== this.canvas.width || this.tempCanvas.height !== this.canvas.height) {
            this.tempCanvas.width = this.canvas.width;
            this.tempCanvas.height = this.canvas.height;
            this.tempCtx = this.tempCanvas.getContext("2d");
        }

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.setTransform(this.zoom, 0, 0, this.zoom, this.offsetX, this.offsetY);

        this.strokes.forEach(s => s.draw(this.ctx, 0, 0));

        if (previewShape) previewShape.draw(this.ctx, 0, 0);

        this.ctx.restore();

        if (this.selectedIndices.length === 1) {
            const s = this.strokes[this.selectedIndices[0]];

            if (s) this._drawShapeHandlesScreen(s);
        } else if (this.selectedIndices.length > 1) {
            const gb = this._getGroupBounds();

            if (gb) this._drawGroupHandlesScreen(gb);
        }
    }

    _drawShapeHandlesScreen(shape) {
        const bounds = shape.getBounds();
        const cornersWorld = [
            { name: 'nw', x: bounds.x, y: bounds.y },
            { name: 'n', x: bounds.x + bounds.w / 2, y: bounds.y },
            { name: 'ne', x: bounds.x + bounds.w, y: bounds.y },
            { name: 'e', x: bounds.x + bounds.w, y: bounds.y + bounds.h / 2 },
            { name: 'se', x: bounds.x + bounds.w, y: bounds.y + bounds.h },
            { name: 's', x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h },
            { name: 'sw', x: bounds.x, y: bounds.y + bounds.h },
            { name: 'w', x: bounds.x, y: bounds.y + bounds.h / 2 }
        ];

        const handleHalf = this.handleSizePx / 2;
        const ctx = this.ctx;

        const pTL = this.worldToScreen(bounds.x, bounds.y);
        const pBR = this.worldToScreen(bounds.x + bounds.w, bounds.y + bounds.h);
        const x = pTL.x, y = pTL.y, w = pBR.x - pTL.x, h = pBR.y - pTL.y;

        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#1E90FF';
        ctx.strokeRect(x, y, w, h);
        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        cornersWorld.forEach(hp => {
            const p = this.worldToScreen(hp.x, hp.y);
            ctx.beginPath();
            ctx.rect(p.x - handleHalf, p.y - handleHalf, this.handleSizePx, this.handleSizePx);
            ctx.fill();
            ctx.stroke();
        });

        const topCenterScreen = this.worldToScreen(bounds.x + bounds.w / 2, bounds.y);
        ctx.beginPath();
        ctx.arc(topCenterScreen.x, topCenterScreen.y - 20, handleHalf, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    _drawGroupHandlesScreen(gb) {
        const ctx = this.ctx;
        const topLeftScreen = this.worldToScreen(gb.x, gb.y);
        const w = gb.w * this.zoom;
        const h = gb.h * this.zoom;
        const x = topLeftScreen.x, y = topLeftScreen.y;

        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#1E90FF';
        ctx.strokeRect(x, y, w, h);
        ctx.restore();

        const handleHalf = this.handleSizePx / 2;
        const hs = [
            { name: 'nw', x: x, y: y },
            { name: 'n', x: x + w / 2, y: y },
            { name: 'ne', x: x + w, y: y },
            { name: 'e', x: x + w, y: y + h / 2 },
            { name: 'se', x: x + w, y: y + h },
            { name: 's', x: x + w / 2, y: y + h },
            { name: 'sw', x: x, y: y + h },
            { name: 'w', x: x, y: y + h / 2 }
        ];

        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        hs.forEach(hp => {
            ctx.beginPath();
            ctx.rect(hp.x - handleHalf, hp.y - handleHalf, this.handleSizePx, this.handleSizePx);
            ctx.fill();
            ctx.stroke();
        });

        const rotX = x + w / 2, rotY = y - 20;
        ctx.beginPath();
        ctx.arc(rotX, rotY, handleHalf, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    undo() {
        if (!this.history.length) return;

        const prev = this.history.pop();
        const current = this._getSnapshot();

        this.redoStack.push(current);
        this._restoreSnapshot(prev);
    }

    redo() {
        if (!this.redoStack.length) return;

        const next = this.redoStack.pop();
        const current = this._getSnapshot();
        this.history.push(current);
        this._restoreSnapshot(next);
    }

    clearAll() {
        this._pushHistory();
        this.strokes = [];
        this.selectedIndices = [];
        this.redraw();
    }

    eraseArea(sx, sy, sizePx) {
        this._pushHistory();

        const centerWorld = this.screenToWorld(sx, sy);
        const radiusWorld = (sizePx / this.zoom) || sizePx;

        const newStrokes = [];
        let modified = false;

        for (let s of this.strokes) {
            if (!s) continue;

            if (s.type === 'draw') {
                const keptSegments = [];
                let currentSeg = [];

                for (let p of s.points) {
                    const d = Math.hypot(p.x - centerWorld.x, p.y - centerWorld.y);
                    const inside = d <= radiusWorld;
                    if (!inside) {
                        currentSeg.push({ x: p.x, y: p.y });
                    } else {
                        if (currentSeg.length >= 2) {
                            keptSegments.push(currentSeg);
                        }
                        currentSeg = [];
                    }
                }
                if (currentSeg.length >= 2) keptSegments.push(currentSeg);

                if (keptSegments.length === 0) {
                    modified = true;
                    continue;
                }

                if (keptSegments.length === 1 && keptSegments[0].length === s.points.length) {
                    newStrokes.push(s);
                    continue;
                }

                modified = true;
                for (let seg of keptSegments) {
                    const ns = Shape.fromPoints(s.color, s.width, seg);
                    newStrokes.push(ns);
                }
            } else {
                const bounds = s.getBounds();
                const dx = Math.max(bounds.x - centerWorld.x, 0, centerWorld.x - (bounds.x + bounds.w));
                const dy = Math.max(bounds.y - centerWorld.y, 0, centerWorld.y - (bounds.y + bounds.h));
                const distRect = Math.hypot(dx, dy);
                const touched = distRect <= radiusWorld || s.hitTest(centerWorld.x, centerWorld.y);

                if (touched) {
                    modified = true;
                    continue;
                } else {
                    newStrokes.push(s);
                }
            }
        }

        if (modified) {
            this.strokes = newStrokes;
            this.redraw();
        }
    }

    selectShapeAt(screenX, screenY) {
        const world = this.screenToWorld(screenX, screenY);

        for (let i = this.strokes.length - 1; i >= 0; i--) {
            if (this.strokes[i].hitTest(world.x, world.y)) {
                this.selectedIndices = [i];
                this.redraw();

                return i;
            }
        }

        this.selectedIndices = [];
        this.redraw();
        return -1;
    }

    selectShapesInRect(rectWorld) {
        const sel = [];

        for (let i = 0; i < this.strokes.length; i++) {
            const b = this.strokes[i].getBounds();
            if (rectsIntersect(rectWorld, b)) sel.push(i);
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
            if (!s) return null;
            return s.hitTestHandle(screenX, screenY, (wx, wy) => this.worldToScreen(wx, wy), this.handleSizePx);
        } else if (this.selectedIndices.length > 1) {
            const gb = this._getGroupBounds();
            if (!gb) return null;
            const topLeft = this.worldToScreen(gb.x, gb.y);
            const x = topLeft.x, y = topLeft.y, w = gb.w * this.zoom, h = gb.h * this.zoom;
            const half = this.handleSizePx / 2;
            const hs = [
                { name: 'nw', x: x, y: y },
                { name: 'n', x: x + w / 2, y: y },
                { name: 'ne', x: x + w, y: y },
                { name: 'e', x: x + w, y: y + h / 2 },
                { name: 'se', x: x + w, y: y + h },
                { name: 's', x: x + w / 2, y: y + h },
                { name: 'sw', x: x, y: y + h },
                { name: 'w', x: x, y: y + h / 2 }
            ];

            for (let hp of hs) {
                if (screenX >= hp.x - half && screenX <= hp.x + half && screenY >= hp.y - half && screenY <= hp.y + half) {
                    return hp.name;
                }
            }

            const rotX = x + w / 2, rotY = y - 20;
            const rHalf = this.handleSizePx;
            if (screenX >= rotX - rHalf && screenX <= rotX + rHalf && screenY >= rotY - rHalf && screenY <= rotY + rHalf) {
                return 'rotate';
            }
        }
        return null;
    }

    moveSelectedBy(dx, dy) {
        if (!this.selectedIndices.length) return;
        this._pushHistory();
        this.selectedIndices.forEach(i => {
            const s = this.strokes[i];
            if (!s) return;
            if (s.type === 'draw') {
                s.moveBy(dx, dy);
            } else {
                s.startX += dx; s.startY += dy;
                s.endX += dx; s.endY += dy;
            }
        });
        this.redraw();
    }

    resizeSelected(handle, dxScreen, dyScreen) {
        if (!this.selectedIndices.length) return;
        this._pushHistory();

        const gb = this._getGroupBounds();
        if (!gb) return;

        const dx = dxScreen / this.zoom;
        const dy = dyScreen / this.zoom;
        const cx = gb.x + gb.w / 2;
        const cy = gb.y + gb.h / 2;

        this.selectedIndices.forEach(i => {
            const s = this.strokes[i];
            if (!s) return;

            if (s.type === 'draw') {
                s.points = s.points.map(p => ({
                    x: cx + (p.x - cx) * (1 + dx / (gb.w || 1)),
                    y: cy + (p.y - cy) * (1 + dy / (gb.h || 1))
                }));
                if (s.points.length > 0) {
                    s.startX = s.points[0].x; s.startY = s.points[0].y;
                    const last = s.points[s.points.length - 1];
                    s.endX = last.x; s.endY = last.y;
                }
            } else {
                const ns1 = {
                    x: cx + (s.startX - cx) * (1 + dx / (gb.w || 1)),
                    y: cy + (s.startY - cy) * (1 + dy / (gb.h || 1))
                };
                const ns2 = {
                    x: cx + (s.endX - cx) * (1 + dx / (gb.w || 1)),
                    y: cy + (s.endY - cy) * (1 + dy / (gb.h || 1))
                };

                s.startX = ns1.x; s.startY = ns1.y;
                s.endX = ns2.x; s.endY = ns2.y;

                if (s.type === 'text') {
                    s.textBoxWidth = Math.max(10, s.textBoxWidth * (1 + dx / (gb.w || 1)));
                }
            }
        });

        this.redraw();
    }

    rotateSelected(angleDelta) {
        if (!this.selectedIndices.length) return;
        this._pushHistory();

        const gb = this._getGroupBounds();
        if (!gb) return;
        const cx = gb.x + gb.w / 2;
        const cy = gb.y + gb.h / 2;

        this.selectedIndices.forEach(i => {
            const s = this.strokes[i];
            if (!s) return;
            s.rotateAround(cx, cy, angleDelta);
        });

        this.redraw();
    }

    deleteSelected() {
        if (!this.selectedIndices.length) return;
        this._pushHistory();

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
