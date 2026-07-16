import React from "react";
import classNames from "classnames";
import { lighten } from "polished";
import styled, { css, singleLine } from "renderer/styles";
import DefaultOptionComponent, {
  OptionComponentProps,
} from "renderer/basics/SimpleSelect/DefaultOptionComponent";
import { find, findIndex, isEqual } from "underscore";
import Filler from "renderer/basics/Filler";
import Floater from "renderer/basics/Floater";
import { T } from "renderer/t";
import { LocalizedString } from "common/types";

export interface BaseOptionType {
  label: LocalizedString;
  value: any;
  /**
   * non-selectable group header; skipped by keyboard nav, type-ahead,
   * and mouse selection
   */
  isHeader?: boolean;
  /**
   * action option: choosing it invokes this callback instead of committing
   * a value, and the menu stays open (e.g. "show more options")
   */
  onSelect?: () => void;
}

export const FloaterSpacer = styled.div`
  width: 8px;
  flex-shrink: 0;
`;

const SimpleSelectDiv = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  /* behave like a native <select>: one consistent cursor over the whole
     control, and no text-selection I-beam over option labels */
  cursor: default;
  user-select: none;
`;

const SimpleSelectButton = styled.button`
  cursor: default;

  background: ${(props) => props.theme.inputBackground};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 2px;
  color: inherit;
  font: inherit;
  text-align: left;
  padding: 0;

  transition: border-color 0.1s;

  &:hover {
    border-color: ${(props) => props.theme.inputBorderFocused};
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
  display: flex;
  flex-flow: row;
  align-items: center;
  background: ${(props) => props.theme.inputBackground};

  /* selection is marked by the checkmark; backgrounds form a brightness
     ladder so the keyboard cursor stays visible on the selected option */
  &.focused {
    background: ${(props) => props.theme.inputFocusedBackground};
  }

  &.selected {
    background: ${(props) => props.theme.inputSelectedBackground};
  }

  &.focused.selected {
    background: ${(props) => lighten(0.1, props.theme.inputSelectedBackground)};
  }
`;

const OptionCheckmark = styled.span`
  flex-shrink: 0;
  width: 1.5em;
  font-size: 80%;
  opacity: 0;

  &.selected {
    opacity: 1;
  }
`;

class OptionWrapper extends React.PureComponent<
  React.HTMLAttributes<HTMLDivElement>
> {
  el: HTMLElement | null = null;

  override render() {
    return <OptionWrapperDiv {...this.props} ref={this.gotEl} />;
  }

  gotEl = (el: HTMLElement | null) => {
    this.el = el;
    if (this.el) {
      this.updateScroll();
    }
  };

  override componentDidUpdate() {
    this.updateScroll();
  }

  updateScroll() {
    const { className } = this.props;
    if (this.el && /focused/.test(className ?? "")) {
      (this.el as any).scrollIntoViewIfNeeded();
    }
  }
}

export const Bar = styled.div`
  height: auto;
  width: 1px;
  background: ${(props) => props.theme.inputBorderFocused};
  align-self: stretch;
`;

export const IconWrapper = styled.div`
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
  /* at least as wide as the trigger, but grow so long options aren't cut */
  min-width: 100%;
  width: max-content;
  max-width: 400px;
  padding: 4px 0;
  border-radius: 2px;

  border: 1px solid ${(props) => props.theme.inputBorder};

  z-index: 10;

  /* keep the popup short enough that it doesn't spill past the modal and
     make the surrounding dialog scroll; it scrolls internally instead */
  max-height: 230px;
  overflow-y: auto;
`;

const DummyOption = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
  color: ${(props) => props.theme.ternaryText};
`;

const GroupHeaderDiv = styled.div`
  /* generous top space separates the group from the row above (instead of a
     cramped divider line); text lines up with the option icons below it */
  padding: 14px calc(${wrapperPadding}px + 1.5em) 5px;
  font-size: 70%;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${(props) => props.theme.secondaryText};
  background: ${(props) => props.theme.inputBackground};
`;

const searchClearThreshold = 2000; // 2 seconds
const keyboardFocusTimeout = 250;

// unique DOM ids for aria-controls/aria-activedescendant wiring
let instanceSeed = 0;

export default class SimpleSelect<
  OptionType extends BaseOptionType
> extends React.PureComponent<Props<OptionType>, State<OptionType>> {
  idPrefix: string;

  constructor(props: Props<OptionType>) {
    super(props);
    this.idPrefix = `simple-select-${++instanceSeed}`;
    this.state = {
      open: false,
      focusedValue: find(props.options, (o) => !o.isHeader),
      search: "",
      lastSearchAt: Date.now(),
      lastKeyboardFocusAt: 0,
    };
  }

  override componentDidUpdate(prevProps: Props<OptionType>) {
    const { open, focusedValue } = this.state;
    // the option list can change while the menu stays open - e.g. an action
    // option reveals more options and removes itself. if the focused option
    // is gone, keyboard nav and aria-activedescendant would break, so move
    // focus to the first newly-revealed option (falling back to the first
    // selectable one).
    if (!open || !focusedValue) {
      return;
    }
    if (this.indexOfOption(focusedValue) !== -1) {
      return;
    }
    const prevValues = new Set(
      prevProps.options.map((o) => JSON.stringify(o.value))
    );
    const fresh = this.props.options.find(
      (o) =>
        !o.isHeader && !o.onSelect && !prevValues.has(JSON.stringify(o.value))
    );
    if (fresh) {
      this.setState({ focusedValue: fresh });
      return;
    }
    const idx = this.nearestSelectable(0, 1);
    this.setState({
      focusedValue: idx >= 0 ? this.props.options[idx] : undefined,
    });
  }

  listboxId() {
    return `${this.idPrefix}-listbox`;
  }

  optionId(index: number) {
    return `${this.idPrefix}-option-${index}`;
  }

  // options arrays are often rebuilt by parent re-renders, so a stored
  // option reference can go stale; match by value, not identity
  indexOfOption(target: OptionType | undefined): number {
    if (!target) {
      return -1;
    }
    return findIndex(
      this.props.options,
      (x) => x === target || isEqual(x.value, target.value)
    );
  }

  // nearest selectable (non-header) option index, scanning dir first,
  // then the opposite way; -1 if none
  nearestSelectable(from: number, dir: 1 | -1): number {
    const { options } = this.props;
    for (let i = from; i >= 0 && i < options.length; i += dir) {
      if (!options[i].isHeader) {
        return i;
      }
    }
    for (let i = from; i >= 0 && i < options.length; i -= dir) {
      if (!options[i].isHeader) {
        return i;
      }
    }
    return -1;
  }

  override render() {
    const {
      value,
      options,
      OptionComponent = DefaultOptionComponent,
      isLoading,
      className,
      ariaLabelledBy,
    } = this.props;
    const { open, focusedValue } = this.state;

    const focusedIndex = this.indexOfOption(focusedValue);

    return (
      <SimpleSelectDiv className={className}>
        <SimpleSelectButton
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={ariaLabelledBy}
          aria-controls={this.listboxId()}
          aria-activedescendant={
            open && focusedIndex >= 0 ? this.optionId(focusedIndex) : undefined
          }
          onClick={this.onToggle}
          onKeyDown={this.onKeyDown}
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
            <Bar aria-hidden="true" />
            <IconWrapper aria-hidden="true">
              {/* not the Icon component: its aria-label would leak the
                  icon's internal name into the combobox value */}
              <span className="icon icon-caret-down" />
            </IconWrapper>
          </ValueWrapper>
        </SimpleSelectButton>
        <OptionsAnchorDiv>{this.renderOptions()}</OptionsAnchorDiv>
      </SimpleSelectDiv>
    );
  }

  onKeyDown = (ev: React.KeyboardEvent<HTMLElement>) => {
    const { open } = this.state;

    if (
      ev.key === "ArrowUp" ||
      ev.key === "PageUp" ||
      ev.key === "ArrowDown" ||
      ev.key === "PageDown" ||
      ev.key === "Home" ||
      ev.key === "End"
    ) {
      ev.preventDefault();
      if (!open) {
        this.open();
        return;
      }

      const { options } = this.props;
      let { focusedValue } = this.state;
      if (!focusedValue) {
        focusedValue = this.props.value;
      }

      if (!focusedValue) {
        // nothing focused or selected yet: focus the first selectable option
        const idx = this.nearestSelectable(0, 1);
        if (idx >= 0) {
          this.setState({
            focusedValue: options[idx],
            lastKeyboardFocusAt: Date.now(),
          });
        }
        return;
      }
      let currentIndex = this.indexOfOption(focusedValue);
      let newIndex = currentIndex;
      // which way to look when we land on a group header
      let dir: 1 | -1 = 1;

      if (ev.key === "ArrowUp") {
        newIndex -= 1;
        dir = -1;
      } else if (ev.key === "ArrowDown") {
        newIndex += 1;
      } else if (ev.key === "PageUp") {
        newIndex -= 5;
        dir = -1;
      } else if (ev.key === "PageDown") {
        newIndex += 5;
      } else if (ev.key === "Home") {
        newIndex = 0;
      } else if (ev.key === "End") {
        newIndex = options.length - 1;
        dir = -1;
      }

      if (newIndex < 0) {
        newIndex = 0;
      } else if (newIndex >= options.length) {
        newIndex = options.length - 1;
      }

      newIndex = this.nearestSelectable(newIndex, dir);
      if (newIndex < 0) {
        return;
      }

      let newFocusedValue = options[newIndex];
      this.setState({
        focusedValue: newFocusedValue,
        lastKeyboardFocusAt: Date.now(),
      });
      return;
    }

    if (ev.key === "Enter") {
      // prevent the button's synthesized click, which would immediately
      // toggle the menu right back open (or fire a spurious onChange)
      ev.preventDefault();
      if (open) {
        this.commitFocused();
      } else {
        this.open();
      }
      return;
    }

    if (ev.key === "Escape") {
      if (open) {
        ev.preventDefault();
        this.close();
      }
      return;
    }

    // printable characters do type-ahead (preventDefault also swallows the
    // space key's native button activation, which would toggle the menu)
    if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();

      const state = this.state;
      const searchActive =
        state.search !== "" &&
        Date.now() - state.lastSearchAt <= searchClearThreshold;

      // space acts like Enter (open/commit), unless it's continuing a
      // type-ahead search for a label with a space in it
      if (ev.key === " " && !searchActive) {
        if (open) {
          this.commitFocused();
        } else {
          this.open();
        }
        return;
      }

      const prefix = searchActive ? state.search : "";
      const search = (prefix + ev.key).toLowerCase();

      const applySearch = () => {
        this.setState({
          search,
          lastSearchAt: Date.now(),
        });

        const focusedValue = find(
          this.props.options,
          (x, i) =>
            !x.isHeader &&
            !x.onSelect &&
            this.optionText(x, i).startsWith(search)
        );
        if (focusedValue) {
          this.setState({ focusedValue, lastKeyboardFocusAt: Date.now() });
        }
      };

      if (open) {
        applySearch();
      } else {
        // open first so localized option text is in the DOM to match against
        this.setState(
          { open: true, focusedValue: this.props.value },
          applySearch
        );
      }
    }
  };

  // lower-cased display text of an option: plain string labels directly,
  // localized labels via their rendered DOM text (only available when open)
  optionText(option: OptionType, index: number): string {
    if (typeof option.label === "string") {
      return option.label.toLowerCase();
    }
    const el = document.getElementById(this.optionId(index));
    if (el) {
      return el.textContent.trim().toLowerCase();
    }
    return "";
  }

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

    const focusedIndex = this.indexOfOption(focusedValue);
    const selectedIndex = this.indexOfOption(value);

    return (
      <OptionsDiv role="listbox" id={this.listboxId()}>
        {options.map((option, i) => {
          if (option.isHeader) {
            return (
              <GroupHeaderDiv
                key={i}
                // keeps option ids aligned with indices for aria/type-ahead
                id={this.optionId(i)}
                role="presentation"
                // don't blur the trigger button (which would close the menu)
                onMouseDown={this.onOptionMouseDown}
              >
                {T(option.label)}
              </GroupHeaderDiv>
            );
          }
          const focused = i === focusedIndex;
          const selected = i === selectedIndex;
          return (
            <OptionWrapper
              key={i}
              id={this.optionId(i)}
              role="option"
              aria-selected={selected}
              className={classNames({ focused, selected })}
              data-value={JSON.stringify(option.value)}
              onMouseDown={this.onOptionMouseDown}
              onClick={this.onOptionClick}
              onMouseEnter={this.onOptionMouseEnter}
            >
              <OptionCheckmark
                aria-hidden="true"
                className={classNames("icon icon-checkmark", { selected })}
              />
              <OptionComponent key={i} option={option} />
            </OptionWrapper>
          );
        })}
      </OptionsDiv>
    );
  }

  onOptionMouseDown = (ev: React.MouseEvent<HTMLDivElement>) => {
    // options live outside the trigger button now: without this, mousedown
    // would blur the button and close the menu before the click lands.
    // per-option (not on the listbox) so the scrollbar stays draggable
    ev.preventDefault();
  };

  onOptionClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    ev.stopPropagation();
    const option = this.getValueForWrapper(ev.currentTarget);
    if (option?.onSelect) {
      // action option: run its callback and leave the menu open
      option.onSelect();
      return;
    }
    if (option) {
      this.props.onChange(option);
    }
    this.close();
  };

  // commit the focused option: run its action callback (menu stays open) or
  // select its value and close
  commitFocused() {
    const focused = this.state.focusedValue;
    if (focused?.onSelect) {
      focused.onSelect();
      return;
    }
    this.close();
    if (focused != null) {
      this.props.onChange(focused);
    }
  }

  onOptionMouseEnter = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() - this.state.lastKeyboardFocusAt < keyboardFocusTimeout) {
      return;
    }

    this.setState({ focusedValue: this.getValueForWrapper(ev.currentTarget) });
  };

  getValueForWrapper(el: HTMLElement) {
    let dataValue = JSON.parse(el.dataset.value ?? "null") as any;
    const { options } = this.props;
    return options.find((o) => o.value === dataValue);
  }

  onToggle = () => {
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
  /** undefined when nothing is selected (yet) */
  value: OptionType | undefined;
  onChange: OnChange<OptionType>;
  isLoading?: boolean;
  OptionComponent?: React.ComponentType<OptionComponentProps<OptionType>>;
  className?: string;
  /** id of the element labelling this select, for screen readers */
  ariaLabelledBy?: string;
}

interface State<OptionType> {
  open: boolean;
  /** undefined when there are no options to focus */
  focusedValue: OptionType | undefined;
  search: string;
  lastSearchAt: number;
  lastKeyboardFocusAt: number;
}
