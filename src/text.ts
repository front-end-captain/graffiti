import ZoomIcon from "./assets/zoom.png";
import DeleteIcon from "./assets/delete.png";

interface TextOptions {
  text: string;
  color: string;
}

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
  }

  public setContext(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  public setSelected(selected: boolean) {
    this.selected = selected;
  }

  public drawText(color?: string, initX?: number, initY?: number) {
    const textList = this.content.split("\n");
    this.context.save();
    this.context.font = "30px PingFangSC-Semibold, PingFang SC";
    const { width: textWidth } = this.context.measureText(textList[0]);

    // console.log("initLeft, initTop", initLeft, initTop);
    // console.log(textWidth);

    const _left =
      this.canvas.width === window.innerWidth
        ? this.canvas.width / 2 - (textWidth + 20) / 2
        : window.innerWidth / 2 - (textWidth + 20) / 2;

    const left = initX || (_left < 0 ? 10 : _left);
    const top =
      initY ||
      (this.canvas.height === window.innerHeight
        ? this.canvas.height / 2 - 32 / 2
        : window.innerHeight / 2 - 32 / 2);
    const height = 32 * textList.length;
    const width = textWidth > this.canvas.width ? this.canvas.width - 25 : textWidth;

    this.x = left;
    this.y = top;
    this.width = width;
    this.height = height;

    this.context.fillStyle = color || this.color;
    this.context.textAlign = "left";
    this.context.textBaseline = "middle";

    textList.forEach((t, i) => {
      this.context.fillText(t, this.x, this.y + i * 32);
    });

    if (this.selected) {
      this.context.lineWidth = 1;
      this.context.strokeStyle = "#fff";
      this.context.strokeRect(this.x, this.y, this.width, this.height);

      this.DeleteImage.onload = () => {
        this.context.drawImage(this.DeleteImage, this.x - 15, this.y - 15, 24, 24);
      };
      this.ZoomImage.onload = () => {
        this.context.drawImage(this.ZoomImage, this.x + this.width, this.y + this.height, 24, 24);
      };
    }
    this.context.restore();
  }
}

export { Text };
