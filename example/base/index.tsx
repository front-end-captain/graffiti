import React from "react";
import ReactDOM from "react-dom";

import { Graffiti } from "../../src";

import "./index.less";

const Base = () => {
  return <Graffiti className="custom-graffiti" />;
};

ReactDOM.render(<Base />, document.getElementById("root"));
