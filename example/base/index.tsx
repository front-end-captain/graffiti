import React, { FunctionComponent } from "react";
import ReactDOM from "react-dom";

import { Graffiti } from "../../src";

import "./index.less";

const bg = "https://media.prod.mdn.mozit.cloud/attachments/2013/06/22/5397/7a3ec0cae64a95ad454ac3bc2c71c004/rhino.jpg";
// const bg = "https://media.prod.mdn.mozit.cloud/attachments/2012/07/09/205/c86a62360a8c3b1347e651244d6b3137/Canvas_art_gallery.jpg";

const Base: FunctionComponent = () => {
  return <Graffiti className="custom-graffiti" backgroundImageURL={bg} />;
};

ReactDOM.render(<Base />, document.getElementById("root"));
