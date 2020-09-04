import React, { Component, CSSProperties, ChangeEvent, ReactNode } from "react";
import ClassNames from "classnames";

import { Sketchpad } from "./Sketchpad";

import "./style";

const colorList = ["#FFFFFF", "#333333", "#FF5555", "#50C081", "#3CBEEF", "#FFE04E"];
const dotSizeList = [1, 4, 6];

type OperatorName = "pencil" | "text" | "arrow" | "reverser";

export interface GraffitiProps {
  style?: CSSProperties;
  className?: string;
  backgroundImageURL: string;
  ReverseIcon?: ReactNode;
  ArrowIcon?: ReactNode;
  PencilIcon?: ReactNode;
  TextIcon?: ReactNode;
  UndoIcon?: ReactNode;
  RedoIcon?: ReactNode;
  onConfirm?: (data: string) => void;
  hideConfirmBtn?: boolean;
  confirmText?: string;
}

interface GraffitiState {
  inputVisible: boolean;
  inputValue: string;
  currentOperator?: OperatorName;
  curveColor: string;
  curveSize: number;
  arrowColor: string;
  arrowSize: number;
  textColor: string;
}

class Graffiti extends Component<GraffitiProps, GraffitiState> {
  private graffito: Sketchpad | null;
  private inputRef: HTMLTextAreaElement | null;
  private canvas: HTMLCanvasElement;

  constructor(props: GraffitiProps) {
    super(props);

    this.graffito = null;
    this.inputRef = null;

    this.state = {
      inputVisible: false,
      inputValue: "",
      currentOperator: undefined,
      curveColor: colorList[0],
      curveSize: dotSizeList[0],
      arrowColor: colorList[0],
      arrowSize: dotSizeList[0],
      textColor: colorList[0],
    };
  }

  componentDidMount() {
    const { backgroundImageURL } = this.props;

    const canvas = document.getElementById("graffiti") as HTMLCanvasElement;

    if (canvas) {
      this.canvas = canvas;
      this.graffito = new Sketchpad(canvas, {
        backgroundImageURL,
        // onSelectText: this.handleSelectText,
      });
    }
  }

  handleSelectText = (text: string) => {
    // console.log(text);
    this.setState({ inputValue: text, inputVisible: true });
    this.inputRef?.focus();
  };

  handleOpenTextInput = () => {
    this.setState({ inputVisible: true });
  };

  setPencilColor = (color: string) => {
    const { currentOperator } = this.state;

    if (currentOperator === "pencil") {
      this.setState({ curveColor: color });
      this.graffito?.setCurveColor(color);
    }

    if (currentOperator === "arrow") {
      this.setState({ arrowColor: color });
      this.graffito?.setArrowColor(color);
    }
  };

  setTextColor = (color: string) => {
    this.setState({ textColor: color });
  };

  setPencilSize = (size: number) => {
    if (this.state.currentOperator === "pencil") {
      this.graffito?.setCurveSize(size);
      this.setState({ curveSize: size });
    }
    if (this.state.currentOperator === "arrow") {
      this.graffito?.setArrowSize(size);
      this.setState({ arrowSize: size });
    }
  };

  setOperator = (name: OperatorName) => {
    if (name === "pencil") {
      this.graffito?.setMode("curve");
    }
    if (name === "text") {
      this.inputRef?.focus();

      this.setState({ inputVisible: true });
    }
    if (name === "arrow") {
      this.graffito?.setMode("arrow");
    }
    this.setState({
      currentOperator: name,
      curveColor: colorList[0],
      curveSize: dotSizeList[0],
      textColor: colorList[0],
    });
  };

  handleRedo = () => {};

  handleUndo = () => {};

  handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ inputValue: e.target.value.trim() });
  };

  handleCancelInput = () => {
    this.setState({ inputValue: "", inputVisible: false });
  };

  handleConfirmInput = () => {
    const { inputValue, textColor } = this.state;

    // console.log(this.insertLineBreak(inputValue));

    this.graffito?.addText(this.insertLineBreak(inputValue), textColor);
    this.setState({ inputValue: "", inputVisible: false });
  };

  handleConfirm = () => {
    const { onConfirm } = this.props;

    if (typeof onConfirm === "function" && this.graffito) {
      onConfirm(this.graffito.toDataUrl("image/png", 1));
    }
  };

  insertLineBreak(text: string): string {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      return "";
    }

    if (!this.inputRef) {
      return "";
    }

    context.font = "30px PingFangSC-Semibold, PingFang SC";
    const canvasWidth = this.canvas.getBoundingClientRect().width || 0;

    const wordList = text.split("");

    let res = "";

    let totalWidthOfLine = 0;

    wordList.forEach((w) => {
      const wordWidth = context?.measureText(w).width || 0;
      totalWidthOfLine += wordWidth;
      res += w;

      if (totalWidthOfLine > (canvasWidth - 50)) {
        res += "\n";
        totalWidthOfLine = 0;
      }
    });

    return res;
  }

  render() {
    const {
      className,
      style,
      ReverseIcon,
      ArrowIcon,
      PencilIcon,
      TextIcon,
      UndoIcon,
      RedoIcon,
      hideConfirmBtn,
      confirmText,
    } = this.props;
    const {
      inputVisible,
      inputValue,
      currentOperator,
      curveColor,
      curveSize,
      textColor,
      arrowSize,
      arrowColor,
    } = this.state;

    return (
      <div className={ClassNames("graffiti-wrapper", className)} style={style}>
        <div className="canvas-container">
          <canvas id="graffiti" className="lower-canvas">
            Your browser not supported canvas!!!
          </canvas>
          <div id="text-box-wrapper">{/* <span>cccccc</span> */}</div>
        </div>

        <div className="operator-group">
          <span
            onClick={() => this.setOperator("pencil")}
            className={ClassNames("operator-item, operator-pencil", {
              selected: currentOperator === "pencil",
            })}
          >
            {PencilIcon || "Pencil"}
          </span>
          <span
            onClick={() => this.setOperator("text")}
            className={ClassNames("operator-item, operator-text", {
              selected: currentOperator === "text",
            })}
          >
            {TextIcon || "Text"}
          </span>
          <span
            onClick={() => this.setOperator("arrow")}
            className={ClassNames("operator-item, operator-arrow", {
              selected: currentOperator === "arrow",
            })}
          >
            {ArrowIcon || "Arrow"}
          </span>
          <span
            onClick={() => this.setOperator("reverser")}
            className={ClassNames("operator-item, operator-reverser", {
              selected: currentOperator === "reverser",
            })}
          >
            {ReverseIcon || "Reverse"}
          </span>

          <button
            className={ClassNames("confirm-btn", { hide: hideConfirmBtn })}
            onClick={this.handleConfirm}
          >
            {confirmText || "批阅下一个"}
          </button>
        </div>

        <div className="redo-and-undo-group">
          <span onClick={this.handleUndo} className={ClassNames("undo-icon", { disabled: false })}>
            {UndoIcon || "Undo"}
          </span>
          <span onClick={this.handleRedo} className={ClassNames("redo-icon", { disabled: true })}>
            {RedoIcon || "Redo"}
          </span>
        </div>

        <div
          className={ClassNames("color-list-and-dot-size-list", {
            show: currentOperator === "arrow" || currentOperator === "pencil",
          })}
        >
          <ul className="dot-size-list">
            {dotSizeList.map((size, i) => {
              let selected = false;
              if (currentOperator === "arrow") {
                selected = size === arrowSize;
              }
              if (currentOperator === "pencil") {
                selected = size === curveSize;
              }
              return (
                <li
                  className={ClassNames("dot-size-list-item", { selected })}
                  onClick={() => this.setPencilSize(size)}
                  key={i}
                  style={{ width: size + 5 + i, height: size + 5 + i }}
                />
              );
            })}
          </ul>
          <span className="divider" />
          <ul className="line-color-list">
            {colorList.map((color, i) => {
              let selected = false;
              if (currentOperator === "arrow") {
                selected = color === arrowColor;
              }
              if (currentOperator === "pencil") {
                selected = color === curveColor;
              }
              return (
                <li
                  className={ClassNames("line-color-list-item", { selected })}
                  onClick={() => this.setPencilColor(color)}
                  key={i}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </ul>
        </div>

        <div className={ClassNames("text-input", { show: inputVisible })}>
          <p>
            <button className="cancel-input-btn" onClick={this.handleCancelInput}>
              取消
            </button>
            <button
              className="confirm-input-btn"
              onClick={this.handleConfirmInput}
              disabled={!inputValue}
            >
              完成
            </button>
          </p>

          <textarea
            ref={(node) => (this.inputRef = node)}
            autoFocus
            onChange={this.handleInputChange}
            value={inputValue}
            style={{ color: textColor }}
            wrap="hard"
            rows={5}
            cols={21}
          />

          <ul className="text-color-list">
            {colorList.map((color, i) => {
              return (
                <li
                  className={ClassNames("text-color-list-item", { selected: color === textColor })}
                  onClick={() => this.setTextColor(color)}
                  key={i}
                  style={{ backgroundColor: color }}
                />
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}

export { Graffiti };
export default Graffiti;
