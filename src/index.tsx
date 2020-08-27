import React, { Component, CSSProperties } from "react";
import ClassNames from "classnames";

import { Graffito } from "./graffiti";

import "./style";

const bg = "https://mdn.mozillademos.org/files/5397/rhino.jpg";
// const bg = "https://media.prod.mdn.mozit.cloud/attachments/2012/07/09/205/c86a62360a8c3b1347e651244d6b3137/Canvas_art_gallery.jpg";

export interface GraffitiProps {
  style?: CSSProperties;
  className?: string;
  backgroundImage?: string;
}

class Graffiti extends Component<GraffitiProps> {
  componentDidMount() {
    const canvas = document.getElementById("graffiti");

    if (canvas) {
      new Graffito(canvas as HTMLCanvasElement, { backgroundImageURL: bg });
    }
  }

  render() {
    const { className, style } = this.props;

    return (
      <div className={ClassNames("graffiti-wrapper", className)} style={style}>
        <canvas id="graffiti">Your browser not supported canvas!!!</canvas>
      </div>
    );
  }
}

export { Graffiti };
export default Graffiti;
