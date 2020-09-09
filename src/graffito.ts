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
  onSelectText?: (text: string) => void;
  onDrawEnd?: (drawData: DrawDataGroup[], canUndo: boolean, canRedo: boolean) => void;
  mode?: Mode;
}

type BackgroundImage = {
  image?: HTMLImageElement;
  url: string;
  angle: number;
  x: number;
  y: number;
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
  private HammerCache: HammerManager;

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

    this.options = options;

    this.canvas = canvas;
    this.context = _context;

    this.mode = options.mode;
    this.isMouseDown = false;

    this.backgroundImage = {
      url: options.backgroundImageURL,
      angle: 0,
      x: 0,
      y: 0,
    };

    this.curveColor = options.curveColor || "#fff";
    this.curveSize = options.curveSize || 2;

    this.arrowColor = options.arrowColor || "#fff";
    this.arrowSize = options.arrowSize || 2;

    this.fullDrawData = [];
    this.currentDrawData = [];

    this.Hammer = new HammerJs(this.canvas);
    this.HammerCache = new HammerJs(this.cacheCanvas);

    this.currentTapedText = null;
    this.currentPanedText = null;

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

  private clearCache() {
    this.cacheContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cacheContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.backgroundImage.image) {
      this.cacheContext.drawImage(
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

    this.handlePanEvent();
    this.handleTapEvent();
  }

  public offEvent(): void {
    // Enable panning/zooming when touching canvas element
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

  private strokeCurveBegin(event: HammerInput) {
    // console.log("%cStrokeBegin", "color: red", event);

    if (!this.mode) {
      return;
    }

    const curve = new Curve(this.context, { color: this.curveColor, size: this.curveSize });
    curve.addPoint(this.createPoint(event.center.x, event.center.y));

    this.currentDrawData.push(curve);
    this.fullDrawData = this.currentDrawData;

    // console.log(this.currentDrawData);

    this.strokeCurveUpdate(event);
  }

  private strokeCurveUpdate(event: HammerInput) {
    // console.log("%cStrokeUpdate", "color: red", event);

    const point = this.createPoint(event.center.x, event.center.y);

    const lastCurve = this.currentDrawData[this.currentDrawData.length - 1];

    // console.log(lastCurve);

    const { points } = lastCurve as Curve;
    const lastPoint = points[points.length - 1];

    (lastCurve as Curve).drawCurve(point, lastPoint);

    (lastCurve as Curve).addPoint(point);
  }

  private strokeCurveEnd(event: HammerInput) {
    // console.log("%cStrokeEnd", "color: red", event);
    this.strokeCurveUpdate(event);

    if (this.options.onDrawEnd) {
      this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
    }
  }

  private strokeArrowBegin(event: HammerInput) {
    if (!this.mode) {
      return;
    }

    this.cacheContext.putImageData(
      this.context.getImageData(0, 0, this.canvas.width, this.canvas.height),
      0,
      0,
    );
    this.cacheCanvas.style.zIndex = "3";

    const arrow = new Arrow(this.cacheContext, { color: this.arrowColor, size: this.arrowSize });
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
      (lastArrow as Curve).addPoint(point);

      this.clearCache();

      this.fromData(this.currentDrawData, this.cacheContext);
    });

    if (event.type === "panend") {
      this.cacheCanvas.style.zIndex = "1";
      this.context.putImageData(
        this.cacheContext.getImageData(0, 0, this.cacheCanvas.width, this.cacheCanvas.height),
        0,
        0,
      );

      this.clearCache();
    }
  }

  private strokeArrowEnd(event: HammerInput) {
    this.strokeArrowUpdate(event);

    if (this.options.onDrawEnd) {
      this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
    }
  }

  private strokeTextStart(event: HammerInput) {
    if (this.currentPanedText) {
      this.currentPanedText.x = event.center.x;
      this.currentPanedText.y = event.center.y;
      this.clear();
    }
  }

  private strokeTextUpdate(event: HammerInput) {
    if (this.currentPanedText) {
      // console.log(this.currentPanedText.x + event.deltaX);
      const startX = this.currentPanedText.x;
      const startY = this.currentPanedText.y;
      const x = startX + event.deltaX;
      const y = startY + event.deltaY;

      // this.currentPanedText.x = x;
      // this.currentPanedText.y = y;

      window.requestAnimationFrame(() => {
        // this.currentPanedText.x = this.currentPanedText.x + event.deltaX;
        // this.currentPanedText.y = this.currentPanedText.y + event.deltaY;

        this.clear();

        this.currentPanedText?.drawText(this.currentPanedText.color, x, y);
        // console.log(this.currentPanedText.x);
        this.fromData(this.currentDrawData, this.context);
      });

      // if (event.type === "panend") {
      // }
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

    if (this.mode === "curve") {
      this.strokeCurveBegin(event);
    }
    if (this.mode === "arrow") {
      this.strokeArrowBegin(event);
    }
    const tapedTextBoxList = this.currentDrawData.filter((d) => {
      if (d instanceof Text) {
        const place = d.tapWhere(event.center.x, event.center.y);

        if (place) {
          return true;
        }
      }

      return false;
    });

    if (tapedTextBoxList.length > 0) {
      this.currentPanedText = tapedTextBoxList[tapedTextBoxList.length - 1] as Text;

      console.log(this.currentPanedText);

      if (this.currentPanedText.lastTapedPlace === "text") {
        this.strokeTextStart(event);
      }
      if (this.currentPanedText.lastTapedPlace === "zoom") {
        console.log("zoom start");
      }
    }
  };

  private handlePanMove = (event: HammerInput) => {
    // console.log("pan move",event.deltaX);
    if (this.isMouseDown) {
      if (this.mode === "curve") {
        this.strokeCurveUpdate(event);
      }
      if (this.mode === "arrow") {
        this.strokeArrowUpdate(event);
      }
      if (this.currentPanedText) {
        if (this.currentPanedText.lastTapedPlace === "text") {
          this.strokeTextUpdate(event);
        }
        if (this.currentPanedText.lastTapedPlace === "zoom") {
          console.log("zoom move");
        }
      }
    }
  };

  private handlePanEnd = (event: HammerInput) => {
    // console.log("pan end",event);
    if (this.isMouseDown) {
      this.isMouseDown = false;
      if (this.mode === "curve") {
        this.strokeCurveEnd(event);
      }
      if (this.mode === "arrow") {
        this.strokeArrowEnd(event);
      }
      if (this.currentPanedText) {
        if (this.currentPanedText.lastTapedPlace === "text") {
          this.strokeTextEnd(event);
        }
        if (this.currentPanedText.lastTapedPlace === "zoom") {
          console.log("zoom end");
        }
      }
    }
  };

  private handlePanCancel = (event: HammerInput) => {
    // console.log("pan cancel",event);
    if (this.isMouseDown) {
      this.isMouseDown = false;
      if (this.mode === "curve") {
        this.strokeCurveEnd(event);
      }
      if (this.mode === "arrow") {
        this.strokeArrowEnd(event);
      }
    }
  };

  private handlePanEvent() {
    this.isMouseDown = false;

    this.Hammer.on("panstart", this.handlePanStart);
    this.Hammer.on("panmove", this.handlePanMove);
    this.Hammer.on("panend", this.handlePanEnd);
    this.Hammer.on("pancancel", this.handlePanCancel);

    this.HammerCache.on("panstart", this.handlePanStart);
    this.HammerCache.on("panmove", this.handlePanMove);
    this.HammerCache.on("panend", this.handlePanEnd);
    this.HammerCache.on("pancancel", this.handlePanCancel);
  }

  private handleTapCanvas = (event: HammerInput) => {
    // console.log("tap", event);
    const tapedTextBoxList = this.currentDrawData.filter((d) => {
      if (d instanceof Text) {
        const place = d.tapWhere(event.center.x, event.center.y);

        if (place) {
          return true;
        }
      }

      return false;
    });

    // console.log(tapedTextBoxList);

    if (tapedTextBoxList.length > 0) {
      this.currentTapedText = tapedTextBoxList[tapedTextBoxList.length - 1] as Text;
      if (this.currentTapedText.lastTapedPlace === "text") {
        if (typeof this.options.onSelectText === "function") {
          this.currentTapedText.setSelected(true);
          this.currentTapedText.drawText();
          this.options.onSelectText(
            (tapedTextBoxList[tapedTextBoxList.length - 1] as Text).content,
          );
        }
      }
      if (this.currentTapedText.lastTapedPlace === "delete") {
        this.currentDrawData = this.currentDrawData.filter((d) => {
          if (d instanceof Text) {
            if (d.content === this.currentTapedText?.content) {
              return false;
            }
          }
          return true;
        });

        this.fullDrawData = this.currentDrawData;

        // console.log(this.currentDrawData);

        this.clear();

        this.fromData(this.currentDrawData, this.context);

        this.currentTapedText = null;
      }
    } else {
      this.unActivityEveryText();
    }
  };

  private handleTapEvent() {
    this.Hammer.on("tap", this.handleTapCanvas);
  }

  private fromData(drawDataGroup: DrawDataGroup[], context?: CanvasRenderingContext2D) {
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

  public addText(text: string, color: string) {
    const newText = new Text(this.context, this.canvas, { text, color });
    newText.setSelected(true);
    newText.drawText();
    this.currentDrawData.push(newText);

    this.fullDrawData = this.currentDrawData;

    if (this.options.onDrawEnd) {
      this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
    }

    // console.log(this.currentDrawData);
  }

  public editText(text: string, color: string) {
    if (this.currentTapedText) {
      this.clear();
      this.currentTapedText.setColor(color);
      this.currentTapedText.setContent(text);
      this.currentTapedText.setSelected(true);
      this.currentTapedText.drawText();
      this.fromData(this.currentDrawData, this.context);

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

    this.fromData(this.currentDrawData, this.context);
  }

  public redo() {
    const _data = Array.from(this.currentDrawData);
    const willAddedDrawData = this.fullDrawData[_data.length];
    if (willAddedDrawData) {
      _data.push(willAddedDrawData);

      this.currentDrawData = _data;

      this.clear();

      this.fromData(this.currentDrawData, this.context);
    }
  }

  public toDataUrl(type = "image/png", quality?: number): string {
    return this.canvas.toDataURL(type, quality);
  }

  public unActivityEveryText() {
    this.clear();

    this.currentDrawData.forEach((d) => {
      if (d instanceof Text) {
        d.setSelected(false);
        d.drawText();
      }
    });

    this.fromData(this.currentDrawData, this.context);
  }

  public rotateBg() {
    // TODO
  }
}

export { Graffito };
