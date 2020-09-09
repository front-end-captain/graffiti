import { Point } from "./point";

interface CurveOptions {
  color?: string;
  size?: number;
}

class Curve {
  public color: string;
  public size: number;
  public readonly points: Point[];
  public readonly name: string;
  private context: CanvasRenderingContext2D;
  private readonly id: number;

  constructor(context: CanvasRenderingContext2D, options: CurveOptions = {}) {
    this.context = context;

    this.color = options.color || "#fff";
    this.size = options.size || 2;

    this.name = "curve";

    this.points = [];

    this.id = Date.now();
  }

  public setSize(size: number) {
    this.size = size;
  }

  public setColor(color: string) {
    this.color = color;
  }

  public addPoint(point: Point) {
    this.points.push(point);
  }

  public setContext(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  public drawCurve(beginPoint: Point, endPoint: Point, color?: string, size?: number) {
    this.context.save();

    this.context.beginPath();

    this.context.lineCap = "round";
    this.context.lineWidth = size || this.size;
    this.context.lineJoin = "round";

    this.context.strokeStyle = color || this.color;
    this.context.moveTo(beginPoint.x, beginPoint.y);
    this.context.lineTo(endPoint.x, endPoint.y);

    this.context.stroke();

    this.context.closePath();

    this.context.restore();
  }
}

export { Curve };
