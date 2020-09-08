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

  constructor(context: CanvasRenderingContext2D, options: TextOptions) {
    this.context = context;

    this.content = options.text;
    this.color = options.color;
  }
}

export { Text };
