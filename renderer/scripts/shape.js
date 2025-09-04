class Shape {
    constructor(type, color = "black", width = 2, startX = 0, startY = 0, text = "") {
        this.type = type;
        this.color = color;
        this.width = width;
        this.startX = startX;
        this.startY = startY;
        this.endX = startX;
        this.endY = startY;
        this.points = type === "draw" ? [{ x: startX, y: startY }] : [];

        this.text = text;
        this.textBoxWidth = 200;
        this.textBoxHeight = 0;

        this.rotation = 0;
    }

    setEnd(x, y) {
        this.endX = x;
        this.endY = y;
        if (this.type === "draw") this.points.push({ x, y });
    }

    moveBy(dx, dy) {
        this.startX += dx;
        this.startY += dx ? dy : dy;
        this.startX += 0;

        this.startX += 0;
        this.endX += dx;
        this.endY += dy;

        if (this.type === "draw") {
            this.points = this.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        }
    }

    rotateAround(cx, cy, angle) {
        this.rotation = (this.rotation || 0) + angle;

        const rotatePoint = (px, py) => {
            const dx = px - cx;
            const dy = py - cy;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rx = cx + dx * cos - dy * sin;
            const ry = cy + dx * sin + dy * cos;
            return { x: rx, y: ry };
        };

        if (this.type === "draw") {
            this.points = this.points.map(p => rotatePoint(p.x, p.y));
            if (this.points.length > 0) {
                this.startX = this.points[0].x;
                this.startY = this.points[0].y;
                const last = this.points[this.points.length - 1];
                this.endX = last.x;
                this.endY = last.y;
            }
        } else {
            const s = rotatePoint(this.startX, this.startY);
            const e = rotatePoint(this.endX, this.endY);

            this.startX = s.x; this.startY = s.y;
            this.endX = e.x; this.endY = e.y;
        }
    }

    static _rotatePoint(px, py, cx, cy, angle) {
        const dx = px - cx, dy = py - cy;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
    }

    getBounds() {
        switch (this.type) {
            case "draw": {
                if (!this.points || this.points.length === 0) return { x: this.startX, y: this.startY, w: 0, h: 0 };
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                this.points.forEach(p => {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                });
                const pad = this.width / 2;
                const box = { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };
                return this._boundsWithRotation(box);
            }

            case "rectangle": {
                const x0 = Math.min(this.startX, this.endX);
                const y0 = Math.min(this.startY, this.endY);
                const w = Math.abs(this.endX - this.startX);
                const h = Math.abs(this.endY - this.startY);
                return this._boundsWithRotation({ x: x0, y: y0, w, h });
            }

            case "circle": {
                const r = Math.hypot(this.endX - this.startX, this.endY - this.startY);
                return this._boundsWithRotation({ x: this.startX - r, y: this.startY - r, w: r * 2, h: r * 2 });
            }

            case "line": {
                const minX = Math.min(this.startX, this.endX);
                const minY = Math.min(this.startY, this.endY);
                const maxX = Math.max(this.startX, this.endX);
                const maxY = Math.max(this.startY, this.endY);
                const pad = this.width / 2;
                return this._boundsWithRotation({ x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 });
            }

            case "text": {
                const w = this.textBoxWidth;
                const h = this.textBoxHeight || (this.width * 6);
                return this._boundsWithRotation({ x: this.startX, y: this.startY, w, h });
            }
        }
        return { x: this.startX, y: this.startY, w: Math.abs(this.endX - this.startX), h: Math.abs(this.endY - this.startY) };
    }

    _boundsWithRotation(box) {
        const cx = box.x + box.w / 2;
        const cy = box.y + box.h / 2;
        const corners = [
            { x: box.x, y: box.y },
            { x: box.x + box.w, y: box.y },
            { x: box.x + box.w, y: box.y + box.h },
            { x: box.x, y: box.y + box.h }
        ];
        if (!this.rotation) return box;
        const rcorners = corners.map(pt => Shape._rotatePoint(pt.x, pt.y, cx, cy, this.rotation));
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        rcorners.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    drawSelection(ctx, offsetX = 0, offsetY = 0, handleSize = 8) {
        const bounds = this.getBounds();
        const x = bounds.x + offsetX, y = bounds.y + offsetY, w = bounds.w, h = bounds.h;
        if (w <= 0 && h <= 0) return;

        const centerX = x + w / 2;
        const centerY = y + h / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation || 0);
        ctx.translate(-centerX, -centerY);

        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#1E90FF';
        ctx.strokeRect(x, y, w, h);
        ctx.restore();

        const localHandles = [
            { name: 'nw', x: x, y: y },
            { name: 'n', x: x + w / 2, y: y },
            { name: 'ne', x: x + w, y: y },
            { name: 'e', x: x + w, y: y + h / 2 },
            { name: 'se', x: x + w, y: y + h },
            { name: 's', x: x + w / 2, y: y + h },
            { name: 'sw', x: x, y: y + h },
            { name: 'w', x: x, y: y + h / 2 }
        ];

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        localHandles.forEach(hpos => {
            ctx.beginPath();
            ctx.rect(hpos.x - handleSize / 2, hpos.y - handleSize / 2, handleSize, handleSize);
            ctx.fill();
            ctx.stroke();
        });

        const rotHandleY = y - 20;
        ctx.beginPath();
        ctx.arc(x + w / 2, rotHandleY, handleSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        ctx.save();

        const bounds = this.getBounds();
        const centerX = bounds.x + bounds.w / 2 + offsetX;
        const centerY = bounds.y + bounds.h / 2 + offsetY;

        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation || 0);
        ctx.translate(-centerX, -centerY);

        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = "round";

        switch (this.type) {
            case "draw":
                if (!this.points || this.points.length < 2) break;
                ctx.beginPath();
                ctx.moveTo(this.points[0].x + offsetX, this.points[0].y + offsetY);
                for (let i = 1; i < this.points.length; i++) {
                    ctx.lineTo(this.points[i].x + offsetX, this.points[i].y + offsetY);
                }
                ctx.stroke();
                break;

            case "rectangle":
                ctx.strokeRect(
                    this.startX + offsetX,
                    this.startY + offsetY,
                    this.endX - this.startX,
                    this.endY - this.startY
                );
                break;

            case "circle": {
                const radius = Math.hypot(this.endX - this.startX, this.endY - this.startY);
                ctx.beginPath();
                ctx.arc(this.startX + offsetX, this.startY + offsetY, radius, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            }

            case "line":
                ctx.beginPath();
                ctx.moveTo(this.startX + offsetX, this.startY + offsetY);
                ctx.lineTo(this.endX + offsetX, this.endY + offsetY);
                ctx.stroke();
                break;

            case "text": {
                ctx.font = `${this.width * 5}px Arial`;
                ctx.textBaseline = 'top';
                ctx.fillStyle = this.color;

                const words = this.text.split(' ');
                let line = '';
                let y = this.startY + offsetY;
                const lineHeight = this.width * 6;
                this.textBoxHeight = 0;
                const maxWidth = this.textBoxWidth;

                for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i] + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && line !== '') {
                        ctx.fillText(line, this.startX + offsetX, y);
                        line = words[i] + ' ';
                        y += lineHeight;
                        this.textBoxHeight += lineHeight;
                    } else {
                        line = testLine;
                    }
                }

                ctx.fillText(line, this.startX + offsetX, y);
                this.textBoxHeight += lineHeight;
                break;
            }
        }

        ctx.restore();
    }

    hitTest(x, y) {
        const bounds = this.getBounds();
        const cx = bounds.x + bounds.w / 2;
        const cy = bounds.y + bounds.h / 2;
        const angle = this.rotation || 0;

        const inv = Shape._rotatePoint(x, y, cx, cy, -angle);

        const lx = inv.x, ly = inv.y;

        switch (this.type) {
            case "draw":
                for (let i = 0; i < this.points.length - 1; i++) {
                    if (pointLineDistance(lx, ly, this.points[i].x, this.points[i].y, this.points[i + 1].x, this.points[i + 1].y) <= this.width / 2)
                        return true;
                }
                break;

            case "rectangle":
                return lx >= Math.min(this.startX, this.endX) &&
                    lx <= Math.max(this.startX, this.endX) &&
                    ly >= Math.min(this.startY, this.endY) &&
                    ly <= Math.max(this.startY, this.endY);

            case "circle": {
                const radius = Math.hypot(this.endX - this.startX, this.endY - this.startY);
                return Math.hypot(lx - this.startX, ly - this.startY) <= radius;
            }

            case "line":
                return pointLineDistance(lx, ly, this.startX, this.startY, this.endX, this.endY) <= this.width / 2;

            case "text":
                return lx >= this.startX && lx <= this.startX + this.textBoxWidth &&
                    ly >= this.startY && ly <= this.startY + this.textBoxHeight;
        }

        return false;
    }

    hitTestHandle(screenX, screenY, offsetX = 0, offsetY = 0, handleSize = 10) {
        const bounds = this.getBounds();
        const x = bounds.x + offsetX, y = bounds.y + offsetY, w = bounds.w, h = bounds.h;
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

        const cx = x + w / 2;
        const cy = y + h / 2;
        const angle = this.rotation || 0;

        const transformed = handles.map(hp => {
            const pt = Shape._rotatePoint(hp.x, hp.y, cx, cy, angle);
            return { name: hp.name, x: pt.x, y: pt.y };
        });

        for (let hpos of transformed) {
            if (screenX >= hpos.x - handleSize / 2 && screenX <= hpos.x + handleSize / 2 &&
                screenY >= hpos.y - handleSize / 2 && screenY <= hpos.y + handleSize / 2) {
                return hpos.name;
            }
        }

        const topCenter = Shape._rotatePoint(x + w / 2, y - 20, cx, cy, angle);
        const hx = topCenter.x, hy = topCenter.y;
        if (screenX >= hx - handleSize && screenX <= hx + handleSize && screenY >= hy - handleSize && screenY <= hy + handleSize) {
            return 'rotate';
        }

        return null;
    }
}

function pointLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = len_sq !== 0 ? dot / len_sq : -1;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    return Math.hypot(px - xx, py - yy);
}
