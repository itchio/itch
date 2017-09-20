import * as React from "react";

import Icon from "./icon";

import taskToIcon from "../../constants/icon-for-tasks";

/**
 * An icon that represents the state of a given task
 */
class TaskIcon extends React.PureComponent<ITaskIconProps> {
  render() {
    const { task = "", action = "launch", animate = false } = this.props;

    let icon = taskToIcon[task] || "";
    if (task === "idle") {
      if (action === "open") {
        icon = "folder-open";
      } else {
        icon = "play";
      }
    }

    const className = animate ? "scan" : "";
    return <Icon icon={icon} className={className} />;
  }
}

interface ITaskIconProps {
  task: string;
  action?: string;
  animate?: boolean;
}

export default TaskIcon;
