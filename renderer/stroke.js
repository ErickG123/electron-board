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
}
