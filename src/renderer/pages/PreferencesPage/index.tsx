import { Dispatch } from "common/types";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import AdvancedSettings from "renderer/pages/PreferencesPage/AdvancedSettings";
import BehaviorSettings from "renderer/pages/PreferencesPage/BehaviorSettings";
import LanguageSettings from "renderer/pages/PreferencesPage/LanguageSettings";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import InstallLocationSettings from "renderer/pages/PreferencesPage/InstallLocationSettings";

const PreferencesDiv = styled.div`
  ${styles.meat};
`;

const PreferencesContentDiv = styled.div`
  overflow-y: auto;
  padding: 0px 20px 30px 20px;
  font-size: 20px;

  color: ${(props) => props.theme.baseText};

  .heading,
  h2 {
    font-size: 18px;
  }

  h2 {
    padding: 10px 15px;
    margin-top: 20px;
    margin-bottom: 5px;
    flex-shrink: 0;
  }

  .icon.turner {
    display: inline-block;
    width: 15px;
    text-align: center;
    transform: rotateZ(0deg);
    transition: transform 0.2s ease-in-out;

    &.turned {
      transform: rotateZ(90deg);
    }
  }

  .preferences-form {
    z-index: 5;
  }

  .advanced-form {
    .section {
      margin: 8px 0;

      &.component {
        margin-left: 16px;
      }

      &:first-child {
        margin-top: 0;
      }
    }

    .button:hover {
      cursor: pointer;
    }
  }

  .explanation {
    padding: 0 15px;
    margin: 15px 0 0 0;

    color: #b9b9b9;
    font-size: 14px;
    max-width: 500px;
    border-radius: $explanation-border-radius;
    line-height: 1.6;

    &.drop-down {
      animation: soft-drop 0.8s;
    }

    &.flex {
      display: flex;
      flex-shrink: 0;

      a,
      .link {
        margin-left: 8px;
        display: flex;
      }
    }

    a,
    .link {
      text-decoration: underline;
      color: #ececec;

      &:hover {
        cursor: pointer;
      }
    }
  }

  .link-box {
    margin: 20px 15px;
    font-size: 80%;

    .icon {
      margin-right: 8px;
    }

    a {
      color: #87a7c3;
      text-decoration: none;
    }
  }
`;

class PreferencesPage extends React.PureComponent<Props> {
  componentDidMount() {
    dispatchTabPageUpdate(this.props, {
      label: ["sidebar.preferences"],
    });
  }

  render() {
    return (
      <PreferencesDiv>
        <PreferencesContentDiv>
          <LanguageSettings />
          <InstallLocationSettings />
          <BehaviorSettings />
          <AdvancedSettings />
        </PreferencesContentDiv>
      </PreferencesDiv>
    );
  }
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;
}

export default hook()(withTab(PreferencesPage));
