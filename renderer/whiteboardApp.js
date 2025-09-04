const canvas = document.getElementById("whiteboard");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const canvasManager = new CanvasManager(canvas);
const eventManager = new EventManager(canvas, canvasManager, { isOverlay: false });
