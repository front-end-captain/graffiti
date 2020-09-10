import ZoomIcon from "./assets/zoom.png";
import DeleteIcon from "./assets/delete.png";

interface TextOptions {
  text: string;
  color: string;
}

type TapedPlace = "zoom" | "delete" | "text" | null;

class Text {
  private _x: number;
  private _y: number;

  private _width: number;
  private _height: number;

  private _lineAmount: number;

  private _angle: number;
  private _selected: boolean;

  private _content: string;
  private _color: string;

  private _context: CanvasRenderingContext2D;
  private _canvas: HTMLCanvasElement;

  private DeleteImage: HTMLImageElement;
  private ZoomImage: HTMLImageElement;

  private _lastTapedPlace: TapedPlace;

  public readonly id: number;

  private _centerX: number;
  private _centerY: number;

  private _startX: number;

  private _startY: number;

  private _initWidth: number;
  private _initHeight: number;

  constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, options: TextOptions) {
    this._context = context;
    this._canvas = canvas;

    this._content = options.text;
    this._color = options.color;

    this._angle = 0;
    this._selected = true;

    this.DeleteImage = new Image();
    this.DeleteImage.src = DeleteIcon;

    this.ZoomImage = new Image();
    this.ZoomImage.src = ZoomIcon;

    this._lastTapedPlace = null;

    this.id = Date.now();

    const textList = this._content.split("\n");
    this._context.font = "30px PingFangSC-Semibold, PingFang SC";
    const { width: textWidth } = this._context.measureText(textList[0]);

    // console.log("initLeft, initTop", initLeft, initTop);
    // console.log(textList, textWidth);

    const height = 32 * textList.length;

    const _left =
      this._canvas.width === window.innerWidth
        ? this._canvas.width / 2 - textWidth / 2
        : ((window.innerWidth - this._canvas.width) / 2 - textWidth) / 2;

    const left = _left < 0 ? 0 : _left;

    const top =
      this._canvas.height === window.innerHeight
        ? window.innerHeight / 2 - height / 2
        : ((window.innerHeight - this._canvas.height) / 2 - height) / 2;

    const width = textWidth > this._canvas.width ? this._canvas.width - 25 : textWidth;

    this._x = left;
    this._y = top;
    this._width = width;
    this._height = height;
    this._initHeight = height;
    this._initWidth = width;
    this._startX = left;
    this._startY = top;
    this._lineAmount = textList.length;
    this._centerY = this._y + this._height / 2;
    this._centerX = this._x + this._width / 2;
  }

  public setContext(context: CanvasRenderingContext2D) {
    this._context = context;
  }

  /**
   * Getter x
   * @return {number}
   */
  public get x(): number {
    return this._x;
  }

  /**
   * Setter x
   * @param {number} value
   */
  public set x(value: number) {
    this._x = value;
  }

  /**
   * Getter y
   * @return {number}
   */
  public get y(): number {
    return this._y;
  }

  /**
   * Setter y
   * @param {number} value
   */
  public set y(value: number) {
    this._y = value;
  }

  /**
   * Getter lineAmount
   * @return {number}
   */
  public get lineAmount(): number {
    return this._lineAmount;
  }

  /**
   * Getter width
   * @return {number}
   */
  public get width(): number {
    return this._width;
  }

  /**
   * Setter width
   * @param {number} value
   */
  public set width(value: number) {
    this._width = value;
  }

  /**
   * Getter height
   * @return {number}
   */
  public get height(): number {
    return this._height;
  }

  /**
   * Setter height
   * @param {number} value
   */
  public set height(value: number) {
    this._height = value;
  }

  /**
   * Getter angle
   * @return {number}
   */
  public get angle(): number {
    return this._angle;
  }

  /**
   * Setter angle
   * @param {number} value
   */
  public set angle(value: number) {
    this._angle = value;
  }

  /**
   * Getter selected
   * @return {boolean}
   */
  public get selected(): boolean {
    return this._selected;
  }

  /**
   * Setter selected
   * @param {boolean} value
   */
  public set selected(value: boolean) {
    this._selected = value;
  }

  /**
   * Getter content
   * @return {string}
   */
  public get content(): string {
    return this._content;
  }

  /**
   * Setter content
   * @param {string} value
   */
  public set content(value: string) {
    this._content = value;
  }

  /**
   * Getter color
   * @return {string}
   */
  public get color(): string {
    return this._color;
  }

  /**
   * Setter color
   * @param {string} value
   */
  public set color(value: string) {
    this._color = value;
  }

  /**
   * Getter lastTapedPlace
   * @return {TapedPlace }
   */
  public get lastTapedPlace(): TapedPlace {
    return this._lastTapedPlace;
  }

  /**
   * Setter lastTapedPlace
   * @param {TapedPlace } value
   */
  public set lastTapedPlace(value: TapedPlace) {
    this._lastTapedPlace = value;
  }

  /**
   * Getter centerX
   * @return {number}
   */
  public get centerX(): number {
    return this._centerX;
  }

  /**
   * Setter centerX
   * @param {number} value
   */
  public set centerX(value: number) {
    this._centerX = value;
  }

  /**
   * Getter centerY
   * @return {number}
   */
  public get centerY(): number {
    return this._centerY;
  }

  /**
   * Setter centerY
   * @param {number} value
   */
  public set centerY(value: number) {
    this._centerY = value;
  }

  /**
   * Getter startX
   * @return {number}
   */
  public get startX(): number {
    return this._startX;
  }

  /**
   * Setter startX
   * @param {number} value
   */
  public set startX(value: number) {
    this._startX = value;
  }

  /**
   * Getter startY
   * @return {number}
   */
  public get startY(): number {
    return this._startY;
  }

  /**
   * Setter startY
   * @param {number} value
   */
  public set startY(value: number) {
    this._startY = value;
  }

  /**
   * Getter initHeight
   * @return {number}
   */
  public get initHeight(): number {
    return this._initHeight;
  }

  /**
   * Setter initHeight
   * @param {number} value
   */
  public set initHeight(value: number) {
    this._initHeight = value;
  }

  /**
   * Getter initWidth
   * @return {number}
   */
  public get initWidth(): number {
    return this._initWidth;
  }

  /**
   * Setter initWidth
   * @param {number} value
   */
  public set initWidth(value: number) {
    this._initWidth = value;
  }

  public drawText() {
    const textList = this._content.split("\n");

    // console.log(this._x, this._y, this._width, this._height);

    // this._context.translate(this._centerX, this._centerY);
    // this._context.rotate((this._angle * Math.PI) / 180);
    // this._context.translate(-this._centerX, -this._centerY);

    this._context.font = "30px PingFangSC-Semibold, PingFang SC";
    this._context.fillStyle = this._color;
    this._context.textAlign = "left";
    this._context.textBaseline = "top";

    textList.forEach((t, i) => {
      this._context.fillText(t, this._x, this._y + i * 32);
    });

    // console.log(this._selected);

    if (this._selected) {
      this._context.lineWidth = 1;
      this._context.strokeStyle = "#fff";
      this._context.strokeRect(this._x, this._y, this._width, this._height);

      this.DeleteImage.onload = () => {
        this._context.drawImage(this.DeleteImage, this._x - 12, this._y - 12, 24, 24);
      };
      this._context.drawImage(this.DeleteImage, this._x - 12, this._y - 12, 24, 24);

      this.ZoomImage.onload = () => {
        this._context.drawImage(
          this.ZoomImage,
          this._x + this._width - 12,
          this._y + this._height - 12,
          24,
          24,
        );
      };
      this._context.drawImage(
        this.ZoomImage,
        this._x + this._width - 12,
        this._y + this._height - 12,
        24,
        24,
      );
    }
    this._context.restore();
  }

  public tapWhere(x: number, y: number) {
    const zoomW = 24;
    const zoomH = 24;
    let zoomX = this._x + this._width;
    let zoomY = this._y + this._height;

    const zoomAngle =
      (Math.atan2(zoomY - this._centerY, zoomX - this._centerX) / Math.PI) * 180 + this._angle;
    const zoomXY = this.getZoom(zoomX, zoomY, zoomAngle, 12);

    zoomX = zoomXY.x;
    zoomY = zoomXY.y;

    const delW = 24;
    const delH = 24;
    let delX = this._x;
    let delY = this._y;
    const delAngle =
      (Math.atan2(delY - this._centerY, delX - this._centerX) / Math.PI) * 180 + this._angle;
    const delXY = this.getZoom(delX, delY, delAngle, 12);
    delX = delXY.x;
    delY = delXY.y;

    const moveX = this._x - 10;
    const moveY = this._y - 10;

    if (x - zoomX >= 0 && y - zoomY >= 0 && zoomX + zoomW - x >= 0 && zoomY + zoomH - y >= 0) {
      return (this._lastTapedPlace = "zoom");
    }

    if (x - delX >= 0 && y - delY >= 0 && delX + delW - x >= 0 && delY + delH - y >= 0) {
      return (this._lastTapedPlace = "delete");
    }

    if (
      x - moveX >= 0 &&
      y - moveY >= 0 &&
      moveX + this._width - x >= 0 &&
      moveY + this._height - y >= 0
    ) {
      return (this._lastTapedPlace = "text");
    }

    return (this._lastTapedPlace = null);
  }

  private getZoom(x: number, y: number, angle: number, delta: number) {
    const _angle = (Math.PI / 180) * angle;

    const r = Math.sqrt(Math.pow(x - this._centerX, 2) + Math.pow(y - this._centerY, 2));

    const a = Math.sin(_angle) * r;

    const b = Math.cos(_angle) * r;

    return {
      x: this._centerX + b - delta,
      y: this._centerY + a - delta,
    };
  }
}

export { Text };
