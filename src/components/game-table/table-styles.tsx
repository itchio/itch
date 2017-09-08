import * as React from "react";
import styled, * as styles from "../styles";
import { darken } from "polished";
import { css } from "../styles";

const titleSection = () => css`
  max-width: 500px;
  white-space: normal;
`;

const column = () => css`
  padding: 0.1em 0.1em;
  height: 100%;
  overflow: hidden;

  &:not(.row--header) {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
`;

const dateColumn = () => css`
  &:not(.row--header) {
    display: flex;
    font-size: 90%;
    color: ${props => props.theme.secondaryText};
  }
`;

export interface ITableSizes {
  cover: number;
  title: number;
  "play-time": number;
  "last-played": number;
  "installed-size": number;
  published: number;
  "install-status": number;
}

interface ITableProps {
  sizes: ITableSizes;
  children: (JSX.Element | JSX.Element[])[];
}

const StylableDiv = (props: ITableProps) => {
  const { sizes, children, ...restProps } = props;
  return <div {...restProps}>{children}</div>;
};

const rowHeight = 70;

export const TableContainerDiv = styled(StylableDiv)`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .table--row,
  .table--header {
    display: flex;
    flex-direction: row;
    padding: 0.25em;
    border-left: 2px solid transparent;
  }

  .table--header {
    height: 40px;
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
  }

  .table--row {
    position: absolute;
    transition: transform 0.2s, border-color 0.2s;

    height: ${rowHeight}px;
    overflow: hidden;

    font-size: ${props => props.theme.fontSizes.large};

    &:hover {
      background-color: ${props => darken(0.05, props.theme.meatBackground)};
      border-color: ${props => props.theme.accent};
      cursor: pointer;
    }
  }

  .row--header {
    &:hover {
      cursor: pointer;
    }

    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .header--spacer {
    display: inline-block;
    width: 0.5em;
    height: 1px;
  }

  .row--cover {
    align-self: center;
    overflow: hidden;
    width: ${props => props.sizes.cover}px;
    padding-right: 0.6em;
  }

  .row--title {
    ${column()};
    width: ${props => props.sizes.title}px;
  }

  .row--play-time {
    ${column()};
    ${dateColumn()};
    width: ${props => props.sizes["play-time"]}px;
  }

  .row--last-played {
    ${column()};
    ${dateColumn()};
    width: ${props => props.sizes["last-played"]}px;
  }

  .row--published {
    ${column()};
    ${dateColumn()};
    width: ${props => props.sizes["published"]}px;
  }

  .row--installed-size {
    ${column()};
    ${dateColumn()};
    width: ${props => props.sizes["installed-size"]}px;
  }

  .row--install-status {
    ${column()};
    width: ${props => props.sizes["install-status"]}px;

    &:not(.row--status) {
      font-size: 80%;
    }
  }

  .title--name {
    ${titleSection()};
    ${styles.singleLine()};

    font-weight: bold;
    margin-bottom: 0.25em;
  }

  .title--description {
    ${titleSection()};

    font-size: 90%;
    color: ${props => props.theme.secondaryText};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

export const TableDiv = styled.div`
  flex-grow: 1;
  overflow-y: scroll;
  position: relative;
`;
