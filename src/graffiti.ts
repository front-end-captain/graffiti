import { Bezier } from "./bezier";
import { BasicPoint, Point } from "./point";

interface Options {
  backgroundImageURL: string;
  onSelectText?: (text: string) => void;
}

type DrawType = "line" | "arrow" | "text";

interface PointGroup<T = DrawType> {
  color: string;
  type: T;
  text: T extends "text" ? string : undefined;
  priority: number;
  width?: number;
  height?: number;
  points: BasicPoint[];
}

class Graffito {
  private upperContext: CanvasRenderingContext2D;
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private upperCanvas: HTMLCanvasElement;
  private mouseButtonDown: boolean;
  private backgroundColor: string;
  private pencilColor: string;
  private backgroundImageURL?: string;
  private backgroundImage: HTMLImageElement | null;
  private minWidth: number;
  private maxWidth: number;
  private isCanvasClear: boolean;
  private dotSize: number;
  private arrowSize: number;
  private data: PointGroup[];
  private lastPoints: Point[];
  private lastVelocity: number;
  private lastWidth: number;
  private minDistance: number;
  private velocityFilterWeight: number;
  private mode: DrawType;
  private currentSelectText: PointGroup | undefined;
  private options: Options;

  constructor(canvas: HTMLCanvasElement, upperCanvas: HTMLCanvasElement, options: Options) {
    const _context = canvas.getContext("2d");
    const _upperContext = upperCanvas.getContext("2d");

    if (!_context) {
      throw new Error("get lower canvas context error");
    }

    if (!_upperContext) {
      throw new Error("get upper canvas context error");
    }

    this.canvas = canvas;
    this.upperCanvas = upperCanvas;

    this.context = _context;
    this.upperContext = _upperContext;

    this.options = options;

    this.backgroundImageURL = options.backgroundImageURL;
    this.backgroundImage = null;

    this.mouseButtonDown = false;
    this.backgroundColor = "#fff";
    this.pencilColor = "#fff";
    this.minWidth = 1;
    this.maxWidth = 3;
    this.dotSize = (this.minWidth + this.maxWidth) / 2;
    this.arrowSize = 2;
    this.data = [];
    this.minDistance = 5;
    this.velocityFilterWeight = 0.7;
    this.isCanvasClear = true;
    this.lastPoints = [];
    this.lastVelocity = 0;
    this.lastWidth = 0;
    this.mode = "line";
    this.currentSelectText = undefined;
    this.clear();

    this.bindEvent();

    this.fromDataURL(this.backgroundImageURL);
  }

  private clear() {
    this.context.fillStyle = this.backgroundColor;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.upperContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.backgroundImage) {
      this.context.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    }

    this.reset();
    this.data = [];
    this.isCanvasClear = true;
  }

  private bindEvent(): void {
    this.upperCanvas.style.touchAction = "none";
    this.upperCanvas.style.msTouchAction = "none";

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
    this.upperCanvas.style.touchAction = "auto";
    this.upperCanvas.style.msTouchAction = "auto";

    this.upperCanvas.removeEventListener("pointerdown", this.handleMouseDown);
    this.upperCanvas.removeEventListener("pointermove", this.handleMouseMove);
    document.removeEventListener("pointerup", this.handleMouseUp);

    this.upperCanvas.removeEventListener("mousedown", this.handleMouseDown);
    this.upperCanvas.removeEventListener("mousemove", this.handleMouseMove);
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
      this.upperCanvas.width = w;
      this.upperCanvas.height = h;

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
    // 判断选中的是否是文字
    this.currentSelectText = this.isTapText(event);
    // console.log(this.currentSelectText);

    if (this.currentSelectText) {
      if (typeof this.options.onSelectText === "function") {
        this.options.onSelectText(this.currentSelectText.text || "");
      }
      return;
    }
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

    this.upperCanvas.addEventListener("pointerdown", this.handleMouseDown);
    this.upperCanvas.addEventListener("pointermove", this.handleMouseMove);
    document.addEventListener("pointerup", this.handleMouseUp);
  }

  private handleMouseEvents(): void {
    this.mouseButtonDown = false;

    this.upperCanvas.addEventListener("mousedown", this.handleMouseDown);
    this.upperCanvas.addEventListener("mousemove", this.handleMouseMove);
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
    const newPointGroup: PointGroup = {
      color: this.pencilColor,
      type: this.mode,
      points: [],
      priority: 1,
      text: "",
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
        if (this.mode === "line") {
          this.drawDot({ color, point });
        }
      } else if (curve && this.mode === "line") {
        this.drawCurve({ color, curve });
      } else if (curve && this.mode === "arrow") {
        // eslint-disable-next-line no-console
        this.data[this.data.length - 1].points = [
          lastPoints[0],
          { time: point.time, x: point.x, y: point.y },
        ];
        this.renderAll();
      }

      lastPoints.push({
        time: point.time,
        x: point.x,
        y: point.y,
      });
    }
  }

  private drawArrow(firstPoint: BasicPoint, lastPoint: BasicPoint, color = "#fff") {
    const ctx = this.context;
    const theta = 30; // 三角斜边一直线夹角
    const headlen = 10; // 三角斜边长度
    const width = this.arrowSize; // 箭头线宽度
    const fromX = firstPoint.x;
    const fromY = firstPoint.y;
    const toX = lastPoint.x;
    const toY = lastPoint.y;

    // 计算各角度和对应的P2,P3坐标
    const angle = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI,
      angle1 = ((angle + theta) * Math.PI) / 180,
      angle2 = ((angle - theta) * Math.PI) / 180,
      topX = headlen * Math.cos(angle1),
      topY = headlen * Math.sin(angle1),
      botX = headlen * Math.cos(angle2),
      botY = headlen * Math.sin(angle2);

    ctx.save();
    ctx.beginPath();

    let arrowX = fromX - topX,
      arrowY = fromY - topY;

    ctx.moveTo(arrowX, arrowY);
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    arrowX = toX + topX;
    arrowY = toY + topY;
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(toX, toY);
    arrowX = toX + botX;
    arrowY = toY + botY;
    ctx.lineTo(arrowX, arrowY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  }

  private renderAll(): void {
    const initData = [...this.data];
    this.clear();
    this.data = initData;
    const textArr = this.data.filter((pointGroup) => {
      const { points, color, type } = pointGroup;

      if (type === "arrow") {
        this.drawArrow(points[0], points[1], color);
      } else if (type === "text") {
        return pointGroup;
      } else {
        points.map((point) => {
          const curve = this.addPoint(this.createPoint(point.x, point.y));
          if (curve) {
            this.drawCurve({ color, curve });
          }
        });
        this.lastPoints = [];
      }
      return false;
    });

    textArr.forEach((pointGroup) => {
      const { points, color, text = "" } = pointGroup;
      this.drawText(text, color, points[0].x, points[0].y);
    });
  }

  renderAllText() {
    const context = this.upperContext;
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.data.forEach((pointGroup) => {
      const { points, color, type, text = "" } = pointGroup;
      if (type === "text") {
        this.drawText(text, color, points[0].x, points[0].y);
      }
    });
  }

  private isTapText(event: MouseEvent): PointGroup | undefined {
    const _x: number = event.clientX;
    const _y: number = event.clientY;

    const texts = this.data.filter((pointGroup) => {
      if (pointGroup.text) {
        const { x, y } = pointGroup.points[0];
        const { width = 0, height = 0 } = pointGroup;
        const x1 = x,
          y1 = y,
          x2 = x + width,
          y2 = y + height;

        return _x >= x1 && _x <= x2 && _y >= y1 && _y <= y2;
      }
      return false;
    });

    if (texts.length > 0) {
      const pointGroup = texts.pop();
      if (pointGroup) {
        const { x, y, time } = pointGroup.points[0];
        // 需要清除其他选矿
        if (!(this.currentSelectText && this.currentSelectText.points[0].time === time)) {
          const { width = 0, height = 0 } = pointGroup;
          this.renderAllText();
          this.drawHandler(x, y, width, height);
        }
      }

      return pointGroup;
    }
    return undefined;
  }

  private drawHandler(x: number, y: number, width: number, height: number) {
    const ctx = this.upperContext;
    ctx.save();
    ctx.strokeStyle = "blue";
    ctx.rect(x - 10, y - 20, width + 20, height + 20);
    ctx.stroke();
    ctx.restore();
  }

  public drawText(text: string, color: string, x: number, y: number): void {
    this.mode = "text";

    if (text === "") return;

    const context = this.upperContext;

    context.font = "30px bold 黑体";
    context.fillStyle = color;
    context.textAlign = "left";
    context.textBaseline = "middle";

    const singleWidth = context.measureText(text[0]).width;
    const len = text.length;
    const max = this.canvas.width - 40; // 每行最长
    const num = Math.floor(max / singleWidth); // 每一行最多的个数
    const arr = [];

    let last = 0,
      width = 0,
      height = 0;

    while (last < len) {
      height += singleWidth + 2;
      arr.push(text.slice(last, last + num));
      last = last + num;
    }

    if (height === singleWidth + 2) {
      width = singleWidth * text.length;
    } else {
      width = singleWidth * num;
    }

    arr.forEach((t, i) => {
      context.fillText(t, x, (singleWidth + 2) * i + y);
    });

    this.data.push({
      color,
      type: "text",
      text,
      priority: 2,
      width,
      height,
      points: [{ x, y, time: Date.now() }],
    });
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

    // const widthDelta = curve.endWidth - curve.startWidth;
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

      // const width = Math.min(curve.startWidth + ttt * widthDelta, this.maxWidth);
      this.drawCurveSegment(x, y, 2);
    }

    ctx.closePath();
    ctx.fill();
  }

  private drawDot({ color, point }: { color: string; point: BasicPoint }): void {
    const ctx = this.context;
    const width = this.dotSize;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
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

  public setArrowSize(size: number) {
    this.arrowSize = size;
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
