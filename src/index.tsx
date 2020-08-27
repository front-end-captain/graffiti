import React, { Component, CSSProperties } from "react";
import ClassNames from "classnames";

import { Graffito } from "./graffiti";

import "./style";

export interface GraffitiProps {
  style?: CSSProperties;
  className?: string;
  backgroundImageURL?: string;
}

class Graffiti extends Component<GraffitiProps> {
  componentDidMount() {
    const { backgroundImageURL } = this.props;

    const canvas = document.getElementById("graffiti");

    if (canvas) {
      new Graffito(canvas as HTMLCanvasElement, { backgroundImageURL });
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
