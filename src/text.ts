import ZoomIcon from "./assets/zoom.png";
import DeleteIcon from "./assets/delete.png";

interface TextOptions {
  text: string;
  color: string;
}

type TapedPlace = "zoom" | "delete" | "text";

class Text {
  public x: number;
  public y: number;

  public width: number;
  public height: number;
  public lintAmount: number;

  public angle: number;
  public selected: boolean;

  public content: string;
  public color: string;

  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  private DeleteImage: HTMLImageElement;
  private ZoomImage: HTMLImageElement;

  public lastTapedPlace: TapedPlace | null;

  constructor(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, options: TextOptions) {
    this.context = context;
    this.canvas = canvas;

    this.content = options.text;
    this.color = options.color;

    this.x = 0;
    this.y = 0;

    this.width = 0;
    this.height = 0;
    this.lintAmount = 1;
    this.angle = 0;
    this.selected = true;

    this.DeleteImage = new Image();
    this.DeleteImage.src = DeleteIcon;

    this.ZoomImage = new Image();
    this.ZoomImage.src = ZoomIcon;

    this.lastTapedPlace = null;
  }

  public setContext(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  public setSelected(selected: boolean) {
    console.log("set selected", selected);

    this.selected = selected;
  }

  public setContent(content: string) {
    this.content = content;
  }

  public setColor(color: string) {
    this.color = color;
  }

  public drawText(color?: string, initX?: number, initY?: number) {
    const textList = this.content.split("\n");
    this.context.save();
    this.context.font = "30px PingFangSC-Semibold, PingFang SC";
    const { width: textWidth } = this.context.measureText(textList[0]);

    // console.log("initLeft, initTop", initLeft, initTop);
    // console.log(textList, textWidth);

    const height = 32 * textList.length;

    const _left =
      this.canvas.width === window.innerWidth
        ? this.canvas.width / 2 - textWidth / 2
        : window.innerWidth / 2 - textWidth / 2;

    const left = initX || (_left < 0 ? 0 : _left);
    const top =
      initY ||
      (this.canvas.height === window.innerHeight
        ? this.canvas.height / 2 - height / 2
        : window.innerHeight / 2 - height / 2);

    const width = textWidth > this.canvas.width ? this.canvas.width - 25 : textWidth;

    this.x = left;
    this.y = top;
    this.width = width;
    this.height = height;

    // console.log(this.x, this.y, this.width, this.height);

    this.context.fillStyle = color || this.color;
    this.context.textAlign = "left";
    this.context.textBaseline = "top";

    textList.forEach((t, i) => {
      this.context.fillText(t, this.x, this.y + i * 32);
    });

    // console.log(this.selected);

    if (this.selected) {
      this.context.lineWidth = 1;
      this.context.strokeStyle = "#fff";
      this.context.strokeRect(this.x - 10, this.y - 10, this.width + 20, this.height + 20);

      this.DeleteImage.onload = () => {
        this.context.drawImage(this.DeleteImage, this.x - 20, this.y - 20, 24, 24);
      };

      this.context.drawImage(this.DeleteImage, this.x - 20, this.y - 20, 24, 24);
      this.ZoomImage.onload = () => {
        this.context.drawImage(
          this.ZoomImage,
          this.x - 5 + this.width,
          this.y - 5 + this.height,
          24,
          24,
        );
      };

      this.context.drawImage(
        this.ZoomImage,
        this.x - 5 + this.width,
        this.y - 5 + this.height,
        24,
        24,
      );
    }
    this.context.restore();
  }

  public tapWhere(x: number, y: number) {
    const zoomW = 24;
    const zoomH = 24;
    const zoomX = this.x + this.width;
    const zoomY = this.y + this.height;

    const delW = 24;
    const delH = 24;
    const delX = this.x - 20;
    const delY = this.y - 20;

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
      moveX + this.width + 20 - x >= 0 &&
      moveY + this.height + 20 - y >= 0
    ) {
      return (this.lastTapedPlace = "text");
    }

    return (this.lastTapedPlace = null);
  }
}

export { Text };
