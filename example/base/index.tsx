import React, { FunctionComponent, useState } from "react";
import ReactDOM from "react-dom";
// import VConsole from "vconsole";

import { Graffiti } from "../../src";

import "./index.less";

const bgList = [
  // "https://s1.firstleap.cn/s/visitor/66897562009009941599471788324.jpg",
  // "https://s1.firstleap.cn/s/visitor/206562666703746341599471663168.jpg",
  // "https://media.prod.mdn.mozit.cloud/attachments/2013/06/22/5397/7a3ec0cae64a95ad454ac3bc2c71c004/rhino.jpg",
  // "https://media.prod.mdn.mozit.cloud/attachments/2012/07/09/205/c86a62360a8c3b1347e651244d6b3137/Canvas_art_gallery.jpg",
  // "https://s1.firstleap.cn/s/visitor/55853793621113051598262939310.png",
  "https://classflow-file.firstleap.cn/image/20200428/15880339391588033939DdKxGh.jpg",
];

// new VConsole();

const Base: FunctionComponent = () => {
  const [index, setIndex] = useState(0);
  const [bg, setBg] = useState(bgList[index]);

  const handleConfirm = (img: string) => {
    console.log(img);
    setIndex(index + 1);
    setBg(bgList[index + 1]);
  };

  return (
    <Graffiti
      key={index}
      className="custom-graffiti"
      backgroundImageURL={bg}
      PencilIcon={<i className="iconfont iconpencil" />}
      ArrowIcon={<i className="iconfont iconchangjiantou" />}
      UndoIcon={<i className="iconfont iconundo" />}
      RedoIcon={<i className="iconfont iconredo" />}
      TextIcon={<i className="iconfont icontext" />}
      ReverseIcon={<i className="iconfont iconfanzhuan-zuo" />}
      DeleteIcon={<i className="iconfont icondelete" />}
      onConfirm={handleConfirm}
    />
  );
};

ReactDOM.render(<Base />, document.getElementById("root"));
