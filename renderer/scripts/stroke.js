class Stroke {
    constructor(color = "black", width = 2) {
        this.points = [];
        this.color = color;
        this.width = width;
    }

    addPoint(x, y) {
        this.points.push({ x, y });
    }

    draw(ctx) {
        if (this.points.length < 2) return;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = "round";
        ctx.beginPath();

        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }

        ctx.stroke();
    }

    hitTest(x, y) {
        for (let i = 1; i < this.points.length; i++) {
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            const dist = pointLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);

            if (dist <= this.width / 2) return true;
        }

        return false;
    }
}

function pointLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
}
