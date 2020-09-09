import { Point } from "./point";

class Arrow {
  public name: string;
  public color: string;
  public size: number;
  public readonly points: Point[];
  private context: CanvasRenderingContext2D;
  public readonly id: number;

  constructor(context: CanvasRenderingContext2D, options: { color?: string; size?: number } = {}) {
    this.name = "arrow";

    this.color = options.color || "#fff";
    this.size = options.size || 2;

    this.context = context;

    this.points = [];

    this.id = Date.now();
  }

  public setSize(size: number) {
    this.size = size;
  }

  public setColor(color: string) {
    this.color = color;
  }

  public getFirstPoint() {
    return this.points[0];
  }

  public getLastPoint() {
    return this.points[this.points.length - 1];
  }

  public setContext(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  public addPoint(point: Point) {
    this.points.push(point);
  }

  public drawArrow(beginPoint: Point, endPoint: Point, color?: string, size?: number) {
    // TODO change `theta` and `hypotenuse` based on `size`
    const theta = 30;
    const hypotenuse = 10;
    const fromX = beginPoint.x;
    const fromY = beginPoint.y;

    const toX = endPoint.x;
    const toY = endPoint.y;

    const angle = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI;
    const angle1 = ((angle + theta) * Math.PI) / 180;
    const angle2 = ((angle - theta) * Math.PI) / 180;

    const topX = hypotenuse * Math.cos(angle1);
    const topY = hypotenuse * Math.sin(angle1);
    const botX = hypotenuse * Math.cos(angle2);
    const botY = hypotenuse * Math.sin(angle2);

    this.context.save();

    this.context.beginPath();

    let arrowX = fromX - topX;
    let arrowY = fromY - topY;

    this.context.moveTo(arrowX, arrowY);
    this.context.moveTo(fromX, fromY);
    this.context.lineTo(toX, toY);

    arrowX = toX + topX;
    arrowY = toY + topY;

    this.context.moveTo(arrowX, arrowY);
    this.context.lineTo(toX, toY);

    arrowX = toX + botX;
    arrowY = toY + botY;

    this.context.lineTo(arrowX, arrowY);

    this.context.strokeStyle = color || this.color;
    this.context.lineWidth = size || this.size;

    this.context.stroke();
    this.context.closePath();
    this.context.restore();
  }
}

export { Arrow };
