import { Arrow } from "./arrow";
import { Curve } from "./curve";
import { Text } from "./text";
import { Point } from "./point";

type Mode = "curve" | "arrow" | "text";

export type DrawDataGroup = Arrow | Curve | Text;

export interface GraffitoInitOptions {
  backgroundImageURL: string;
  backgroundColor?: string;
  curveColor?: string;
  curveSize?: number;
  arrowColor?: string;
  arrowSize?: number;
  onSelectText?: (text: string, index: number) => void;
  onDrawEnd?: (drawData: DrawDataGroup[], canUndo: boolean, canRedo: boolean) => void;
  mode?: Mode;
}

type BackgroundImage = {
  image?: HTMLImageElement;
  url: string;
  angle: number;
};

class Graffito {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private cacheCanvas: HTMLCanvasElement;

  private mode: Mode | undefined;
  private backgroundImage: BackgroundImage;

  private readonly options: GraffitoInitOptions;

  private curveColor: string;
  private curveSize: number;

  private arrowColor: string;
  private arrowSize: number;

  private isMouseDown: boolean;

  private fullDrawData: DrawDataGroup[];
  private currentDrawData: DrawDataGroup[];

  constructor(canvas: HTMLCanvasElement, options: GraffitoInitOptions) {
    const _context = canvas.getContext("2d");
    if (!_context) {
      throw new Error("get canvas context error");
    }

    this.cacheCanvas = document.createElement("canvas");

    this.options = options;

    this.canvas = canvas;
    this.context = _context;

    this.mode = options.mode;
    this.isMouseDown = false;

    this.backgroundImage = {
      url: options.backgroundImageURL,
      angle: 0,
    };

    this.curveColor = options.curveColor || "#fff";
    this.curveSize = options.curveSize || 2;

    this.arrowColor = options.arrowColor || "#fff";
    this.arrowSize = options.arrowSize || 2;

    this.fullDrawData = [];
    this.currentDrawData = [];

    this.bindEvent();

    this.fromDataURL(this.backgroundImage);
  }

  private clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.backgroundImage.image) {
      this.context.drawImage(
        this.backgroundImage.image,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
    }
  }

  private bindEvent(): void {
    this.canvas.style.touchAction = "none";
    this.canvas.style.msTouchAction = "none";

    if (window.PointerEvent) {
      this.handlePointerEvents();
    } else {
      this.handleMouseEvents();

      if ("ontouchstart" in window) {
        this.handleTouchEvents();
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

  private fromDataURL(
    backgroundImag: BackgroundImage,
    callback?: (error?: string | Event) => void,
  ): void {
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

      this.cacheCanvas.width = w;
      this.cacheCanvas.height = h;

      this.context.drawImage(image, 0, 0, w, h);

      this.backgroundImage = {
        ...backgroundImag,
        image,
      };

      if (callback) {
        callback();
      }
    };

    image.onerror = (error): void => {
      if (callback) {
        callback(error);
      }
    };

    image.setAttribute("crossOrigin", "anonymous");
    image.src = `${backgroundImag.url}?time=${new Date().valueOf()}`;
  }

  private createPoint(x: number, y: number) {
    const rect = this.canvas.getBoundingClientRect();

    return new Point(x - rect.left, y - rect.top);
  }

  private strokeCurveBegin(event: MouseEvent | Touch) {
    // console.log("%cStrokeBegin", "color: red", event);

    if (!this.mode) {
      return;
    }

    const curve = new Curve(this.context, { color: this.curveColor, size: this.curveSize });
    curve.addPoint(this.createPoint(event.clientX, event.clientY));

    this.currentDrawData.push(curve);
    this.fullDrawData = this.currentDrawData;

    // console.log(this.currentDrawData);

    this.strokeCurveUpdate(event);
  }

  private strokeCurveUpdate(event: MouseEvent | Touch) {
    // console.log("%cStrokeUpdate", "color: red", event);

    const point = this.createPoint(event.clientX, event.clientY);

    const lastCurve = this.currentDrawData[this.currentDrawData.length - 1];

    // console.log(lastCurve);

    const { points } = lastCurve as Curve;
    const lastPoint = points[points.length - 1];

    (lastCurve as Curve).drawCurve(point, lastPoint);

    (lastCurve as Curve).addPoint(point);
  }

  private strokeCurveEnd(event: MouseEvent | Touch) {
    // console.log("%cStrokeEnd", "color: red", event);
    this.strokeCurveUpdate(event);

    if (this.options.onDrawEnd) {
      this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
    }
  }

  private strokeArrowBegin(event: MouseEvent | Touch) {
    if (!this.mode) {
      return;
    }

    const arrow = new Arrow(this.context, { color: this.arrowColor, size: this.arrowSize });
    arrow.addPoint(this.createPoint(event.clientX, event.clientY));

    this.currentDrawData.push(arrow);
    this.fullDrawData = this.currentDrawData;

    this.strokeArrowUpdate(event);
  }

  private strokeArrowUpdate(event: MouseEvent | Touch) {
    const point = this.createPoint(event.clientX, event.clientY);
    const lastArrow = this.currentDrawData[this.currentDrawData.length - 1];
    const { points } = lastArrow as Arrow;
    const firstPoint = points[0];

    window.requestAnimationFrame(() => {
      (lastArrow as Arrow).drawArrow(firstPoint, point);
      (lastArrow as Curve).addPoint(point);

      this.clear();

      this._fromData(this.currentDrawData);
    });
  }

  private strokeArrowEnd(event: MouseEvent | Touch) {
    this.strokeArrowUpdate(event);

    if (this.options.onDrawEnd) {
      this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
    }
  }

  private handleMouseDown = (event: MouseEvent): void => {
    if (this.mode === null) {
      return;
    }

    if (event.which === 1) {
      this.isMouseDown = true;
      if (this.mode === "curve") {
        this.strokeCurveBegin(event);
      }
      if (this.mode === "arrow") {
        this.strokeArrowBegin(event);
      }
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (this.isMouseDown) {
      if (this.mode === "curve") {
        this.strokeCurveUpdate(event);
      }
      if (this.mode === "arrow") {
        this.strokeArrowUpdate(event);
      }
    }
  };

  private handleMouseUp = (event: MouseEvent): void => {
    if (event.which === 1 && this.isMouseDown) {
      this.isMouseDown = false;
      if (this.mode === "curve") {
        this.strokeCurveEnd(event);
      }
      if (this.mode === "arrow") {
        this.strokeArrowEnd(event);
      }
    }
  };

  private handleTouchStart = (event: TouchEvent): void => {
    // Prevent scrolling.
    event.preventDefault();

    if (event.targetTouches.length === 1) {
      const touch = event.changedTouches[0];
      if (this.mode === "curve") {
        this.strokeCurveBegin(touch);
      }
      if (this.mode === "arrow") {
        this.strokeArrowBegin(touch);
      }
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    // Prevent scrolling.
    event.preventDefault();

    const touch = event.targetTouches[0];
    if (this.mode === "curve") {
      this.strokeCurveUpdate(touch);
    }
    if (this.mode === "arrow") {
      this.strokeArrowUpdate(touch);
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    const wasCanvasTouched = event.target === this.canvas;
    if (wasCanvasTouched) {
      event.preventDefault();

      const touch = event.changedTouches[0];
      if (this.mode === "curve") {
        this.strokeCurveEnd(touch);
      }
      if (this.mode === "arrow") {
        this.strokeArrowEnd(touch);
      }
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

  private handleTouchEvents(): void {
    this.canvas.addEventListener("touchstart", this.handleTouchStart);
    this.canvas.addEventListener("touchmove", this.handleTouchMove);
    this.canvas.addEventListener("touchend", this.handleTouchEnd);
  }

  private _fromData(drawDataGroup: DrawDataGroup[]) {
    if (drawDataGroup.length === 0) {
      return;
    }

    for (const drawData of drawDataGroup) {
      if (drawData instanceof Curve) {
        if (drawData.points.length > 1) {
          for (let j = 0; j < drawData.points.length; j += 1) {
            if (j < drawData.points.length - 1) {
              drawData.drawCurve(
                drawData.points[j],
                drawData.points[j + 1],
                drawData.color,
                drawData.size,
              );
            }
          }
        }
      }

      if (drawData instanceof Arrow) {
        if (drawData.points.length > 1) {
          drawData.drawArrow(
            drawData.points[0],
            drawData.points[drawData.points.length - 1],
            drawData.color,
            drawData.size,
          );
        }
      }

      if (drawData instanceof Text) {
        // TODO
      }
    }
  }

  public getCanUndo() {
    return this.currentDrawData.length > 0;
  }

  public getCanRedo() {
    return this.fullDrawData.length > this.currentDrawData.length;
  }

  public setCurveColor(color: string) {
    this.curveColor = color;
  }

  public setArrowColor(color: string) {
    this.arrowColor = color;
  }

  public setCurveSize(size: number) {
    this.curveSize = size;
  }

  public setArrowSize(size: number) {
    this.arrowSize = size;
  }

  public setMode(mode: Mode | undefined) {
    this.mode = mode;
  }

  public undo() {
    const _data = Array.from(this.currentDrawData);
    _data.pop();

    this.currentDrawData = _data;

    this.clear();

    this._fromData(this.currentDrawData);
  }

  public redo() {
    const _data = Array.from(this.currentDrawData);
    const willAddedDrawData = this.fullDrawData[_data.length];
    if (willAddedDrawData) {
      _data.push(willAddedDrawData);

      this.currentDrawData = _data;

      this.clear();

      this._fromData(this.currentDrawData);
    }
  }

  public toDataUrl(type = "image/png", quality?: number): string {
    // const _canvas = document.createElement("canvas");
    // _canvas.width = this.canvas.width;
    // _canvas.height = this.canvas.height;
    // const context = _canvas.getContext("2d");

    // if (context) {
    //   context.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height);
    //   const sortedDrawDataGroup = this.currentDrawData.sort((a, b) => a.type.localeCompare(b.type));
    //   this._fromData(context, sortedDrawDataGroup, true);
    // }

    return this.canvas.toDataURL(type, quality);
  }
}

export { Graffito };
