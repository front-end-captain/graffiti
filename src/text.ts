import ZoomIcon from "./assets/zoom.png";
import DeleteIcon from "./assets/delete.png";

interface TextOptions {
  text: string;
  color: string;
}

type TapedPlace = "zoom" | "delete" | "text" | null;

class Text {
  public x: number;
  public y: number;

  public width: number;
  public height: number;

  public lineAmount: number;

  public selected: boolean;

  public content: string;
  public color: string;

  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  private DeleteImage: HTMLImageElement;
  private ZoomImage: HTMLImageElement;

  public lastTapedPlace: TapedPlace;

  public readonly id: number;

  public centerX: number;
  public centerY: number;

  public startX: number;

  public startY: number;

  public initWidth: number;
  public initHeight: number;

  public initFontSize: number;

  public fontSize: number;

  public readonly padding: number;

  constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, options: TextOptions) {
    this.context = context;
    this.canvas = canvas;

    this.content = options.text;
    this.color = options.color;

    this.selected = true;

    this.DeleteImage = new Image();
    this.DeleteImage.src = DeleteIcon;

    this.ZoomImage = new Image();
    this.ZoomImage.src = ZoomIcon;

    this.lastTapedPlace = null;

    this.id = Date.now();

    this.fontSize = 30;
    this.initFontSize = 30;

    this.padding = 20;

    const textList = this.content.split("\n");
    this.context.font = `${this.initFontSize}px PingFangSC-Semibold, PingFang SC`;
    const { width: textWidth } = this.context.measureText(textList[0]);

    // console.log("initLeft, initTop", initLeft, initTop);
    // console.log(textList, textWidth);

    const height = 32 * textList.length;

    const _left =
      this.canvas.width === window.innerWidth
        ? this.canvas.width / 2 - textWidth / 2
        : ((window.innerWidth - this.canvas.width) / 2 - textWidth) / 2;

    const _top =
      this.canvas.height === window.innerHeight
        ? window.innerHeight / 2 - height / 2
        : ((window.innerHeight - this.canvas.height) / 2 - height) / 2;

    const width = textWidth > this.canvas.width ? this.canvas.width - 25 : textWidth;

    this.x = _left - this.padding;
    this.y = _top - this.padding;
    this.width = width + this.padding;
    this.height = height + this.padding;
    this.initHeight = this.height;
    this.initWidth = this.width;
    this.startX = this.x;
    this.startY = this.y;
    this.lineAmount = textList.length;
    this.centerY = this.y + this.height / 2;
    this.centerX = this.x + this.width / 2;
  }

  public setContext(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  public drawText() {
    const textList = this.content.split("\n");

    // console.log(this.x, this.y, this.width, this.height);

    this.context.font = `${this.fontSize}px PingFangSC-Semibold, PingFang SC`;
    this.context.fillStyle = this.color;
    this.context.textAlign = "left";
    this.context.textBaseline = "top";

    textList.forEach((t, i) => {
      this.context.fillText(
        t,
        this.x + this.padding / 2,
        this.y + this.padding / 2 + this.padding / 4 + i * 32,
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

      this.ZoomImage.onload = () => {
        this.context.drawImage(
          this.ZoomImage,
          this.x + this.width - 12,
          this.y + this.height - 12,
          24,
          24,
        );
      };
      this.context.drawImage(
        this.ZoomImage,
        this.x + this.width - 12,
        this.y + this.height - 12,
        24,
        24,
      );
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
