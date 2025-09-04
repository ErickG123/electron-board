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
    }

    setEnd(x, y) {
        this.endX = x;
        this.endY = y;
        if (this.type === "draw") this.points.push({ x, y });
    }

    draw(ctx, offsetX = 0, offsetY = 0) {
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.lineCap = "round";
        ctx.beginPath();

        switch (this.type) {
            case "draw":
                if (this.points.length < 2) return;
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
            case "circle":
                const radius = Math.hypot(this.endX - this.startX, this.endY - this.startY);
                ctx.arc(this.startX + offsetX, this.startY + offsetY, radius, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case "line":
                ctx.moveTo(this.startX + offsetX, this.startY + offsetY);
                ctx.lineTo(this.endX + offsetX, this.endY + offsetY);
                ctx.stroke();
                break;
            case "text":
                ctx.font = `${this.width * 5}px Arial`;
                ctx.fillText(this.text, this.startX + offsetX, this.startY + offsetY);
                break;
        }
    }

    hitTest(x, y) {
        switch (this.type) {
            case "draw":
                for (let i = 0; i < this.points.length - 1; i++) {
                    if (pointLineDistance(x, y, this.points[i].x, this.points[i].y, this.points[i + 1].x, this.points[i + 1].y) <= this.width / 2)
                        return true;
                }
                break;
            case "rectangle":
                return x >= Math.min(this.startX, this.endX) &&
                    x <= Math.max(this.startX, this.endX) &&
                    y >= Math.min(this.startY, this.endY) &&
                    y <= Math.max(this.startY, this.endY);
            case "circle":
                const radius = Math.hypot(this.endX - this.startX, this.endY - this.startY);
                return Math.hypot(x - this.startX, y - this.startY) <= radius;
            case "line":
                return pointLineDistance(x, y, this.startX, this.startY, this.endX, this.endY) <= this.width / 2;
            case "text":
                const approxWidth = ctxMeasureText(this.text, this.width);
                const approxHeight = this.width * 5;
                return x >= this.startX && x <= this.startX + approxWidth &&
                    y >= this.startY - approxHeight && y <= this.startY;
        }
        return false;
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

function ctxMeasureText(text, fontSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.font = `${fontSize * 5}px Arial`;

    return ctx.measureText(text).width;
}
