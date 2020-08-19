import React from "react";
import classNames from "classnames";
import styled, { css, singleLine } from "renderer/styles";
import DefaultOptionComponent, {
  OptionComponentProps,
} from "renderer/basics/SimpleSelect/DefaultOptionComponent";
import { first, findWhere, find } from "underscore";
import Filler from "renderer/basics/Filler";
import Icon from "renderer/basics/Icon";
import Floater from "renderer/basics/Floater";
import { LocalizedString } from "common/types";

export interface BaseOptionType {
  label: LocalizedString;
  value: any;
}

export const FloaterSpacer = styled.div`
  width: 8px;
  flex-shrink: 0;
`;

const SimpleSelectDiv = styled.div`
  cursor: default;
  flex-grow: 1;

  background: ${(props) => props.theme.inputBackground};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 2px;

  transition: border-color: 0.1s;

  &:hover {
    border-color: ${(props) => props.theme.inputBorderFocused};
  }

  &:focus {
    outline: none;
  }
`;

const wrapperPadding = 10;
const iconPadding = 14;

const wrapperLike = css`
  ${singleLine};
  min-width: 180px;
  min-height: 2em;
  padding: ${wrapperPadding}px;
`;

const ValueWrapper = styled.div`
  ${wrapperLike};

  display: flex;
  flex-flow: row;
  align-items: center;
`;

const OptionWrapperDiv = styled.div`
  ${wrapperLike};
  background: ${(props) => props.theme.inputBackground};

  &.focused {
    background: ${(props) => props.theme.inputFocusedBackground};
  }

  &.selected {
    background: ${(props) => props.theme.inputSelectedBackground};
  }
`;

class OptionWrapper extends React.PureComponent<
  React.HTMLAttributes<HTMLDivElement>
> {
  el: HTMLElement;

  render() {
    return <OptionWrapperDiv {...this.props} ref={this.gotEl} />;
  }

  gotEl = (el: HTMLElement) => {
    this.el = el;
    if (this.el) {
      this.updateScroll();
    }
  };

  componentDidUpdate() {
    this.updateScroll();
  }

  updateScroll() {
    const { className } = this.props;
    if (/focused/.test(className)) {
      (this.el as any).scrollIntoViewIfNeeded();
    }
  }
}

const Bar = styled.div`
  height: auto;
  width: 1px;
  background: ${(props) => props.theme.inputBorderFocused};
  align-self: stretch;
`;

const IconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-right: ${iconPadding - wrapperPadding}px;
  padding-left: ${iconPadding}px;
`;

const OptionsAnchorDiv = styled.div`
  position: relative;
`;

const OptionsDiv = styled.div`
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  padding: 4px 0;
  border-radius: 2px;

  border: 1px solid ${(props) => props.theme.inputBorder};

  z-index: 10;

  max-height: 400px;
  overflow-y: auto;
`;

const DummyOption = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
  color: ${(props) => props.theme.ternaryText};
`;

const searchClearThreshold = 2000; // 2 seconds
const keyboardFocusTimeout = 250;

export default class SimpleSelect<
  OptionType extends BaseOptionType
> extends React.PureComponent<Props<OptionType>, State<OptionType>> {
  constructor(props: Props<OptionType>, context: any) {
    super(props, context);
    this.state = {
      open: false,
      focusedValue: first(props.options),
      search: "",
      lastSearchAt: Date.now(),
      lastKeyboardFocusAt: 0,
    };
  }

  render() {
    const {
      value,
      OptionComponent = DefaultOptionComponent,
      isLoading,
      className,
    } = this.props;
    return (
      <SimpleSelectDiv
        className={className}
        onClick={this.onToggle}
        onKeyDown={this.onKeyDown}
        onKeyPress={this.onKeyPress}
        tabIndex={-1}
        onBlur={this.onBlur}
      >
        <ValueWrapper>
          {value ? (
            <OptionComponent option={value} />
          ) : (
            <DummyOption>Select...</DummyOption>
          )}
          <Filler />
          {isLoading ? (
            <>
              <Floater />
              <FloaterSpacer />
            </>
          ) : null}
          <Bar />
          <IconWrapper>
            <Icon icon="caret-down" />
          </IconWrapper>
        </ValueWrapper>
        <OptionsAnchorDiv>{this.renderOptions()}</OptionsAnchorDiv>
      </SimpleSelectDiv>
    );
  }

  onKeyDown = (ev: React.KeyboardEvent<HTMLElement>) => {
    if (
      ev.key === "ArrowUp" ||
      ev.key === "PageUp" ||
      ev.key === "ArrowDown" ||
      ev.key === "PageDown" ||
      ev.key === "Home" ||
      ev.key === "End"
    ) {
      ev.preventDefault();
      const { options } = this.props;
      let { focusedValue } = this.state;
      if (!focusedValue) {
        focusedValue = this.props.value;
      }

      if (!focusedValue) {
        return;
      }
      let currentIndex = options.indexOf(focusedValue);
      let newIndex = currentIndex;

      if (ev.key === "ArrowUp") {
        newIndex -= 1;
      } else if (ev.key === "ArrowDown") {
        newIndex += 1;
      } else if (ev.key === "PageUp") {
        newIndex -= 5;
      } else if (ev.key === "PageDown") {
        newIndex += 5;
      } else if (ev.key === "Home") {
        newIndex = 0;
      } else if (ev.key === "End") {
        newIndex = options.length - 1;
      }

      if (newIndex < 0) {
        newIndex = 0;
      } else if (newIndex >= options.length) {
        newIndex = options.length - 1;
      }

      let newFocusedValue = options[newIndex];
      this.setState({
        focusedValue: newFocusedValue,
        lastKeyboardFocusAt: Date.now(),
      });
    }

    if (ev.key === "Enter") {
      this.close();
      this.props.onChange(this.state.focusedValue);
    }
  };

  onKeyPress = (ev: React.KeyboardEvent<HTMLElement>) => {
    let search: string;

    let state = this.state;
    let prefix =
      Date.now() - state.lastSearchAt > searchClearThreshold
        ? ""
        : state.search;
    search = (prefix + ev.key).toLowerCase();

    this.setState({
      search,
      lastSearchAt: Date.now(),
    });

    const focusedValue = find(
      this.props.options,
      (x) =>
        typeof x.label === "string" && x.label.toLowerCase().startsWith(search)
    );
    if (focusedValue) {
      this.setState({ focusedValue, lastKeyboardFocusAt: Date.now() });
    }
  };

  renderOptions() {
    const { open } = this.state;
    if (!open) {
      return null;
    }
    const { focusedValue } = this.state;
    const {
      options,
      value,
      OptionComponent = DefaultOptionComponent,
    } = this.props;

    return (
      <OptionsDiv>
        {options.map((option, i) => {
          const focused = focusedValue === option;
          const selected = value === option;
          return (
            <OptionWrapper
              key={i}
              className={classNames({ focused, selected })}
              data-value={JSON.stringify(option.value)}
              onClick={this.onOptionClick}
              onMouseEnter={this.onOptionMouseEnter}
            >
              <OptionComponent key={i} option={option} />
            </OptionWrapper>
          );
        })}
      </OptionsDiv>
    );
  }

  onOptionClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    ev.stopPropagation();
    const { onChange } = this.props;
    onChange(this.getValueForWrapper(ev.currentTarget));
    this.close();
  };

  onOptionMouseEnter = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() - this.state.lastKeyboardFocusAt < keyboardFocusTimeout) {
      return;
    }

    this.setState({ focusedValue: this.getValueForWrapper(ev.currentTarget) });
  };

  getValueForWrapper(el: HTMLElement) {
    let dataValue = JSON.parse(el.dataset.value) as any;
    const { options, onChange } = this.props;
    return findWhere(options, { value: dataValue });
  }

  onToggle = () => {
    this.setState((state) => ({
      open: !state.open,
    }));
    if (this.state.open) {
      this.close();
    } else {
      this.open();
    }
  };

  onBlur = () => {
    this.close();
  };

  open() {
    this.setState({ open: true, focusedValue: this.props.value });
  }

  close() {
    this.setState({ open: false });
  }
}

type OnChange<OptionType> = (value: OptionType) => void;

interface Props<OptionType> {
  options: OptionType[];
  value: OptionType;
  onChange: OnChange<OptionType>;
  isLoading?: boolean;
  OptionComponent?: React.ComponentType<OptionComponentProps<OptionType>>;
  className?: string;
}

interface State<OptionType> {
  open: boolean;
  focusedValue: OptionType;
  search: string;
  lastSearchAt: number;
  lastKeyboardFocusAt: number;
}
