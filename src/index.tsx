import React, { Component, CSSProperties, ChangeEvent, ReactNode } from "react";
import ClassNames from "classnames";

import { Graffito } from "./graffiti";

import "./style";

const pencilColorList = ["#FFFFFF", "#333333", "#FF5555", "#50C081", "#3CBEEF", "#FFE04E"];
const dotSizeList = [1, 4, 6];
// const operatorList = ["pencil", "text", "arrow", "reverser"];

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
}

class Graffiti extends Component<GraffitiProps, GraffitiState> {
  private graffito: Graffito | null;
  private inputRef: HTMLInputElement | null;

  constructor(props: GraffitiProps) {
    super(props);

    this.graffito = null;
    this.inputRef = null;

    this.state = {
      inputVisible: false,
      inputValue: "",
      currentOperator: undefined,
    };
  }

  componentDidMount() {
    const { backgroundImageURL } = this.props;

    const canvas = document.getElementById("graffiti");

    if (canvas) {
      this.graffito = new Graffito(canvas as HTMLCanvasElement, { backgroundImageURL });
    }
  }

  handleAddArrow = () => {};

  handleAddPencil = () => {};

  handleAddText = () => {};

  handleOpenTextInput = () => {
    this.setState({ inputVisible: true });
    this.inputRef?.focus();
  };

  setPencilColor = (color: string) => {
    this.graffito?.setPencilColor(color);
  };

  setPencilSize = (size: number) => {
    this.graffito?.setPencilSize(size);
  };

  setOperator = (name: OperatorName) => {
    if (name === "text") {
      this.setState({ inputVisible: true });
      this.graffito?.setMode("line");
    }
    if (name === "arrow") {
      this.graffito?.setMode("arrow");
    }
    this.setState({ currentOperator: name });
  };

  handleRedo = () => {};

  handleUndo = () => {};

  handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ inputValue: e.target.value.trim() });
  };

  handleCancelInput = () => {
    this.setState({ inputValue: "", inputVisible: false });
  };

  handleConfirmInput = () => {};

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
    const { inputVisible, inputValue, currentOperator } = this.state;

    return (
      <div className={ClassNames("graffiti-wrapper", className)} style={style}>
        <div className="canvas-container">
          <canvas id="graffiti" className="lower-canvas">
            Your browser not supported canvas!!!
          </canvas>
          <canvas className="upper-canvas">Your browser not supported canvas!!!</canvas>
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

        <div className="color-list-and-dot-size-list">
          <ul className="dot-size-list">
            {dotSizeList.map((size, i) => {
              return (
                <li
                  onClick={() => this.setPencilSize(size)}
                  key={i}
                  style={{ width: size + 10, height: size + 10 }}
                />
              );
            })}
          </ul>
          <span className="divider" />
          <ul className="color-list">
            {pencilColorList.map((color, i) => {
              return (
                <li
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

          <input
            ref={(node) => (this.inputRef = node)}
            type="text"
            autoFocus
            onChange={this.handleInputChange}
            value={inputValue}
          />
        </div>
      </div>
    );
  }
}

export { Graffiti };
export default Graffiti;
