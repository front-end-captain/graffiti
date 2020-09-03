import React, { Component, CSSProperties, ChangeEvent, ReactNode } from "react";
import ClassNames from "classnames";

import { Graffito } from "./graffiti";

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
  lineColor: string;
  lineSize: number;
  textColor: string;
}

class Graffiti extends Component<GraffitiProps, GraffitiState> {
  private graffito: Graffito | null;
  private inputRef: HTMLTextAreaElement | null;

  constructor(props: GraffitiProps) {
    super(props);

    this.graffito = null;
    this.inputRef = null;

    this.state = {
      inputVisible: false,
      inputValue: "",
      currentOperator: undefined,
      lineColor: colorList[0],
      lineSize: dotSizeList[0],
      textColor: colorList[0],
    };
  }

  componentDidMount() {
    const { backgroundImageURL } = this.props;

    const canvas = document.getElementById("graffiti") as HTMLCanvasElement;
    const upperCanvas = document.getElementById("graffiti-cover") as HTMLCanvasElement;

    if (canvas) {
      this.graffito = new Graffito(canvas, upperCanvas, {
        backgroundImageURL,
        onSelectText: this.handleSelectText,
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
    this.setState({ lineColor: color });
    this.graffito?.setPencilColor(color);
  };

  setTextColor = (color: string) => {
    this.setState({ textColor: color });
  };

  setPencilSize = (size: number) => {
    this.setState({ lineSize: size });
    if (this.state.currentOperator === "pencil") {
      this.graffito?.setPencilSize(size);
    }
    if (this.state.currentOperator === "arrow") {
      this.graffito?.setArrowSize(size);
    }
  };

  setOperator = (name: OperatorName) => {
    if (name === "pencil") {
      this.graffito?.setMode("line");
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
      lineColor: colorList[0],
      lineSize: dotSizeList[0],
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
    this.graffito?.drawText(inputValue, textColor, 20, 200);
    this.setState({ inputValue: "", inputVisible: false });
  };

  handleConfirm = () => {
    const { onConfirm } = this.props;

    if (typeof onConfirm === "function" && this.graffito) {
      onConfirm(this.graffito.toDataUrl("image/png", 1));
    }
  };

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
      lineColor,
      lineSize,
      textColor,
    } = this.state;

    return (
      <div className={ClassNames("graffiti-wrapper", className)} style={style}>
        <div className="canvas-container">
          <canvas className="upper-canvas" id="graffiti-cover">
            Your browser not supported canvas!!!
          </canvas>
          <canvas id="graffiti" className="lower-canvas">
            Your browser not supported canvas!!!
          </canvas>
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
              return (
                <li
                  className={ClassNames("dot-size-list-item", { selected: size === lineSize })}
                  onClick={() => this.setPencilSize(size)}
                  key={i}
                  style={{ width: size + 10, height: size + 10 }}
                />
              );
            })}
          </ul>
          <span className="divider" />
          <ul className="line-color-list">
            {colorList.map((color, i) => {
              return (
                <li
                  className={ClassNames("line-color-list-item", { selected: color === lineColor })}
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
