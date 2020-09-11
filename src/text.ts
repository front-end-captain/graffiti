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

  private _initFontSize: number;

  private _fontSize: number;

  private _padding: number;

  constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, options: TextOptions) {
    this._context = context;
    this._canvas = canvas;

    this._content = options.text;
    this._color = options.color;

    this._selected = true;

    this.DeleteImage = new Image();
    this.DeleteImage.src = DeleteIcon;

    this.ZoomImage = new Image();
    this.ZoomImage.src = ZoomIcon;

    this._lastTapedPlace = null;

    this.id = Date.now();

    this._fontSize = 30;
    this._initFontSize = 30;

    this._padding = 20;

    const textList = this._content.split("\n");
    this._context.font = `${this.initFontSize}px PingFangSC-Semibold, PingFang SC`;
    const { width: textWidth } = this._context.measureText(textList[0]);

    // console.log("initLeft, initTop", initLeft, initTop);
    // console.log(textList, textWidth);

    const height = 32 * textList.length;

    const _left =
      this._canvas.width === window.innerWidth
        ? this._canvas.width / 2 - textWidth / 2
        : ((window.innerWidth - this._canvas.width) / 2 - textWidth) / 2;

    const _top =
      this._canvas.height === window.innerHeight
        ? window.innerHeight / 2 - height / 2
        : ((window.innerHeight - this._canvas.height) / 2 - height) / 2;

    const width = textWidth > this._canvas.width ? this._canvas.width - 25 : textWidth;

    this._x = _left - this._padding;
    this._y = _top - this._padding;
    this._width = width + this._padding;
    this._height = height + this._padding;
    this._initHeight = height;
    this._initWidth = width;
    this._startX = _left;
    this._startY = _top;
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

  /**
   * Getter fontSize
   * @return {number}
   */
  public get fontSize(): number {
    return this._fontSize;
  }

  /**
   * Setter fontSize
   * @param {number} value
   */
  public set fontSize(value: number) {
    this._fontSize = value;
  }

  /**
   * Getter initFontSize
   * @return {number}
   */
  public get initFontSize(): number {
    return this._initFontSize;
  }

  /**
   * Setter initFontSize
   * @param {number} value
   */
  public set initFontSize(value: number) {
    this._initFontSize = value;
  }

  public drawText() {
    const textList = this._content.split("\n");

    // console.log(this._x, this._y, this._width, this._height);

    this._context.font = `${this.fontSize}px PingFangSC-Semibold, PingFang SC`;
    this._context.fillStyle = this._color;
    this._context.textAlign = "left";
    this._context.textBaseline = "top";

    textList.forEach((t, i) => {
      this._context.fillText(t, this._x + this._padding / 2, this._y + this._padding / 2 + i * 32);
    });

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
    const zoomX = this._x + this._width;
    const zoomY = this._y + this._height;

    const delW = 24;
    const delH = 24;
    const delX = this._x;
    const delY = this._y;

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
}

export { Text };
