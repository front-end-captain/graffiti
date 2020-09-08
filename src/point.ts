interface BasicPoint {
  x: number;
  y: number;
  time: number;
}

class Point implements BasicPoint {
  public readonly time: number;
  public readonly x: number;
  public readonly y: number;

  constructor(x: number, y: number, time?: number) {
    this.x = x;
    this.y = y;
    this.time = time || Date.now();
  }
}

export { Point };
