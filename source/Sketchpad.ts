export interface SketchpadInitOptions {
  backgroundImageURL: string;
  backgroundColor?: string;
  curveColor?: string;
  curveSize?: number;
  arrowColor?: string;
  arrowSize?: number;
}

type Mode = "curve" | "arrow" | "text";

interface BasicPoint {
  x: number;
  y: number;
  time: number;
}

interface DrawDataGroup {
  color: string;
  type: Mode;
  text: string;
  size: number;
  width?: number;
  height?: number;
  startPoint: BasicPoint;
  endPoint: BasicPoint;
  points: BasicPoint[];
}

class Sketchpad {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private options: SketchpadInitOptions;

  private mode: Mode | null;

  private backgroundImageURL?: string;
  private backgroundImage: HTMLImageElement | null;

  private curveColor: string;
  private curveSize: number;

  private arrowColor: string;
  private arrowSize: number;

  private isMouseDown: boolean;

  private drawData: DrawDataGroup[];
  private currentDrawData: DrawDataGroup[];
  private _index: number;

  constructor(canvas: HTMLCanvasElement, options: SketchpadInitOptions) {
    const _context = canvas.getContext("2d");
    if (!_context) {
      throw new Error("get lower canvas context error");
    }

    this.canvas = canvas;
    this.context = _context;

    this.options = options;

    this.mode = null;

    this.isMouseDown = false;

    this.backgroundImageURL = options.backgroundImageURL;
    this.backgroundImage = null;

    this.curveColor = options.curveColor || "#fff";
    this.curveSize = options.curveSize || 1;

    this.arrowColor = options.arrowColor || "#fff";
    this.arrowSize = options.arrowSize || 1;

    this.drawData = [];
    this.currentDrawData = [];
    this._index = 0;

    this.clear();

    this.bindEvent();

    this.fromDataURL(this.backgroundImageURL);
  }

  private clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.backgroundImage) {
      this.context.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    }

    this.currentDrawData = [];
    this.drawData = [];
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
  }

  private strokeBegin(event: MouseEvent) {
    // console.log("%cStrokeBegin", "color: red", event);

    if (!this.mode) {
      return;
    }

    let color = "#fff";
    let size = 0;
    if (this.mode === "curve") {
      color = this.curveColor;
      size = this.curveSize;
    }
    if (this.mode === "arrow") {
      color = this.arrowColor;
      size = this.arrowSize;
    }

    const newDrawDataGroup: DrawDataGroup = {
      color,
      type: this.mode,
      text: "",
      size,
      startPoint: this.createPoint(event.clientX, event.clientY),
      endPoint: this.createPoint(event.clientX, event.clientY),
      points: [],
    };

    this.drawData.push(newDrawDataGroup);
    this.currentDrawData = this.drawData;

    this.strokeUpdate(event);
  }

  private strokeUpdate(event: MouseEvent) {
    // console.log("%cStrokeUpdate", "color: red", event);

    if (this.drawData.length === 0) {
      this.strokeBegin(event);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;

    const point = this.createPoint(x, y);

    const lastDrawDataGroup = this.drawData[this.drawData.length - 1];

    const { startPoint, endPoint, points: lastPoints, color, size } = lastDrawDataGroup;

    if (this.mode === "curve") {
      this.drawCurve(startPoint, point, color, size);
      lastPoints.push(point);
      lastDrawDataGroup.startPoint = endPoint;
      lastDrawDataGroup.endPoint = point;
    }

    if (this.mode === "arrow") {
      this.drawArrow(startPoint, point, color, size);
      lastPoints.push(point);
      // lastDrawDataGroup.startPoint = endPoint;
      // lastDrawDataGroup.endPoint = point;
      // // lastDrawDataGroup.startPoint = endPoint;

      // const drawData = Array.from(this.drawData);

      // this.clear();

      // this.drawData = drawData;

      // window.requestAnimationFrame(() => {
      //   this._fromData(
      //     drawData,
      //     (beginPoint, endPoint, color, size) => this.drawCurve(beginPoint, endPoint, color, size),
      //     (beginPoint, endPoint, color, size) => this.drawArrow(beginPoint, endPoint, color, size),
      //   );
      // });

    }
  }

  private strokeEnd(event: MouseEvent) {
    // console.log("%cStrokeEnd", "color: red", event);
    this.strokeUpdate(event);
  }

  private handleMouseDown = (event: MouseEvent): void => {
    // console.log("%cMouseDownEvent", "color: red", event);

    if ((event.target as HTMLCanvasElement).id === "graffiti") {
      if (this.mode === null) {
        return;
      }

      if (event.which === 1) {
        this.isMouseDown = true;
        this.strokeBegin(event);
      }
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
    // console.log("%cMouseMoveEvent", "color: blue", event, this.isMouseDown);
    if (this.isMouseDown) {
      this.strokeUpdate(event);
    }
  };

  private handleMouseUp = (event: MouseEvent): void => {
    if (event.which === 1 && this.isMouseDown) {
      this.isMouseDown = false;
      // console.log("%cMouseUpEvent", "color: orange", event, this.isMouseDown);
      this.strokeEnd(event);
    }
  };

  private handlePointerEvents(): void {
    this.isMouseDown = false;

    this.canvas.addEventListener("pointerdown", this.handleMouseDown);
    this.canvas.addEventListener("pointermove", this.handleMouseMove);
    document.addEventListener("pointerup", this.handleMouseUp);
  }

  private handleMouseEvents(): void {
    this.isMouseDown = false;

    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  private drawCurve(beginPoint: BasicPoint, endPoint: BasicPoint, color: string, size: number) {
    this.context.save();

    this.context.beginPath();
    this.context.lineCap = "round";
    this.context.lineWidth = size;
    this.context.lineJoin = "round";
    this.context.strokeStyle = color;
    this.context.moveTo(beginPoint.x, beginPoint.y);
    this.context.lineTo(endPoint.x, endPoint.y);
    this.context.stroke();
    this.context.closePath();
  }

  private drawArrow(beginPoint: BasicPoint, endPoint: BasicPoint, color: string, size: number) {
    const ctx = this.context;
    const theta = 30;
    const hypotenuse = 10;
    const width = size;
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

    ctx.save();
    ctx.beginPath();

    let arrowX = fromX - topX;
    let arrowY = fromY - topY;

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

  private drawText(text: string, color: string) {
    if (text === "") return;

    this.context.font = "30px PingFangSC-Semibold, PingFang SC";
    const { width } = this.context.measureText(text);

    const textBox = document.createElement("span");

    const right = this.canvas.width / 2 - (width + 25) / 2;

    textBox.innerText = text;
    textBox.style.color = color;
    textBox.style.right = `${right < 0 ? 10 : right}px`;
    textBox.style.top = `${this.canvas.height / 2 - 32 / 2}px`;
    textBox.style.maxWidth = `${this.canvas.width}px`;
    textBox.style.width = `${width > this.canvas.width ? this.canvas.width - 25 : width}px`;

    const textBoxWrapper = document.getElementById("text-box-wrapper");

    textBoxWrapper?.appendChild(textBox);

    this.drawData.push({
      color,
      type: "text",
      text,
      width,
      height: 32,
      size: 30,
      startPoint: { x: 20, y: 20, time: new Date().getTime() },
      endPoint: { x: 20, y: 20, time: new Date().getTime() },
      points: [],
    });
  }

  private createPoint(x: number, y: number): BasicPoint {
    const rect = this.canvas.getBoundingClientRect();

    return { x: x - rect.left, y: y - rect.top, time: new Date().getTime() };
  }

  private _fromData(
    drawDataGroup: DrawDataGroup[],
    drawCurve: Sketchpad["drawCurve"],
    drawArrow: Sketchpad["drawArrow"],
  ) {
    for (const drawData of drawDataGroup) {
      const { color, points, startPoint, endPoint, size } = drawData;

      if (points.length > 1) {
        for (let j = 0; j < points.length; j += 1) {
          drawCurve(points[j], points[j + 1], color, size);
        }
      } else {
        drawArrow(startPoint, endPoint, color, size);
      }
    }
  }

  public toDataUrl(type = "image/png", quality?: number): string {
    return this.canvas.toDataURL(type, quality);
  }

  public setMode(mode: Mode) {
    this.mode = mode;
  }

  public setCurveColor(color: string) {
    this.curveColor = color;
  }

  public setCurveSize(size: number) {
    this.curveSize = size;
  }

  public setArrowColor(color: string) {
    this.arrowColor = color;
  }

  public setArrowSize(size: number) {
    this.arrowSize = size;
  }

  public addText(text: string, color: string) {
    this.drawText(text, color);
  }
}

export { Sketchpad };
