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

        switch (this.type) {
            case "draw":
                if (this.points.length < 2) return;
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

            case "circle":
                const radius = Math.hypot(this.endX - this.startX, this.endY - this.startY);
                ctx.beginPath();
                ctx.arc(this.startX + offsetX, this.startY + offsetY, radius, 0, 2 * Math.PI);
                ctx.stroke();
                break;

            case "line":
                ctx.beginPath();
                ctx.moveTo(this.startX + offsetX, this.startY + offsetY);
                ctx.lineTo(this.endX + offsetX, this.endY + offsetY);
                ctx.stroke();
                break;

            case "text":
                ctx.font = `${this.width * 5}px Arial`;
                ctx.textBaseline = "top";
                ctx.fillStyle = this.color;

                const words = this.text.split(" ");
                let line = "";
                let y = this.startY + offsetY;
                const lineHeight = this.width * 6;
                this.textBoxHeight = 0;
                const maxWidth = this.textBoxWidth;

                for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i] + " ";
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && line !== "") {
                        ctx.fillText(line, this.startX + offsetX, y);
                        line = words[i] + " ";
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
                return x >= this.startX && x <= this.startX + this.textBoxWidth &&
                    y >= this.startY && y <= this.startY + this.textBoxHeight;
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
