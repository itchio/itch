import React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";
import { createStructuredSelector } from "reselect";

import format from "./format";

import { IRootState, TabLayout } from "../types";

import Icon from "./basics/icon";
import Filler from "./basics/filler";

import styled, * as styles from "./styles";
import { css } from "./styles";
import FiltersContainer from "./filters-container";
import Link from "./basics/link";
import Criterion from "./basics/criterion";
import { Space } from "../helpers/space";
import { size } from "underscore";

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

const SecondaryText = styled.section`
  color: ${props => props.theme.secondaryText};
`;

const LayoutPickers = styled.section`
  display: flex;
`;

const Spacer = styled.div`
  width: 10px;
  height: 1px;
`;

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
    props.active
      ? css`
          filter: brightness(100%);
        `
      : ""};
`;

class GameFilters extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const {
      before,
      after,
      showBinaryFilters = true,
      showLayoutPicker = true,
      numItems,
      loading,
    } = this.props;

    return (
      <FiltersContainer loading={loading}>
        {before}
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

        {numItems < 0 ? null : (
          <SecondaryText>
            {format(["grid.item_count", { count: numItems }])}
          </SecondaryText>
        )}

        {this.props.children ? (
          <>
            <Spacer />
            {this.props.children}
          </>
        ) : null}
        <Filler />
        {after}
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

  loading: boolean;

  before?: JSX.Element;
  after?: JSX.Element;
}

const actionCreators = actionCreatorsList("updatePreferences");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  layout: TabLayout;
  onlyCompatibleGames: boolean;
  onlyOwnedGames: boolean;
  onlyInstalledGames: boolean;

  numItems: number;
};

export default connect<IProps>(GameFilters, {
  state: (initialState, props: IProps) => {
    return createStructuredSelector({
      layout: (rs: IRootState) => rs.preferences.layout,
      onlyCompatibleGames: (rs: IRootState) =>
        rs.preferences.onlyCompatibleGames,
      onlyOwnedGames: (rs: IRootState) => rs.preferences.onlyOwnedGames,
      onlyInstalledGames: (rs: IRootState) => rs.preferences.onlyInstalledGames,
      numItems: (rs: IRootState) => {
        return size(Space.fromState(rs, props.tab).games().ids);
      },
    });
  },
  actionCreators,
});
