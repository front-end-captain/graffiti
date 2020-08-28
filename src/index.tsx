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
  private graffito: Graffito | null;

  constructor(props: GraffitiProps) {
    super(props);

    this.graffito = null;
  }

  componentDidMount() {
    const { backgroundImageURL } = this.props;

    const canvas = document.getElementById("graffiti");

    if (canvas) {
      this.graffito = new Graffito(canvas as HTMLCanvasElement, { backgroundImageURL });
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
