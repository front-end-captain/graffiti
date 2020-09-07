import HammerJs from "hammerjs";

export interface SketchpadInitOptions {
  backgroundImageURL: string;
  backgroundColor?: string;
  curveColor?: string;
  curveSize?: number;
  arrowColor?: string;
  arrowSize?: number;
  onSelectText?: (text: string, index: number) => void;
  onDrawEnd?: (drawData: DrawDataGroup[], canUndo: boolean, canRedo: boolean) => void;
}

type Mode = "curve" | "arrow" | "text";

interface BasicPoint {
  x: number;
  y: number;
  time: number;
}

export interface DrawDataGroup {
  color: string;
  type: Mode;
  activity?: boolean;
  text?: string;
  size: number;
  element?: HTMLSpanElement;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  points: BasicPoint[];
}

class Sketchpad {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private CANVAS_CONTAINER: HTMLElement | null;

  private options: SketchpadInitOptions;

  private mode: Mode | null;

  private backgroundImageURL?: string;
  private backgroundImage: HTMLImageElement | null;

  private curveColor: string;
  private curveSize: number;

  private arrowColor: string;
  private arrowSize: number;

  private isMouseDown: boolean;

  private fullDrawData: DrawDataGroup[];
  private currentDrawData: DrawDataGroup[];

  private deleteZoneElement: HTMLElement | null;

  private textBoxWrapper: HTMLElement | null;

  constructor(canvas: HTMLCanvasElement, options: SketchpadInitOptions) {
    const _context = canvas.getContext("2d");
    if (!_context) {
      throw new Error("get lower canvas context error");
    }

    this.canvas = canvas;
    this.context = _context;

    this.CANVAS_CONTAINER = this.canvas.parentElement;

    this.options = options;

    this.mode = null;

    this.isMouseDown = false;

    this.backgroundImageURL = options.backgroundImageURL;
    this.backgroundImage = null;

    this.curveColor = options.curveColor || "#fff";
    this.curveSize = options.curveSize || 1;

    this.arrowColor = options.arrowColor || "#fff";
    this.arrowSize = options.arrowSize || 1;

    this.fullDrawData = [];
    this.currentDrawData = [];

    this.deleteZoneElement = document.getElementById("delete-zone");

    this.textBoxWrapper = document.getElementById("text-box-wrapper");

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
  }

  private bindEvent(): void {
    this.canvas.style.touchAction = "none";
    this.canvas.style.msTouchAction = "none";

    this.handlePanEvents();

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
      this.canvas.style.height = "100%";
      this.canvas.style.width = "100%";

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

    image.setAttribute("crossOrigin", "anonymous");
    image.src = `${dataUrl}?time=${new Date().valueOf()}`;
  }

  private strokeBegin(event: MouseEvent | Touch) {
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
      points: [this.createPoint(event.clientX, event.clientY)],
    };

    this.currentDrawData.push(newDrawDataGroup);
    this.fullDrawData = this.currentDrawData;

    this.strokeUpdate(event);
  }

  private strokeUpdate(event: MouseEvent | Touch) {
    // console.log("%cStrokeUpdate", "color: red", event);

    if (this.currentDrawData.length === 0) {
      this.strokeBegin(event);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;

    const point = this.createPoint(x, y);

    const lastDrawDataGroup = this.currentDrawData[this.currentDrawData.length - 1];

    const { points, color, size } = lastDrawDataGroup;

    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];

    if (this.mode === "curve") {
      this.drawCurve(this.context, lastPoint, point, color, size);
      lastDrawDataGroup.points.push(point);
    }

    if (this.mode === "arrow") {
      window.requestAnimationFrame(() => {
        lastDrawDataGroup.points.push(point);
        this.drawArrow(this.context, firstPoint, point, color, size);

        this.clear();

        this._fromData(this.context, this.currentDrawData);
      });
    }
  }

  private strokeEnd(event: MouseEvent | Touch) {
    // console.log("%cStrokeEnd", "color: red", event);
    this.strokeUpdate(event);

    if (this.options.onDrawEnd) {
      this.options.onDrawEnd(this.currentDrawData, this.getCanUndo(), this.getCanRedo());
    }
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

  private _handleTouchStart = (event: TouchEvent): void => {
    // Prevent scrolling.
    event.preventDefault();

    if (event.targetTouches.length === 1) {
      const touch = event.changedTouches[0];
      this.strokeBegin(touch);
    }
  };

  private _handleTouchMove = (event: TouchEvent): void => {
    // Prevent scrolling.
    event.preventDefault();

    const touch = event.targetTouches[0];
    this.strokeUpdate(touch);
  };

  private _handleTouchEnd = (event: TouchEvent): void => {
    const wasCanvasTouched = event.target === this.canvas;
    if (wasCanvasTouched) {
      event.preventDefault();

      const touch = event.changedTouches[0];
      this.strokeEnd(touch);
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
    this.canvas.addEventListener("touchstart", this._handleTouchStart);
    this.canvas.addEventListener("touchmove", this._handleTouchMove);
    this.canvas.addEventListener("touchend", this._handleTouchEnd);
  }

  private handlePanEvents() {
    if (!this.CANVAS_CONTAINER) {
      return;
    }

    const hammer = new HammerJs(this.CANVAS_CONTAINER);
    // hammer.set({ enable: true });

    const _this = this;

    hammer.on("tap", function(e) {
      // console.log("tap", e);
      if (e.target.nodeName === "SPAN") {
        // console.log("tap text");
        // console.log(e.target.dataset["order"]);
        if (typeof _this.options.onSelectText === "function") {
          _this.options.onSelectText(e.target.innerText, Number(e.target.dataset["order"]));
        }
        if (!e.target.classList.contains("activity")) {
          e.target.classList.add("activity");
        }
      } else {
        _this.currentDrawData = _this.currentDrawData.map((d) => {
          if (d.type === "text") {
            if (d.element) {
              d.element.classList.remove("activity");
            }

            return { ...d, activity: false };
          }

          return d;
        });

        _this.fullDrawData = _this.currentDrawData;
      }
    });

    let initX = 0;
    let initY = 0;

    // const disY = window.innerHeight - 70;
    // const disX = (window.innerWidth - 160) / 2;

    hammer.on("panstart", (e) => {
      if (e.target.nodeName === "SPAN") {
        if (!e.target.className.includes("activity")) {
          e.target.classList.add("activity");
        }

        // console.log("pan start", e.deltaX, e.deltaY);
        // console.log("last pos(pan start)", e.target.offestLeft, e.target.offsetTop);
        // console.log("init x y(pan start)", initX, initY);

        this.deleteZoneElement?.classList.add("activity");

        initX = e.target.offsetLeft;
        initY = e.target.offsetTop;

        e.target.style.left = `${initX}px`;
        e.target.style.top = `${initY}px`;
      }
    });

    hammer.on("panmove", function(e) {
      if (e.target.nodeName === "SPAN") {
        // console.log("pan move", e.deltaX, e.deltaY);
        // console.log("last pos(pan move)", e.target.offsetLeft, e.target.offsetTop);
        // console.log("init x y(pan move)", initX, initY);

        e.target.style.left = `${initX + e.deltaX}px`;
        e.target.style.top = `${initY + e.deltaY}px`;

        // console.log(initY + e.deltaY, disY);

        if (initY + e.deltaY < 45) {
          _this.deleteZoneElement?.classList.add("danger");
        }
        if (initY + e.deltaY > 45) {
          _this.deleteZoneElement?.classList.remove("danger");
        }
      }
    });

    hammer.on("panend", function(e) {
      if (e.target.nodeName === "SPAN") {
        // console.log("pan end", e.deltaX, e.deltaY);
        // console.log("last pos(pan end)", e.target.offsetLeft, e.target.offsetTop);
        // console.log("init x y(pan end)", initX, initY);

        e.target.style.left = `${e.target.offsetLeft}px`;
        e.target.style.top = `${e.target.offsetTop}px`;

        _this.deleteZoneElement?.classList.remove("activity");

        let order = 0;
        const index = Number(e.target.dataset["order"]);
        _this.currentDrawData = _this.currentDrawData.map((d) => {
          if (d.type === "text") {
            order += 1;
            if (d.element && order === index) {
              return { ...d, left: e.target.offsetLeft, top: e.target.offsetTop };
            }
            return d;
          }

          return d;
        });

        if (e.target.offsetTop < 45) {
          // console.log("would delete", e.target);

          _this.currentDrawData = _this.currentDrawData.filter(
            (d) => d.text !== e.target.innerText,
          );
          _this.fullDrawData = _this.currentDrawData;

          _this.textBoxWrapper?.removeChild(e.target);
        }

        const outOfLeft = (window.innerWidth - _this.canvas.width) / 2;
        const outOfRight = outOfLeft + _this.canvas.width;
        const outOfTop = (window.innerHeight - _this.canvas.height) / 2;
        const outOfBottom = outOfTop + _this.canvas.height;
        if (
          e.target.offsetLeft < outOfLeft ||
          e.target.offsetLeft + e.target.offsetWidth > outOfRight
        ) {
          // console.log("out of left or right");
          e.target.style.left = `${initX}px`;
          e.target.style.top = `${initY}px`;
        }

        if (
          e.target.offsetTop < outOfTop ||
          e.target.offsetTop + e.target.offsetHeight > outOfBottom
        ) {
          // console.log("out of TOP or BOTTOM");
          e.target.style.left = `${initX}px`;
          e.target.style.top = `${initY}px`;
        }

        initX = 0;
        initY = 0;
      }
    });

    hammer.on("pancancel", function(e) {
      if (e.target.nodeName === "SPAN") {
        e.target.style.left = `${initX}px`;
        e.target.style.top = `${initY}px`;
      }
    });
  }

  private drawCurve(
    context: CanvasRenderingContext2D,
    beginPoint: BasicPoint,
    endPoint: BasicPoint,
    color: string,
    size: number,
  ) {
    context.save();

    context.beginPath();
    context.lineCap = "round";
    context.lineWidth = size;
    context.lineJoin = "round";
    context.strokeStyle = color;
    context.moveTo(beginPoint.x, beginPoint.y);
    context.lineTo(endPoint.x, endPoint.y);
    context.stroke();
    context.closePath();
    context.restore();
  }

  private drawArrow(
    context: CanvasRenderingContext2D,
    beginPoint: BasicPoint,
    endPoint: BasicPoint,
    color: string,
    size: number,
  ) {
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

    context.save();

    context.beginPath();

    let arrowX = fromX - topX;
    let arrowY = fromY - topY;

    context.moveTo(arrowX, arrowY);
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    arrowX = toX + topX;
    arrowY = toY + topY;
    context.moveTo(arrowX, arrowY);
    context.lineTo(toX, toY);
    arrowX = toX + botX;
    arrowY = toY + botY;
    context.lineTo(arrowX, arrowY);
    context.strokeStyle = color;
    context.lineWidth = size;
    context.stroke();
    context.closePath();
    context.restore();
  }

  private drawText(text: string, color: string): DrawDataGroup {
    // if (text === "") return;
    const textBox = document.createElement("span");

    const { width, height, left, top } = this.setText(textBox, text, color);

    this.textBoxWrapper?.appendChild(textBox);

    return {
      color,
      type: "text" as Mode,
      activity: true,
      element: textBox,
      text,
      width,
      height,
      left,
      top,
      size: 30,
      points: [] as BasicPoint[],
    };
  }

  private setText(
    textBoxElement: HTMLSpanElement,
    text: string,
    color: string,
    initLeft?: number,
    initTop?: number,
  ) {
    this.context.font = "30px PingFangSC-Semibold, PingFang SC";
    const { width: textWidth } = this.context.measureText(text.split("\n")[0]);

    // console.log("initLeft, initTop", initLeft, initTop);

    const _left =
      this.canvas.width === window.innerWidth
        ? this.canvas.width / 2 - (textWidth + 20) / 2
        : window.innerWidth / 2 - (textWidth + 20) / 2;

    const left = initLeft || (_left < 0 ? 10 : _left);
    const top =
      initTop ||
      (this.canvas.height === window.innerHeight
        ? this.canvas.height / 2 - 32 / 2
        : window.innerHeight / 2 - 32 / 2);
    const height = 32;
    const width = textWidth > this.canvas.width ? this.canvas.width - 25 : textWidth;

    textBoxElement.innerText = text;
    textBoxElement.style.color = color;
    textBoxElement.style.left = `${left}px`;
    textBoxElement.style.top = `${top}px`;
    textBoxElement.style.maxWidth = `${this.canvas.width}px`;
    textBoxElement.style.width = `${width}px`;
    textBoxElement.style.height = "auto";
    textBoxElement.classList.add("text-box-item");
    textBoxElement.classList.add("activity");

    const { order } = textBoxElement.dataset;
    textBoxElement.setAttribute(
      "data-order",
      order || (this.getDrawedTextBoxLength() + 1).toString(),
    );

    // const deleteIcon = document.createElement("i");
    // deleteIcon.innerText = "x";
    // deleteIcon.className = "delete-icon";
    // // console.log(textBoxElement.childNodes);
    // if (textBoxElement.childNodes.length === 1) {
    //   textBoxElement.appendChild(deleteIcon);
    // }

    return { width, height, left, top };
  }

  private createPoint(x: number, y: number): BasicPoint {
    const rect = this.canvas.getBoundingClientRect();

    return { x: x - rect.left, y: y - rect.top, time: new Date().getTime() };
  }

  private _fromData(
    context: CanvasRenderingContext2D,
    drawDataGroup: DrawDataGroup[],
    renderText = false,
  ) {
    if (drawDataGroup.length === 0) {
      return;
    }

    for (const drawData of drawDataGroup) {
      const { color, points, size, type } = drawData;

      if (type === "curve") {
        if (points.length > 1) {
          for (let j = 0; j < points.length; j += 1) {
            if (j < points.length - 1) {
              this.drawCurve(context, points[j], points[j + 1], color, size);
            }
          }
        }
      }

      if (type === "arrow") {
        if (points.length > 1) {
          this.drawArrow(context, points[0], points[points.length - 1], color, size);
        }
      }

      if (renderText && type === "text") {
        const textList = drawData.text?.split("\n");
        context.save();
        context.font = "30px PingFangSC-Semibold, PingFang SC";
        context.fillStyle = color;
        context.textAlign = "left";
        context.textBaseline = "middle";
        textList?.forEach((t, i) => {
          context.fillText(t, drawData.left || 0, (drawData.top || 0) + i * 32);
        });
        context.restore();
      }
    }
  }

  private getDrawedTextBoxLength(): number {
    return this.currentDrawData.filter((d) => d.type === "text").length;
  }

  public toDataUrl(type = "image/png", quality?: number): string {
    const _canvas = document.createElement("canvas");
    _canvas.width = this.canvas.width;
    _canvas.height = this.canvas.height;
    const context = _canvas.getContext("2d");

    if (context) {
      context.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height);
      const sortedDrawDataGroup = this.currentDrawData.sort((a, b) => a.type.localeCompare(b.type));
      this._fromData(context, sortedDrawDataGroup, true);
    }

    return _canvas.toDataURL(type, quality);
  }

  public setMode(mode: Mode | null) {
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

  public undo() {
    const _data = Array.from(this.currentDrawData);
    _data.pop();

    this.currentDrawData = _data;

    this.clear();

    this._fromData(this.context, this.currentDrawData);
  }

  public redo() {
    const _data = Array.from(this.currentDrawData);
    const willAddedDrawData = this.fullDrawData[_data.length];
    if (willAddedDrawData) {
      _data.push(willAddedDrawData);

      this.currentDrawData = _data;

      this.clear();

      this._fromData(this.context, this.currentDrawData);
    }
  }

  public getCanUndo() {
    return this.currentDrawData.length > 0;
  }

  public getCanRedo() {
    return this.fullDrawData.length > this.currentDrawData.length;
  }

  public addText(text: string, color: string) {
    this.currentDrawData.push(this.drawText(text, color));
    this.fullDrawData = this.currentDrawData;
  }

  public editText(text: string, color: string, index: number) {
    let order = 0;
    this.currentDrawData = this.currentDrawData.map((d) => {
      if (d.type === "text") {
        order += 1;
        if (d.element && order === index) {
          this.setText(d.element, text, color, d.left, d.top);
        }
        return { ...d, text, color };
      }

      return d;
    });

    this.fullDrawData = this.currentDrawData;
  }

  public clean() {
    this.clear();

    this.currentDrawData = [];
    this.fullDrawData = [];
  }

  public revertCanvas() {
    const imgData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const newImgData = this.context.createImageData(this.canvas.width, this.canvas.height);

    this.context.save();
    this.context.putImageData(this.imageDataHRevert(imgData, newImgData), 0, 0);
    this.context.restore();
  }

  private imageDataHRevert(sourceData: ImageData, newData: ImageData) {
    for (let i = 0, h = sourceData.height; i < h; i++) {
      for (let j = 0, w = sourceData.width; j < w; j++) {
        newData.data[i * w * 4 + j * 4 + 0] = sourceData.data[i * w * 4 + (w - j) * 4 + 0];
        newData.data[i * w * 4 + j * 4 + 1] = sourceData.data[i * w * 4 + (w - j) * 4 + 1];
        newData.data[i * w * 4 + j * 4 + 2] = sourceData.data[i * w * 4 + (w - j) * 4 + 2];
        newData.data[i * w * 4 + j * 4 + 3] = sourceData.data[i * w * 4 + (w - j) * 4 + 3];
      }
    }

    return newData;
  }
}

export { Sketchpad };
