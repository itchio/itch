import * as React from "react";
import { connect } from "./connect";
import { createStructuredSelector } from "reselect";

import * as actions from "../actions";

import { formatString } from "./format";

import { IAppState, TabLayout } from "../types";
import { dispatcher } from "../constants/action-types";

import Ink = require("react-ink");
import Select = require("react-select");
import Icon from "./basics/icon";

import styled, * as styles from "./styles";
import { css } from "./styles";
import { injectIntl, InjectedIntl } from "react-intl";

interface ILayoutPickerProps {
  theme?: styles.ITheme;
  active?: boolean;
}

export const FiltersContainer = styled.section`
  display: flex;
  align-items: center;
  width: 100%;
  background: ${props => props.theme.breadBackground};
  box-shadow: 0 4px 8px -4px ${props => props.theme.breadBackground};
  flex-shrink: 0;
  padding-left: 10px;
  padding-right: 4px;
  min-height: 40px;
`;

const Filler = styled.div`flex-grow: 1;`;

const TagFilters = styled.section`
  margin: 4px 0;

  flex-grow: 100;

  .Select {
    width: 100%;
    max-width: 500px;
    font-size: 14px;

    &.Select--multi {
      .Select-value {
        background-color: rgba(97, 97, 97, 0.7);
        color: #d8d8d8;

        &,
        .Select-value-icon {
          border-color: transparent;
        }

        .Select-value-label {
          font-size: 14px;
          line-height: 1.6;
        }

        .Select-value-icon {
          font-size: 18px;
          padding: 1px 3px 0px 5px;

          &:hover,
          &:focus {
            color: white;
            background-color: rgba(97, 97, 97, 0.5);
          }
        }
      }

      .Select-input input {
        color: white;
        margin-top: 5px;
      }

      .Select-control {
        height: 40px;

        background: none !important;
        border: none !important;
        box-shadow: none !important;

        .Select-placeholder {
          line-height: 40px;
        }
      }
    }
  }
`;

const LayoutPickers = styled.section`display: flex;`;

const LayoutPicker = styled.section`
  ${styles.inkContainer()} padding: 10px 10px;
  border-radius: 50%;
  font-size: 90%;
  filter: brightness(60%);

  &:hover {
    cursor: pointer;
    filter: brightness(80%);
  }

  ${(props: ILayoutPickerProps) =>
    props.active ? css`filter: brightness(100%)` : ""};
`;

class GameFilters extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const {
      onlyCompatible,
      onlyOwned,
      onlyInstalled,
      showBinaryFilters = true,
      showLayoutPicker = true,
      intl,
    } = this.props;

    const compatibleOption = {
      value: "onlyCompatibleGames",
      label: formatString(intl, ["grid.filters.options.compatible"]),
    };

    const ownedOption = {
      value: "onlyOwnedGames",
      label: formatString(intl, ["grid.filters.options.owned"]),
    };

    const installedOption = {
      value: "onlyInstalledGames",
      label: formatString(intl, ["grid.filters.options.installed"]),
    };

    const options = [compatibleOption, ownedOption, installedOption];

    const value = [];
    if (onlyCompatible) {
      value.push(compatibleOption);
    }
    if (onlyOwned) {
      value.push(ownedOption);
    }
    if (onlyInstalled) {
      value.push(installedOption);
    }

    return (
      <FiltersContainer>
        {showBinaryFilters
          ? <TagFilters>
              <Select
                className="game-filters-input"
                multi={true}
                options={options}
                value={value}
                autoBlur={true}
                noResultsText={formatString(intl, [
                  "grid.filters.options.no_results",
                ])}
                onChange={(vals: { value: string }[]) => {
                  const prefs = {
                    onlyCompatibleGames: false,
                    onlyInstalledGames: false,
                    onlyOwnedGames: false,
                  } as {
                    [key: string]: boolean;
                  };

                  for (const val of vals) {
                    prefs[val.value] = true;
                  }
                  this.props.updatePreferences(prefs);
                }}
                placeholder={formatString(intl, ["grid.criterion.filter"])}
              />
            </TagFilters>
          : null}

        {this.props.children}
        <Filler />
        {showLayoutPicker ? this.renderLayoutPickers() : null}
      </FiltersContainer>
    );
  }

  renderLayoutPickers() {
    return (
      <LayoutPickers>
        {this.renderLayoutPicker("grid", "grid")}
        {this.renderLayoutPicker("table", "list")}
      </LayoutPickers>
    );
  }

  renderLayoutPicker(layout: TabLayout, icon: string) {
    const active = this.props.layout === layout;

    return (
      <LayoutPicker
        active={active}
        className="layout-picker"
        data-layout={layout}
        onClick={e => this.props.updatePreferences({ layout })}
      >
        <Icon icon={icon} />
        <Ink />
      </LayoutPicker>
    );
  }
}

interface IProps {
  /** id of the tab this filter is for (for remembering queries, etc.) */
  tab: string;

  /** whether or not to show binary filters ('only compatible', etc.) */
  showBinaryFilters?: boolean;
  showLayoutPicker?: boolean;
}

interface IDerivedProps {
  layout: TabLayout;
  onlyCompatible: boolean;
  onlyOwned: boolean;
  onlyInstalled: boolean;

  updatePreferences: typeof actions.updatePreferences;

  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(GameFilters), {
  state: (initialState, props) => {
    return createStructuredSelector({
      layout: (state: IAppState) => state.preferences.layout,
      onlyCompatible: (state: IAppState) =>
        state.preferences.onlyCompatibleGames,
      onlyOwned: (state: IAppState) => state.preferences.onlyOwnedGames,
      onlyInstalled: (state: IAppState) => state.preferences.onlyInstalledGames,
    });
  },
  dispatch: dispatch => ({
    updatePreferences: dispatcher(dispatch, actions.updatePreferences),
  }),
});
