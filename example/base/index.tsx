import React, { FunctionComponent } from "react";
import ReactDOM from "react-dom";

import { Graffiti } from "../../src";

import "./index.less";

// const bg = "https://media.prod.mdn.mozit.cloud/attachments/2013/06/22/5397/7a3ec0cae64a95ad454ac3bc2c71c004/rhino.jpg";
// const bg = "https://media.prod.mdn.mozit.cloud/attachments/2012/07/09/205/c86a62360a8c3b1347e651244d6b3137/Canvas_art_gallery.jpg";
const bg = "https://s1.firstleap.cn/s/visitor/55853793621113051598262939310.png";

const Base: FunctionComponent = () => {
  return (
    <Graffiti
      className="custom-graffiti"
      backgroundImageURL={bg}
      PencilIcon={<i className="iconfont iconpencil" />}
      ArrowIcon={<i className="iconfont iconchangjiantou" />}
      UndoIcon={<i className="iconfont iconundo" />}
      RedoIcon={<i className="iconfont iconredo" />}
      TextIcon={<i className="iconfont icontext" />}
      ReverseIcon={<i className="iconfont iconfanzhuan-zuo" />}
    />
  );
};

ReactDOM.render(<Base />, document.getElementById("root"));
