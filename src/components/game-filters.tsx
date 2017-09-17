import * as React from "react";
import { connect } from "./connect";
import { createStructuredSelector } from "reselect";

import * as actions from "../actions";

import format from "./format";

import { IRootState, TabLayout } from "../types";
import { dispatcher } from "../constants/action-types";

import Icon from "./basics/icon";
import Filler from "./basics/filler";

import styled, * as styles from "./styles";
import { css } from "./styles";
import { FiltersContainer } from "./filters-container";
import Link from "./basics/link";
import Criterion from "./basics/criterion";

interface ILayoutPickerProps {
  theme?: styles.ITheme;
  active?: boolean;
}

const TagFilters = styled.section`
  margin: 4px 0;

  flex-grow: 100;
  display: flex;
  flex-direction: row;
  align-items: center;

  .spacer {
    width: 10px;
    height: 1;
  }
`;

const LayoutPickers = styled.section`display: flex;`;

const LayoutPicker = styled.section`
  padding: 10px;
  border-radius: 50%;
  font-size: 90%;
  filter: brightness(60%);

  &:hover {
    cursor: pointer;
    filter: brightness(80%);
  }

  ${(props: ILayoutPickerProps) =>
    props.active ? css`filter: brightness(100%);` : ""};
`;

class GameFilters extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { showBinaryFilters = true, showLayoutPicker = true } = this.props;

    return (
      <FiltersContainer>
        {showBinaryFilters ? (
          <TagFilters>
            {format(["grid.criterion.filter_by"])}
            <div className="spacer" />
            {this.renderCriterion(
              "onlyCompatibleGames",
              format(["grid.filters.options.compatible"])
            )}
            {this.renderCriterion(
              "onlyOwnedGames",
              format(["grid.filters.options.owned"])
            )}
            {this.renderCriterion(
              "onlyInstalledGames",
              format(["grid.filters.options.installed"])
            )}
            <div className="spacer" />

            {this.props.onlyCompatibleGames ||
            this.props.onlyOwnedGames ||
            this.props.onlyInstalledGames ? (
              <Link
                className="game-filters--clear"
                onClick={() => {
                  const prefs = {
                    onlyCompatibleGames: false,
                    onlyInstalledGames: false,
                    onlyOwnedGames: false,
                  };
                  this.props.updatePreferences(prefs);
                }}
              >
                {format(["grid.clear_filters"])}
              </Link>
            ) : null}
          </TagFilters>
        ) : null}

        {this.props.children}
        <Filler />
        {showLayoutPicker ? this.renderLayoutPickers() : null}
      </FiltersContainer>
    );
  }

  renderCriterion(key: string, label: string | JSX.Element) {
    return (
      <Criterion
        label={label}
        checked={this.props[key]}
        onChange={checked => this.props.updatePreferences({ [key]: checked })}
      />
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
  onlyCompatibleGames: boolean;
  onlyOwnedGames: boolean;
  onlyInstalledGames: boolean;

  updatePreferences: typeof actions.updatePreferences;
}

export default connect<IProps>(GameFilters, {
  state: (initialState, props) => {
    return createStructuredSelector({
      layout: (rs: IRootState) => rs.preferences.layout,
      onlyCompatibleGames: (rs: IRootState) =>
        rs.preferences.onlyCompatibleGames,
      onlyOwnedGames: (rs: IRootState) => rs.preferences.onlyOwnedGames,
      onlyInstalledGames: (rs: IRootState) => rs.preferences.onlyInstalledGames,
    });
  },
  dispatch: dispatch => ({
    updatePreferences: dispatcher(dispatch, actions.updatePreferences),
  }),
});
