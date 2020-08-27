import React from "react";
import ReactDOM from "react-dom";

import { Graffiti } from "../../src";

import "./index.less";

const bg = "https://mdn.mozillademos.org/files/5397/rhino.jpg";
// const bg = "https://media.prod.mdn.mozit.cloud/attachments/2012/07/09/205/c86a62360a8c3b1347e651244d6b3137/Canvas_art_gallery.jpg";

const Base = () => {
  return <Graffiti className="custom-graffiti" backgroundImageURL={bg} />;
};

ReactDOM.render(<Base />, document.getElementById("root"));
