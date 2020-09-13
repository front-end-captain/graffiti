import DeleteIcon from "./assets/delete.png";

interface TextOptions {
  text: string;
  color: string;
  size: number;
}

type TapedPlace = "zoom" | "delete" | "text" | null;

class Text {
  public x: number;
  public y: number;

  public width: number;
  public height: number;

  public textList: string[];

  public selected: boolean;

  public content: string;
  public color: string;

  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  private DeleteImage: HTMLImageElement;

  public lastTapedPlace: TapedPlace;

  public readonly id: number;

  public centerX: number;
  public centerY: number;

  public startX: number;
  public startY: number;

  public initWidth: number;
  public initHeight: number;

  public fontSize: number;

  public padding: number;

  constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, options: TextOptions) {
    this.context = context;
    this.canvas = canvas;

    this.content = options.text;
    this.color = options.color;

    this.selected = true;

    this.DeleteImage = new Image();
    this.DeleteImage.src = DeleteIcon;

    this.lastTapedPlace = null;

    this.id = Date.now();

    this.fontSize = options.size;

    this.padding = 20;

    this.textList = [""];

    const { x, y, width, height } = this.getTextBoundingRect();

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.initHeight = this.height;
    this.initWidth = this.width;
    this.startX = this.x;
    this.startY = this.y;
    this.centerY = this.y + this.height / 2;
    this.centerX = this.x + this.width / 2;
  }

  public setContext(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  public getTextBoundingRect() {
    this.textList = this.content.split("\n");

    this.context.font = `${this.fontSize}px PingFangSC-Semibold, PingFang SC`;
    const { width: textWidth } = this.context.measureText(this.textList[0]);

    const height = (this.fontSize + 2) * this.textList.length + this.padding;
    const width = textWidth + this.padding;

    this.padding = this.fontSize * 0.66;

    const _left =
      this.canvas.width === window.innerWidth
        ? (this.canvas.width - textWidth) / 2
        : ((window.innerWidth - this.canvas.width) / 2 - textWidth) / 2;

    const _top =
      this.canvas.height === window.innerHeight
        ? (window.innerHeight - height) / 2
        : ((window.innerHeight - this.canvas.height) / 2 - height) / 2;

    // console.log("%cGetTextBoundingRect", "color: red", _left, _top, width, height);

    return { x: _left, y: _top, height, width };
  }

  /**
   * @deprecated this function is not work
   */
  public isOutOfCanvas() {
    const { x, y, width, height } = this.getTextBoundingRect();

    if (x + width > this.canvas.width || y + height > this.canvas.height) {
      return true;
    }

    return false;
  }

  public drawText() {
    const { width, height } = this.getTextBoundingRect();

    this.width = width;
    this.height = height;
    // this.x = x;
    // this.y = y;

    this.context.fillStyle = this.color;
    this.context.textAlign = "left";
    this.context.textBaseline = "top";

    this.textList.forEach((t, i) => {
      this.context.fillText(
        t,
        this.x + this.padding / 2,
        i === 0 ? this.y + (this.padding / 2) * i * 32 : this.y + i * (this.fontSize + 2),
      );
    });

    if (this.selected) {
      this.context.lineWidth = 1;
      this.context.strokeStyle = "#fff";
      this.context.strokeRect(this.x, this.y, this.width, this.height);

      this.DeleteImage.onload = () => {
        this.context.drawImage(this.DeleteImage, this.x - 12, this.y - 12, 24, 24);
      };
      this.context.drawImage(this.DeleteImage, this.x - 12, this.y - 12, 24, 24);
    }

    this.context.restore();
  }

  public tapWhere(x: number, y: number) {
    const zoomW = 24;
    const zoomH = 24;
    const zoomX = this.x + this.width - 12;
    const zoomY = this.y + this.height - 12;

    const delW = 24;
    const delH = 24;
    const delX = this.x - 12;
    const delY = this.y - 12;

    const moveX = this.x - 10;
    const moveY = this.y - 10;

    if (x - zoomX >= 0 && y - zoomY >= 0 && zoomX + zoomW - x >= 0 && zoomY + zoomH - y >= 0) {
      return (this.lastTapedPlace = "zoom");
    }

    if (x - delX >= 0 && y - delY >= 0 && delX + delW - x >= 0 && delY + delH - y >= 0) {
      return (this.lastTapedPlace = "delete");
    }

    if (
      x - moveX >= 0 &&
      y - moveY >= 0 &&
      moveX + this.width - x >= 0 &&
      moveY + this.height - y >= 0
    ) {
      return (this.lastTapedPlace = "text");
    }

    return (this.lastTapedPlace = null);
  }
}

export { Text };
