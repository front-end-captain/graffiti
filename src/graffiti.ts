import { Bezier } from "./bezier";
import { BasicPoint, Point } from "./point";

interface Options {
  backgroundImageURL: string;
}

interface PointGroup {
  color: string;
  points: BasicPoint[];
}

class Graffito {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private mouseButtonDown: boolean;
  private backgroundColor: string;
  private pencilColor: string;
  private backgroundImageURL?: string;
  private backgroundImage: HTMLImageElement | null;
  private minWidth: number;
  private maxWidth: number;
  private isCanvasClear: boolean;
  private dotSize: number;
  private data: PointGroup[];
  private lastPoints: Point[];
  private lastVelocity: number;
  private lastWidth: number;
  private minDistance: number;
  private velocityFilterWeight: number;
  private mode: "line" | "arrow";

  constructor(canvas: HTMLCanvasElement, options: Options) {
    const _context = canvas.getContext("2d");

    if (!_context) {
      throw new Error("get canvas context error");
    }

    this.canvas = canvas;

    this.context = _context;

    this.backgroundImageURL = options.backgroundImageURL;
    this.backgroundImage = null;

    this.mouseButtonDown = false;
    this.backgroundColor = "#fff";
    this.pencilColor = "#333333";
    this.minWidth = 1;
    this.maxWidth = 3;
    this.dotSize = (this.minWidth + this.maxWidth) / 2;
    this.data = [];
    this.minDistance = 5;
    this.velocityFilterWeight = 0.7;
    this.isCanvasClear = true;
    this.lastPoints = [];
    this.lastVelocity = 0;
    this.lastWidth = 0;
    this.mode = "line";

    this.clear();

    this.bindEvent();

    this.fromDataURL(this.backgroundImageURL);
  }

  private clear() {
    this.context.fillStyle = this.backgroundColor;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.backgroundImage) {
      this.context.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    }

    this.reset();
    this.data = [];
    this.isCanvasClear = true;
  }

  private bindEvent(): void {
    this.canvas.style.touchAction = "none";
    this.canvas.style.msTouchAction = "none";

    if (window.PointerEvent) {
      this.handlePointerEvents();
    } else {
      this.handleMouseEvents();

      if ("ontouchstart" in window) {
        // TODO handle touch event
      }
    }
  }

  public offEvent(): void {
    // Enable panning/zooming when touching canvas element
    this.canvas.style.touchAction = "auto";
    this.canvas.style.msTouchAction = "auto";

    this.canvas.removeEventListener("pointerdown", this.handleMouseDown);
    this.canvas.removeEventListener("pointermove", this.handleMouseMove);
    document.removeEventListener("pointerup", this.handleMouseUp);

    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  private fromDataURL(dataUrl: string, callback?: (error?: string | Event) => void): void {
    const image = new Image();

    image.onload = (): void => {
      let w = document.body.clientWidth;
      let h = document.body.clientHeight;

      if (image.width > image.height) {
        h = Number(((document.body.clientWidth / image.width) * image.height).toFixed(2));
      }

      if (image.width < document.body.clientWidth) {
        w = image.width;
        h = image.height;
      }

      this.canvas.width = w;
      this.canvas.height = h;

      this.context.drawImage(image, 0, 0, w, h);

      this.backgroundImage = image;

      if (callback) {
        callback();
      }
    };

    image.onerror = (error): void => {
      if (callback) {
        callback(error);
      }
    };

    image.src = `${dataUrl}?time=${new Date().valueOf()}`;
    image.setAttribute("crossOrigin", "anonymous");

    this.isCanvasClear = false;
  }

  private handleMouseDown = (event: MouseEvent): void => {
    // console.log("%cMouseDownEvent", "color: red", event);

    if (event.which === 1) {
      this.mouseButtonDown = true;
      this.strokeBegin(event);
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
    // console.log("%cMouseMoveEvent", "color: blue", event, this.mouseButtonDown);
    if (this.mouseButtonDown) {
      this.strokeUpdate(event);
    }
  };

  private handleMouseUp = (event: MouseEvent): void => {
    if (event.which === 1 && this.mouseButtonDown) {
      this.mouseButtonDown = false;
      // console.log("%cMouseUpEvent", "color: orange", event, this.mouseButtonDown);
      this.strokeEnd(event);
    }
  };

  private handlePointerEvents(): void {
    this.mouseButtonDown = false;

    this.canvas.addEventListener("pointerdown", this.handleMouseDown);
    this.canvas.addEventListener("pointermove", this.handleMouseMove);
    document.addEventListener("pointerup", this.handleMouseUp);
  }

  private handleMouseEvents(): void {
    this.mouseButtonDown = false;

    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  private reset(): void {
    this.lastPoints = [];
    this.lastVelocity = 0;
    this.lastWidth = (this.minWidth + this.maxWidth) / 2;
    this.context.fillStyle = this.pencilColor;
  }

  private calculateCurveWidths(startPoint: Point, endPoint: Point): { start: number; end: number } {
    const velocity =
      this.velocityFilterWeight * endPoint.velocityFrom(startPoint) +
      (1 - this.velocityFilterWeight) * this.lastVelocity;

    const newWidth = this.strokeWidth(velocity);

    const widths = {
      end: newWidth,
      start: this.lastWidth,
    };

    this.lastVelocity = velocity;
    this.lastWidth = newWidth;

    return widths;
  }

  private createPoint(x: number, y: number): Point {
    const rect = this.canvas.getBoundingClientRect();

    return new Point(x - rect.left, y - rect.top, new Date().getTime());
  }

  private addPoint(point: Point): Bezier | null {
    const { lastPoints } = this;

    lastPoints.push(point);

    if (lastPoints.length > 2) {
      // To reduce the initial lag make it work with 3 points
      // by copying the first point to the beginning.
      if (lastPoints.length === 3) {
        lastPoints.unshift(lastPoints[0]);
      }

      // _points array will always have 4 points here.
      const widths = this.calculateCurveWidths(lastPoints[1], lastPoints[2]);
      const curve = Bezier.fromPoints(lastPoints, widths);

      // Remove the first element from the list, so that there are no more than 4 points at any time.
      lastPoints.shift();

      return curve;
    }

    return null;
  }

  private strokeWidth(velocity: number): number {
    return Math.max(this.maxWidth / (velocity + 1), this.minWidth);
  }

  private strokeBegin(event: MouseEvent): void {
    const newPointGroup = {
      color: this.pencilColor,
      points: [],
    };

    this.data.push(newPointGroup);
    this.reset();
    this.strokeUpdate(event);
  }

  private strokeUpdate(event: MouseEvent): void {
    if (this.data.length === 0) {
      // This can happen if clear() was called while a signature is still in progress,
      // or if there is a race condition between start/update events.
      this.strokeBegin(event);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;

    const point = this.createPoint(x, y);
    const lastPointGroup = this.data[this.data.length - 1];
    const lastPoints = lastPointGroup.points;

    const lastPoint = lastPoints.length > 0 && lastPoints[lastPoints.length - 1];

    const isLastPointTooClose = lastPoint ? point.distanceTo(lastPoint) <= this.minDistance : false;

    const { color } = lastPointGroup;

    // Skip this point if it's too close to the previous one
    if (!lastPoint || !(lastPoint && isLastPointTooClose)) {
      const curve = this.addPoint(point);

      if (!lastPoint) {
        this.drawDot({ color, point });
      } else if (curve && this.mode === "line") {
        this.drawCurve({ color, curve });
      } else if (curve && this.mode === "arrow") {
        // eslint-disable-next-line no-console
        console.log("draw arrow");
      }

      lastPoints.push({
        time: point.time,
        x: point.x,
        y: point.y,
      });
    }
  }

  private strokeEnd(event: MouseEvent): void {
    this.strokeUpdate(event);
  }

  private drawCurveSegment(x: number, y: number, width: number): void {
    const ctx = this.context;

    ctx.moveTo(x, y);
    ctx.arc(x, y, width, 0, 2 * Math.PI, false);
    this.isCanvasClear = false;
  }

  private drawCurve({ color, curve }: { color: string; curve: Bezier }): void {
    const ctx = this.context;
    const widthDelta = curve.endWidth - curve.startWidth;
    // '2' is just an arbitrary number here. If only lenght is used, then
    // there are gaps between curve segments :/
    const drawSteps = Math.floor(curve.length()) * 2;

    ctx.beginPath();
    ctx.fillStyle = color;

    for (let i = 0; i < drawSteps; i += 1) {
      // Calculate the Bezier (x, y) coordinate for this step.
      const t = i / drawSteps;
      const tt = t * t;
      const ttt = tt * t;
      const u = 1 - t;
      const uu = u * u;
      const uuu = uu * u;

      let x = uuu * curve.startPoint.x;
      x += 3 * uu * t * curve.control1.x;
      x += 3 * u * tt * curve.control2.x;
      x += ttt * curve.endPoint.x;

      let y = uuu * curve.startPoint.y;
      y += 3 * uu * t * curve.control1.y;
      y += 3 * u * tt * curve.control2.y;
      y += ttt * curve.endPoint.y;

      const width = Math.min(curve.startWidth + ttt * widthDelta, this.maxWidth);
      this.drawCurveSegment(x, y, width);
    }

    ctx.closePath();
    ctx.fill();
  }

  private drawDot({ color, point }: { color: string; point: BasicPoint }): void {
    const ctx = this.context;
    const width = this.dotSize;

    ctx.beginPath();
    this.drawCurveSegment(point.x, point.y, width);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  public fromData(pointGroups: PointGroup[]): void {
    this.clear();

    this._fromData(
      pointGroups,
      ({ color, curve }) => this.drawCurve({ color, curve }),
      ({ color, point }) => this.drawDot({ color, point }),
    );

    this.data = pointGroups;
  }

  private _fromData(
    pointGroups: PointGroup[],
    drawCurve: Graffito["drawCurve"],
    drawDot: Graffito["drawDot"],
  ): void {
    for (const group of pointGroups) {
      const { color, points } = group;

      if (points.length > 1) {
        for (let j = 0; j < points.length; j += 1) {
          const basicPoint = points[j];
          const point = new Point(basicPoint.x, basicPoint.y, basicPoint.time);

          // All points in the group have the same color, so it's enough to set
          // penColor just at the beginning.
          this.pencilColor = color;

          if (j === 0) {
            this.reset();
          }

          const curve = this.addPoint(point);

          if (curve) {
            drawCurve({ color, curve });
          }
        }
      } else {
        this.reset();

        drawDot({
          color,
          point: points[0],
        });
      }
    }
  }

  public isCanvasEmpty(): boolean {
    return this.isCanvasClear;
  }

  public toDataUrl(type = "image/png", quality?: number): string {
    // TODO export svg(image/svg+xml)
    return this.canvas.toDataURL(type, quality);
  }

  public clearGraffito() {
    this.clear();
  }

  public setPencilColor(color: string) {
    if (this.data) {
      this.pencilColor = color;
    }
  }

  public setPencilSize(size: number) {
    this.maxWidth = size + 1;
    this.minWidth = size - 1;
    this.dotSize = (this.minWidth + this.maxWidth) / 2;
  }

  public setMode(mode: "line" | "arrow") {
    this.mode = mode;
  }

  public undo() {
    // TODO undo
  }

  public redo() {
    // TODO redo
  }
}

export { Graffito };
