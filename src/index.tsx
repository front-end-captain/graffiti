import React, { Component, CSSProperties, ChangeEvent, ReactNode } from "react";
import ClassNames from "classnames";

import { Graffito, DrawDataGroup } from "./graffito";

import "./style";

const colorList = ["#FFFFFF", "#333333", "#FF5555", "#50C081", "#3CBEEF", "#FFE04E"];
const dotSizeList = [6, 10, 14];
const fontSizeList = [14, 18, 22, 26, 30];

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
  DeleteIcon?: ReactNode;
  onConfirm?: (data: string, changed: boolean) => void;
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
  textSize: number;
  undoDisabled: boolean;
  redoDisabled: boolean;
}

class Graffiti extends Component<GraffitiProps, GraffitiState> {
  private graffito: Graffito | null;
  private inputRef: HTMLTextAreaElement | null;
  private canvas: HTMLCanvasElement | null;
  private textMode: "create" | "edit";

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
      textSize: fontSizeList[4],
      undoDisabled: true,
      redoDisabled: true,
    };

    this.textMode = "create";

    this.canvas = null;
  }

  componentDidMount() {
    const { backgroundImageURL } = this.props;
    const { arrowColor, arrowSize, curveColor, curveSize } = this.state;

    const canvas = document.getElementById("graffiti") as HTMLCanvasElement;
    const canvasCache = document.getElementById("graffiti-cache") as HTMLCanvasElement;

    if (canvas) {
      this.canvas = canvas;
      this.graffito = new Graffito(canvas, canvasCache, {
        backgroundImageURL,
        onSelectText: this.handleSelectText,
        onDrawEnd: this.handleDrawEnd,
        arrowSize,
        arrowColor,
        curveColor,
        curveSize,
      });
    }
  }

  componentWillUnmount() {
    this.graffito?.offEvent();
  }

  handleSelectText = (text: string, fontSize: number, color: string) => {
    // console.log(text.replace("\n", ""));
    this.textMode = "edit";
    this.inputRef?.focus();
    this.setState({
      inputValue: text.replace("\n", ""),
      inputVisible: true,
      textSize: fontSize,
      textColor: color,
    });
    this.inputRef?.focus();
  };

  handleDrawEnd = (_: DrawDataGroup[], canUndo: boolean, canRedo: boolean) => {
    this.setState({ undoDisabled: !canUndo, redoDisabled: !canRedo });
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

  setTextSize = (size: number) => {
    this.setState({ textSize: size });
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
    this.graffito?.unActivityEveryText();

    if (name === "pencil") {
      this.graffito?.setMode("curve");
    }
    if (name === "text") {
      this.textMode = "create";
      this.inputRef?.focus();

      this.graffito?.setMode("text");
      this.setState({ inputVisible: true });
    }
    if (name === "arrow") {
      this.graffito?.setMode("arrow");
    }
    if (name === "reverser") {
      this.graffito?.rotateBg();
    }
    this.setState({
      currentOperator: name,
      curveColor: colorList[0],
      curveSize: dotSizeList[0],
      textColor: colorList[0],
      textSize: fontSizeList[4],
    });
  };

  handleRedo = () => {
    const _canRedo = this.graffito?.getCanRedo() || false;

    if (_canRedo) {
      this.graffito?.redo();
    }

    const canRedo = this.graffito?.getCanRedo() || false;
    const canUndo = this.graffito?.getCanUndo() || false;
    this.setState({ undoDisabled: !canUndo, redoDisabled: !canRedo });
  };

  handleUndo = () => {
    const _canUndo = this.graffito?.getCanUndo() || false;

    if (_canUndo) {
      this.graffito?.undo();
    }

    const canUndo = this.graffito?.getCanUndo() || false;
    const canRedo = this.graffito?.getCanRedo() || false;

    this.setState({ undoDisabled: !canUndo, redoDisabled: !canRedo });
  };

  handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ inputValue: e.target.value.trim() });
  };

  handleCancelInput = () => {
    this.setState({ inputValue: "", inputVisible: false });
  };

  handleConfirmInput = () => {
    const { inputValue, textColor, textSize } = this.state;

    // console.log(this.insertLineBreak(inputValue));
    if (this.textMode === "create") {
      this.graffito?.addText(this.insertLineBreak(inputValue), textColor, textSize);
    }
    if (this.textMode === "edit") {
      this.graffito?.editText(this.insertLineBreak(inputValue), textColor, textSize);
    }
    this.setState({ inputValue: "", inputVisible: false });
  };

  handleConfirm = () => {
    const { onConfirm } = this.props;

    // for test
    // const img = document.createElement("img");
    // img.src = this.graffito?.toDataUrl("image/png", 1) || "";
    // document.body.appendChild(img);

    this.setState({ currentOperator: undefined });
    this.graffito?.setMode(undefined);

    if (typeof onConfirm === "function" && this.graffito) {
      if (this.graffito.getDrawData().length > 0) {
        onConfirm(this.graffito.toDataUrl("image/png", 1), true);
      } else {
        onConfirm("", false);
      }
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
    const canvasWidth = this.canvas?.getBoundingClientRect().width || 0;

    const wordList = text.split("").filter((v) => v !== "\n");

    let res = "";

    let totalWidthOfLine = 0;

    wordList.forEach((w) => {
      const wordWidth = context?.measureText(w).width || 0;
      totalWidthOfLine += wordWidth;
      res += w;

      if (totalWidthOfLine > canvasWidth - 70) {
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
      DeleteIcon,
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
      textSize,
      arrowSize,
      arrowColor,
      undoDisabled,
      redoDisabled,
    } = this.state;

    return (
      <div className={ClassNames("graffiti-wrapper", className)} style={style}>
        <div className="canvas-container">
          <canvas id="graffiti" className="lower-canvas">
            Your browser not supported canvas!!!
          </canvas>
          <canvas id="graffiti-cache" className="cache-canvas">
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
          <span
            onClick={this.handleUndo}
            className={ClassNames("undo-icon", { disabled: undoDisabled })}
          >
            {UndoIcon || "Undo"}
          </span>
          <span
            onClick={this.handleRedo}
            className={ClassNames("redo-icon", { disabled: redoDisabled })}
          >
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
                  style={{ width: size - i, height: size - i }}
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
            autoFocus={inputVisible}
            onChange={this.handleInputChange}
            value={inputValue}
            style={{ color: textColor }}
            wrap="hard"
            rows={5}
          />

          <ul className="text-size-list">
            {fontSizeList.map((size, i) => {
              return (
                <li
                  className={ClassNames("text-size-list-item", { selected: size === textSize })}
                  onClick={() => this.setTextSize(size)}
                  key={i}
                >
                  {size}
                </li>
              );
            })}
          </ul>

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

        <div id="delete-zone">
          {DeleteIcon}
          <span>拖动到此处删除</span>
        </div>
      </div>
    );
  }
}

export { Graffiti };
export default Graffiti;
