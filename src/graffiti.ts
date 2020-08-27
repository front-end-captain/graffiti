/* eslint-disable no-console */

interface Options {
  backgroundImageURL?: string;
}

class Graffito {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private mouseButtonDown: boolean;
  private backgroundColor: string;
  // private pencilColor: string;
  private backgroundImageURL?: string;

  constructor(canvas: HTMLCanvasElement, options: Options = {}) {
    const _context = canvas.getContext("2d");

    if (!_context) {
      throw new Error("get canvas context error");
    }

    this.canvas = canvas;

    this.context = _context;

    this.backgroundImageURL = options.backgroundImageURL;

    this.mouseButtonDown = false;
    this.backgroundColor = "#fff";
    // this.pencilColor = "#555";

    this.clear();

    this.bindEvent();

    if (this.backgroundImageURL) {
      this.fromDataURL(this.backgroundImageURL);
    }
  }

  private clear() {
    this.context.fillStyle = this.backgroundColor;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private bindEvent(): void {
    this.canvas.style.touchAction = "none";
    this.canvas.style.msTouchAction = "none";

    if (window.PointerEvent) {
      this.handlePointerEvents();
    } else {
      this.handleMouseEvents();

      if ("ontouchstart" in window) {
        this.handleTouchEvents();
      }
    }
  }

  public fromDataURL(dataUrl: string, callback?: (error?: string | Event) => void): void {
    const image = new Image();

    image.onload = (): void => {
      let w = document.body.clientWidth;
      let h = document.body.clientHeight;

      console.log(image.width, image.height);

      if (image.width > image.height) {
        h = Number(((document.body.clientWidth / image.width) * image.height).toFixed(2));
      }

      if (image.width < document.body.clientWidth) {
        w = image.width;
        h = image.height;
      }

      this.canvas.width = w;
      this.canvas.height = h;

      this.context.drawImage(image, 0, 0, w, h);

      if (callback) {
        callback();
      }
    };
    image.onerror = (error): void => {
      if (callback) {
        callback(error);
      }
    };
    image.src = dataUrl;
  }

  private handleMouseDown = (event: MouseEvent): void => {
    console.log("%cMouseDownEvent", "color: red", event);

    if (event.which === 1) {
      this.mouseButtonDown = true;
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
    console.log("%cMouseMoveEvent", "color: blue", event, this.mouseButtonDown);
  };

  private handleMouseUp = (event: MouseEvent): void => {
    if (event.which === 1 && this.mouseButtonDown) {
      this.mouseButtonDown = false;
      console.log("%cMouseUpEvent", "color: orange", event, this.mouseButtonDown);
    }
  };

  private handleTouchStart = (event: TouchEvent): void => {
    // Prevent scrolling.
    event.preventDefault();

    if (event.targetTouches.length === 1) {
      const touch = event.changedTouches[0];
      console.log(touch);
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    // Prevent scrolling.
    event.preventDefault();

    const touch = event.targetTouches[0];
    console.log(touch);
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    const wasCanvasTouched = event.target === this.canvas;
    if (wasCanvasTouched) {
      event.preventDefault();

      const touch = event.changedTouches[0];
      console.log(touch);
    }
  };

  private handlePointerEvents(): void {
    this.mouseButtonDown = false;

    this.canvas.addEventListener("pointerdown", this.handleMouseDown);
    this.canvas.addEventListener("pointermove", this.handleMouseMove);
    document.addEventListener("pointerup", this.handleMouseUp);
  }

  private handleMouseEvents(): void {
    this.mouseButtonDown = false;

    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  private handleTouchEvents(): void {
    this.canvas.addEventListener("touchstart", this.handleTouchStart);
    this.canvas.addEventListener("touchmove", this.handleTouchMove);
    this.canvas.addEventListener("touchend", this.handleTouchEnd);
  }
}

export { Graffito };
