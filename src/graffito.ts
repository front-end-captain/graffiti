/* eslint-disable no-param-reassign */
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
        this.fromData(this.currentDrawData, this.context);
      });

      // console.log(this.currentPanedText.x, this.currentPanedText.y);

      if (event.type === "panend") {
        const outOfLeft = (window.innerWidth - this.canvas.width) / 2;
        const outOfRight = outOfLeft + this.canvas.width;
        const outOfTop = (window.innerHeight - this.canvas.height) / 2;
        const outOfBottom = outOfTop + this.canvas.height;

        // console.log(x, y);
        // console.log(outOfLeft, outOfRight, outOfTop, outOfBottom);

        if (
          this.currentPanedText.x < outOfLeft ||
          this.currentPanedText.x + this.currentPanedText.width > outOfRight
        ) {
          // console.log("out of left or right");
          this.currentPanedText.x = startX - width / 2;
          this.currentPanedText.y = startY - height / 2;

          this.clear();
          this.fromData(this.currentDrawData, this.context);
          return;
        }

        if (
          this.currentPanedText.y > outOfTop ||
          this.currentPanedText.y + this.currentPanedText.height < outOfBottom
        ) {
          // console.log("out of top or bottom");
          this.currentPanedText.x = startX - width / 2;
          this.currentPanedText.y = startY - height / 2;

          this.clear();
          this.fromData(this.currentDrawData, this.context);
          return;
        }

        this.currentPanedText.startX = x;
        this.currentPanedText.startY = y;

        // this.currentPanedText = null;
      }
    }
  }

  private strokeTextEnd(event: HammerInput) {
    if (this.currentPanedText) {
      this.strokeTextUpdate(event);
    }
  }

  private zoomTextStart(event: HammerInput) {
    if (this.currentPanedText) {
      this.currentPanedText.startX = event.center.x - (window.innerWidth - this.canvas.width) / 2;
      this.currentPanedText.startY = event.center.y - (window.innerHeight - this.canvas.height) / 2;

      this.zoomTextUpdate(event);
    }
  }

  private zoomTextUpdate(event: HammerInput) {
    // console.log("zoom text update", event.center);

    if (this.currentPanedText) {
      const {
        width,
        height,
        startX,
        startY,
        centerX,
        centerY,
        initHeight,
        initWidth,
      } = this.currentPanedText;

      const x = startX + event.deltaX - width / 2;
      const y = startY + event.deltaY - height / 2;
      this.currentPanedText.x = x;
      this.currentPanedText.y = y;

      // const angleBefore = (Math.atan2(startY - centerY, startX - centerX) / Math.PI) * 180;
      // const angleAfter = (Math.atan2(event.center.y - centerY, event.center.x - centerX) / Math.PI) * 180;

      // console.log(angleBefore, angleAfter);

      // this.currentPanedText.angle = angle + angleAfter - angleBefore;

      // console.log(this.currentPanedText.angle);

      const lineA = Math.sqrt(Math.pow(centerX - startX, 2) + Math.pow(centerY - startY, 2));
      const lineB = Math.sqrt(Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2));

      // console.log(lineA, lineB);

      const rate = initHeight / initWidth;
      const w = initWidth + (lineB - lineA);
      const h = initHeight + (lineB - lineA) * rate;

      // console.log(rate, w, h);

      this.currentPanedText.width = w <= 5 ? 5 : w;
      this.currentPanedText.height = h <= 5 ? 5 : h;
      this.currentPanedText.x = x - (lineB - lineA) / 2;
      this.currentPanedText.y = y - (lineB - lineA) / 2;

      this.clear();

      // if (w > 5 && h > 5) {
      //   this.currentPanedText.drawText(
      //     this.currentPanedText.color,
      //     x - (lineB - lineA) / 2,
      //     y - (lineB - lineA) / 2,
      //   );
      // }

      this.fromData(this.currentDrawData, this.context);
    }
  }

  private zoomTextEnd(event: HammerInput) {
    if (this.currentPanedText) {
      this.zoomTextUpdate(event);
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
      this.currentPanedText = tapedTextBoxList[tapedTextBoxList.length - 1] as Text;

      // console.log(this.currentPanedText);

      if (this.currentPanedText.lastTapedPlace === "text") {
        this.strokeTextStart(event);
      }
      if (this.currentPanedText.lastTapedPlace === "zoom") {
        this.zoomTextStart(event);
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
          this.zoomTextUpdate(event);
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
          this.zoomTextEnd(event);
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
      if (this.currentPanedText) {
        if (this.currentPanedText.lastTapedPlace === "text") {
          this.strokeTextEnd(event);
        }
        if (this.currentPanedText.lastTapedPlace === "zoom") {
          this.zoomTextEnd(event);
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

    this.HammerCache.on("panstart", this.handlePanStart);
    this.HammerCache.on("panmove", this.handlePanMove);
    this.HammerCache.on("panend", this.handlePanEnd);
    this.HammerCache.on("pancancel", this.handlePanCancel);
  }

  private handleTapCanvas = (event: HammerInput) => {
    // console.log("tap", event);
    const tapedTextBoxList: DrawDataGroup[] = [];
    this.currentDrawData.forEach((d) => {
      if (d instanceof Text) {
        // const p = event.center.x -
        const x = event.center.x - (window.innerWidth - this.canvas.width) / 2;
        const y = event.center.y - (window.innerHeight - this.canvas.height) / 2;

        const place = d.tapWhere(x, y);

        // console.log(place);

        if (place) {
          tapedTextBoxList.push(d);
        }
      }
    });

    // console.log(tapedTextBoxList);

    if (tapedTextBoxList.length > 0) {
      this.currentTapedText = tapedTextBoxList[tapedTextBoxList.length - 1] as Text;

      if (this.currentTapedText.lastTapedPlace === "text") {
        if (typeof this.options.onSelectText === "function") {
          this.currentTapedText.selected = true;

          this.fromData(this.currentDrawData, this.context);

          this.options.onSelectText(
            (tapedTextBoxList[tapedTextBoxList.length - 1] as Text).content,
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
    newText.selected = true;

    this.currentDrawData.push(newText);

    this.fullDrawData = this.currentDrawData;

    this.fromData(this.currentDrawData, this.context);

    if (this.options.onDrawEnd) {
      this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
    }

    console.log(this.currentDrawData);
  }

  public editText(text: string, color: string) {
    if (this.currentTapedText) {
      this.clear();
      this.currentTapedText.color = color;
      this.currentTapedText.content = text;
      this.currentTapedText.selected = true;

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
        d.selected = false;
      }
    });

    this.fromData(this.currentDrawData, this.context);
  }

  public rotateBg() {
    // TODO
  }
}

export { Graffito };
