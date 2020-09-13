import HammerJs from "hammerjs";

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
  onSelectText?: (text: string, fontSize: number, color: string) => void;
  onDrawEnd?: (drawData: DrawDataGroup[], canUndo: boolean, canRedo: boolean) => void;
  mode?: Mode;
}

type BackgroundImage = {
  image?: HTMLImageElement;
  url: string;
  angle: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
};

class Graffito {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private cacheCanvas: HTMLCanvasElement;
  private cacheContext: CanvasRenderingContext2D;

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

  private Hammer: HammerManager;

  private currentTapedText: Text | null;

  private currentPanedText: Text | null;

  constructor(
    canvas: HTMLCanvasElement,
    cacheCanvas: HTMLCanvasElement,
    options: GraffitoInitOptions,
  ) {
    const _context = canvas.getContext("2d");
    const _cacheContext = cacheCanvas.getContext("2d");
    if (!_context) {
      throw new Error("get canvas context error");
    }

    if (!_cacheContext) {
      throw new Error("get cache canvas context error");
    }

    this.cacheCanvas = cacheCanvas;
    this.cacheContext = _cacheContext;

    this.canvas = canvas;
    this.context = _context;

    this.options = options;

    this.mode = options.mode;
    this.isMouseDown = false;

    this.backgroundImage = {
      url: options.backgroundImageURL,
      angle: 0,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
    };

    this.curveColor = options.curveColor || "#fff";
    this.curveSize = options.curveSize || 2;

    this.arrowColor = options.arrowColor || "#fff";
    this.arrowSize = options.arrowSize || 2;

    this.fullDrawData = [];
    this.currentDrawData = [];

    this.Hammer = new HammerJs(this.canvas);

    this.currentTapedText = null;
    this.currentPanedText = null;

    this.bindEvent();

    this.fromDataURL(this.backgroundImage);
  }

  private clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private bindEvent(): void {
    this.canvas.style.touchAction = "none";
    this.canvas.style.msTouchAction = "none";

    this.handlePanEvent();
    this.handleTapEvent();
    this.handleZoomCanvas();
  }

  public offEvent(): void {
    this.canvas.style.touchAction = "auto";
    this.canvas.style.msTouchAction = "auto";

    this.Hammer.off("panstart", this.handlePanStart);
    this.Hammer.off("panmove", this.handlePanMove);
    this.Hammer.off("panend", this.handlePanEnd);

    this.Hammer.off("tap", this.handleTapCanvas);
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

      this.cacheCanvas.width = w * window.devicePixelRatio;
      this.cacheCanvas.height = h * window.devicePixelRatio;
      this.cacheCanvas.style.width = `${w}px`;
      this.cacheCanvas.style.height = `${h}px`;
      this.cacheContext.scale(window.devicePixelRatio, window.devicePixelRatio);

      this.cacheContext.drawImage(image, 0, 0, w, h);

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

  private strokeCurveBegin(event: HammerInput) {
    // console.log("%cStrokeBegin", "color: red", event);

    if (!this.mode) {
      return;
    }

    if (this.currentPanedText) {
      return;
    }

    const curve = new Curve(this.context, { color: this.curveColor, size: this.curveSize });
    curve.addPoint(this.createPoint(event.center.x, event.center.y));

    this.currentDrawData.push(curve);
    this.fullDrawData = this.currentDrawData;

    this.strokeCurveUpdate(event);
  }

  private strokeCurveUpdate(event: HammerInput) {
    // console.log("%cStrokeUpdate", "color: red", event);

    const point = this.createPoint(event.center.x, event.center.y);

    const lastCurve = this.currentDrawData[this.currentDrawData.length - 1];

    const { points } = lastCurve as Curve;
    const lastPoint = points[points.length - 1];

    (lastCurve as Curve).drawCurve(point, lastPoint);

    (lastCurve as Curve).addPoint(point);
  }

  private strokeCurveEnd(event: HammerInput) {
    // console.log("%cStrokeEnd", "color: red", event);
    if (this.currentPanedText) {
      return;
    }

    this.strokeCurveUpdate(event);

    if (this.options.onDrawEnd) {
      this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
    }
  }

  private strokeArrowBegin(event: HammerInput) {
    if (!this.mode) {
      return;
    }

    if (this.currentPanedText) {
      return;
    }

    const arrow = new Arrow(this.context, { color: this.arrowColor, size: this.arrowSize });
    arrow.addPoint(this.createPoint(event.center.x, event.center.y));

    this.currentDrawData.push(arrow);
    this.fullDrawData = this.currentDrawData;

    this.strokeArrowUpdate(event);
  }

  private strokeArrowUpdate(event: HammerInput) {
    const point = this.createPoint(event.center.x, event.center.y);
    const lastArrow = this.currentDrawData[this.currentDrawData.length - 1];
    const { points } = lastArrow as Arrow;
    const firstPoint = points[0];

    window.requestAnimationFrame(() => {
      (lastArrow as Arrow).drawArrow(firstPoint, point);
      (lastArrow as Arrow).addPoint(point);

      this.clear();

      this.render(this.currentDrawData, this.context);
    });
  }

  private strokeArrowEnd(event: HammerInput) {
    if (this.currentPanedText) {
      return;
    }

    this.strokeArrowUpdate(event);

    if (this.options.onDrawEnd) {
      this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
    }
  }

  private strokeTextStart(event: HammerInput) {
    if (this.currentPanedText) {
      this.clear();

      this.currentPanedText.startX = event.center.x - (window.innerWidth - this.canvas.width) / 2;
      this.currentPanedText.startY = event.center.y - (window.innerHeight - this.canvas.height) / 2;

      this.strokeTextUpdate(event);
    }
  }

  private strokeTextUpdate(event: HammerInput) {
    if (this.currentPanedText) {
      const { startX, startY, width, height } = this.currentPanedText;

      const x = startX + event.deltaX - width / 2;
      const y = startY + event.deltaY - height / 2;

      this.currentPanedText.x = x;
      this.currentPanedText.y = y;

      window.requestAnimationFrame(() => {
        this.clear();
        this.render(this.currentDrawData, this.context);
      });

      if (event.type === "panend") {
        const outOfRight = this.canvas.width;
        const outOfBottom = this.canvas.height;

        const outOfTopOrBottom =
          this.currentPanedText.y < 0 ||
          this.currentPanedText.y + this.currentPanedText.height > outOfBottom;

        const outOfLeftOrRight =
          this.currentPanedText.x < 0 ||
          this.currentPanedText.x + this.currentPanedText.width > outOfRight;

        if (outOfLeftOrRight || outOfTopOrBottom) {
          this.currentPanedText.x = startX - width / 2;
          this.currentPanedText.y = startY - height / 2;

          this.clear();
          this.render(this.currentDrawData, this.context);
          return;
        }

        this.currentPanedText.startX = x;
        this.currentPanedText.startY = y;
        this.currentPanedText.x = x;
        this.currentPanedText.y = y;

        // this.currentPanedText = null;
      }
    }
  }

  private strokeTextEnd(event: HammerInput) {
    if (this.currentPanedText) {
      this.strokeTextUpdate(event);
    }
  }

  private handlePanStart = (event: HammerInput) => {
    // console.log("pan start", event, this.mode);
    if (!this.mode) {
      return;
    }

    this.isMouseDown = true;
    this.currentPanedText = null;

    const tapedTextBoxList: DrawDataGroup[] = [];

    this.currentDrawData.forEach((d) => {
      if (d instanceof Text) {
        const x = event.center.x - (window.innerWidth - this.canvas.width) / 2;
        const y = event.center.y - (window.innerHeight - this.canvas.height) / 2;

        const place = d.tapWhere(x, y);

        if (place) {
          tapedTextBoxList.push(d);
        }
      }
    });

    if (tapedTextBoxList.length > 0) {
      this.unActivityEveryText();

      this.currentPanedText = tapedTextBoxList[tapedTextBoxList.length - 1] as Text;
      this.currentPanedText.selected = true;

      if (this.currentPanedText.lastTapedPlace === "text") {
        this.strokeTextStart(event);
        return;
      }

      return;
    }

    if (this.mode === "curve" && !this.currentPanedText) {
      this.strokeCurveBegin(event);
      return;
    }
    if (this.mode === "arrow" && !this.currentPanedText) {
      this.strokeArrowBegin(event);
      return;
    }
  };

  private handlePanMove = (event: HammerInput) => {
    if (this.isMouseDown) {
      if (this.mode === "curve" && !this.currentPanedText) {
        this.strokeCurveUpdate(event);
        return;
      }
      if (this.mode === "arrow" && !this.currentPanedText) {
        this.strokeArrowUpdate(event);
        return;
      }
      if (this.currentPanedText) {
        if (this.currentPanedText.lastTapedPlace === "text") {
          this.strokeTextUpdate(event);
        }
      }
    }
  };

  private handlePanEnd = (event: HammerInput) => {
    // console.log("pan end",event);
    if (this.isMouseDown) {
      this.isMouseDown = false;
      if (this.mode === "curve" && !this.currentTapedText) {
        this.strokeCurveEnd(event);
        return;
      }
      if (this.mode === "arrow" && !this.currentTapedText) {
        this.strokeArrowEnd(event);
        return;
      }
      if (this.currentPanedText) {
        if (this.currentPanedText.lastTapedPlace === "text") {
          this.strokeTextEnd(event);
        }
      }
    }
  };

  private handlePanCancel = (event: HammerInput) => {
    // console.log("pan cancel",event);
    if (this.isMouseDown) {
      this.isMouseDown = false;
      if (this.mode === "curve" && !this.currentTapedText) {
        this.strokeCurveEnd(event);
        return;
      }
      if (this.mode === "arrow" && !this.currentTapedText) {
        this.strokeArrowEnd(event);
        return;
      }
      if (this.currentPanedText) {
        if (this.currentPanedText.lastTapedPlace === "text") {
          this.strokeTextEnd(event);
        }
      }
    }
  };

  private handlePanEvent() {
    this.isMouseDown = false;

    this.Hammer.on("panstart", this.handlePanStart);
    this.Hammer.on("panmove", this.handlePanMove);
    this.Hammer.on("panend", this.handlePanEnd);
    this.Hammer.on("pancancel", this.handlePanCancel);
  }

  private handleTapCanvas = (event: HammerInput) => {
    this.currentTapedText = null;

    const tapedTextBoxList: DrawDataGroup[] = [];
    this.currentDrawData.forEach((d) => {
      if (d instanceof Text) {
        const x = event.center.x - (window.innerWidth - this.canvas.width) / 2;
        const y = event.center.y - (window.innerHeight - this.canvas.height) / 2;

        const place = d.tapWhere(x, y);

        if (place) {
          tapedTextBoxList.push(d);
        }
      }
    });

    if (tapedTextBoxList.length > 0) {
      this.unActivityEveryText();

      this.currentTapedText = tapedTextBoxList[tapedTextBoxList.length - 1] as Text;

      if (this.currentTapedText.lastTapedPlace === "text") {
        if (typeof this.options.onSelectText === "function") {
          this.currentTapedText.selected = true;

          this.render(this.currentDrawData, this.context);

          this.options.onSelectText(
            this.currentTapedText.content,
            this.currentTapedText.fontSize,
            this.currentTapedText.color,
          );
        }
      }

      if (this.currentTapedText.lastTapedPlace === "delete") {
        this.currentDrawData = this.currentDrawData.filter((d) => {
          if (d instanceof Text) {
            if (d.id === this.currentTapedText?.id) {
              return false;
            }
          }
          return true;
        });

        this.fullDrawData = this.currentDrawData;

        // console.log(this.currentDrawData);

        this.clear();

        this.render(this.currentDrawData, this.context);

        this.currentTapedText = null;
      }
    } else {
      this.unActivityEveryText();
    }
  };

  private handleTapEvent() {
    this.Hammer.on("tap", this.handleTapCanvas);
  }

  private handleZoomCanvas() {
    this.Hammer.get("pinch").set({ enable: true });
    // this.Hammer.on("pinchstart", (e) => {
    //   console.log("pinchstart", e);
    // });
    // this.Hammer.on("pinchmove", (e) => {
    //   console.log("pinchmove", e);
    // });
    // this.Hammer.on("pinchend", (e) => {
    //   console.log("pinchend", e);
    // });
    // this.Hammer.on("pinchcancel", (e) => {
    //   console.log("pinchcancel", e);
    // });
  }

  private render(drawDataGroup: DrawDataGroup[], context?: CanvasRenderingContext2D) {
    if (drawDataGroup.length === 0) {
      this.clear();
      return;
    }

    for (const drawData of drawDataGroup) {
      if (drawData instanceof Curve) {
        if (context) {
          drawData.setContext(context);
        }
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
        if (context) {
          drawData.setContext(context);
        }
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
        if (context) {
          drawData.setContext(context);
        }
        drawData.drawText();
      }
    }
  }

  public addText(text: string, color: string, size: number) {
    const newText = new Text(this.context, this.canvas, { text, color, size });
    newText.selected = true;

    this.currentDrawData.push(newText);

    this.fullDrawData = this.currentDrawData;

    this.render(this.currentDrawData, this.context);

    if (this.options.onDrawEnd) {
      this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
    }

    // console.log(this.currentDrawData);
  }

  public editText(text: string, color: string, size: number) {
    if (this.currentTapedText) {
      this.clear();

      this.currentTapedText.selected = true;
      this.currentTapedText.color = color;
      this.currentTapedText.content = text;
      this.currentTapedText.fontSize = size;

      this.render(this.currentDrawData, this.context);

      if (this.options.onDrawEnd) {
        this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
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

    this.render(this.currentDrawData, this.context);
  }

  public redo() {
    const _data = Array.from(this.currentDrawData);
    const willAddedDrawData = this.fullDrawData[_data.length];

    if (willAddedDrawData) {
      _data.push(willAddedDrawData);

      this.currentDrawData = _data;

      this.clear();

      this.render(this.currentDrawData, this.context);
    }
  }

  public toDataUrl(type = "image/png", quality?: number): string {
    this.unActivityEveryText();

    const _canvas = document.createElement("canvas");
    _canvas.width = this.canvas.width;
    _canvas.height = this.canvas.height;
    const context = _canvas.getContext("2d");

    const { image } = this.backgroundImage;

    if (context && image) {
      context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
      this.render(this.currentDrawData, context);
    }

    return _canvas.toDataURL(type, quality);
  }

  public unActivityEveryText() {
    this.clear();

    this.currentDrawData.forEach((d) => {
      if (d instanceof Text) {
        // eslint-disable-next-line no-param-reassign
        d.selected = false;
      }
    });

    this.render(this.currentDrawData, this.context);
  }

  public rotateBg() {
    const { image, angle } = this.backgroundImage;

    if (!image) {
      return;
    }

    let _angle = angle;

    let _width = image.width;
    let _height = image.height;

    let canvasWidth = 0;
    let canvasHeight = 0;

    let k1 = 0;
    let k2 = 0;

    _angle += 90;

    if (_angle === 360) {
      _angle = 0;
    }

    if (_angle === 90 || _angle === 270) {
      _width = image.height;
      _height = image.width;
    }

    k1 = document.body.clientWidth / _width;
    k2 = document.body.clientHeight / _height;

    const minK = Math.min(k1, k2);

    if (minK < 1) {
      canvasWidth = minK * _width;
      canvasHeight = minK * _height;
    } else {
      canvasWidth = _width;
      canvasHeight = _height;
    }

    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    this.cacheCanvas.width = canvasWidth * window.devicePixelRatio;
    this.cacheCanvas.height = canvasHeight * window.devicePixelRatio;
    this.cacheCanvas.style.width = `${canvasWidth}px`;
    this.cacheCanvas.style.height = `${canvasHeight}px`;
    this.cacheContext.scale(window.devicePixelRatio, window.devicePixelRatio);

    let translateX = 0;
    let translateY = 0;
    let dx = 0;
    let dy = 0;

    if (_angle === 90) {
      translateY = canvasHeight;
      dx = canvasHeight;
      dy = canvasWidth;
    }

    if (_angle === 180) {
      translateX = canvasWidth;
      translateY = canvasHeight;
      dx = canvasWidth;
      dy = canvasHeight;
    }

    if (_angle === 270) {
      translateX = canvasWidth;
      dx = canvasHeight;
      dy = canvasWidth;
    }

    if (_angle === 0) {
      dx = canvasWidth;
      dy = canvasHeight;
    }

    this.context.save();
    this.cacheContext.save();

    this.context.translate(translateX, translateY);
    this.cacheContext.translate(translateX, translateY);

    this.context.rotate((-_angle * Math.PI) / 180);
    this.cacheContext.rotate((-_angle * Math.PI) / 180);

    this.cacheContext.drawImage(image, 0, 0, dx, dy);

    this.context.restore();
    this.cacheContext.restore();

    this.backgroundImage = { ...this.backgroundImage, angle: _angle, dx, dy };

    this.render(this.currentDrawData, this.context);
  }

  public getDrawData() {
    return this.currentDrawData;
  }
}

export { Graffito };
